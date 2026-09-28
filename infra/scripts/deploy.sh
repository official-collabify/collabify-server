#!/usr/bin/env bash
# ==============================================================================
# Collabify Distributed Deployment Orchestrator
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TF_DIR="${SCRIPT_DIR}/../terraform"
K8S_DIR="${SCRIPT_DIR}/../kubernetes"
KUBECONFIG_PATH="/tmp/collabify-kubeconfig"

echo "========================================================================"
echo " Deploying Collabify onto Distributed 3-Node k3s Cluster on GCP"
echo "========================================================================"

cd "${TF_DIR}"
export GOOGLE_OAUTH_ACCESS_TOKEN="$(gcloud auth print-access-token)"

echo "[*] Querying node IP addresses from Terraform outputs..."
CONTROLLER_IP="$(terraform output -raw controller_public_ip)"
INGEST_IP="$(terraform output -raw ingest_public_ip)"
WORKER_IP="$(terraform output -raw worker_public_ip)"

echo "  Controller: ${CONTROLLER_IP}"
echo "  Ingest:     ${INGEST_IP}"
echo "  Worker:     ${WORKER_IP}"

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5"

# 1. Wait for SSH availability
echo "[*] Waiting for SSH on controller node (${CONTROLLER_IP})..."
while ! ssh ${SSH_OPTS} "jimmy@${CONTROLLER_IP}" "echo ready" &>/dev/null; do
  sleep 3
done
echo "[✓] Controller SSH is reachable."

# 2. Bootstrap k3s server on controller if not installed
echo "[*] Ensuring k3s server is running on controller..."
if ! ssh ${SSH_OPTS} "jimmy@${CONTROLLER_IP}" "sudo k3s kubectl get nodes" &>/dev/null; then
  echo "[*] Bootstrapping k3s server on controller node..."
  ssh ${SSH_OPTS} "jimmy@${CONTROLLER_IP}" "sudo bash -c 'export HOME=/root && curl -fsSL https://bun.sh/install | bash && cp /root/.bun/bin/bun /usr/local/bin/bun || true && curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC=\"server --cluster-init --token=collabify-bench-secure-token-2026 --node-ip=10.10.1.10 --flannel-backend=vxlan --disable traefik --write-kubeconfig-mode 644\" sh -'"
fi

# 2a. Bootstrap k3s agent on ingest node if not installed
echo "[*] Ensuring k3s agent is running on ingest node..."
if ! ssh ${SSH_OPTS} "jimmy@${INGEST_IP}" "systemctl is-active --quiet k3s-agent" &>/dev/null; then
  echo "[*] Bootstrapping k3s agent on ingest node..."
  ssh ${SSH_OPTS} "jimmy@${INGEST_IP}" "sudo bash -c 'export HOME=/root && curl -fsSL https://bun.sh/install | bash && cp /root/.bun/bin/bun /usr/local/bin/bun || true && curl -sfL https://get.k3s.io | K3S_URL=https://10.10.1.10:6443 K3S_TOKEN=collabify-bench-secure-token-2026 INSTALL_K3S_EXEC=\"agent --node-ip=10.10.1.20\" sh -'"
fi

# 2b. Bootstrap k3s agent on worker node if not installed
echo "[*] Ensuring k3s agent is running on worker node..."
if ! ssh ${SSH_OPTS} "jimmy@${WORKER_IP}" "systemctl is-active --quiet k3s-agent" &>/dev/null; then
  echo "[*] Bootstrapping k3s agent on worker node..."
  ssh ${SSH_OPTS} "jimmy@${WORKER_IP}" "sudo bash -c 'export HOME=/root && curl -fsSL https://bun.sh/install | bash && cp /root/.bun/bin/bun /usr/local/bin/bun || true && curl -sfL https://get.k3s.io | K3S_URL=https://10.10.1.10:6443 K3S_TOKEN=collabify-bench-secure-token-2026 INSTALL_K3S_EXEC=\"agent --node-ip=10.10.1.30\" sh -'"
fi

# 3. Retrieve cluster kubeconfig
echo "[*] Fetching cluster kubeconfig..."
ssh ${SSH_OPTS} "jimmy@${CONTROLLER_IP}" "sudo cat /etc/rancher/k3s/k3s.yaml" | sed "s/127.0.0.1/${CONTROLLER_IP}/g" > "${KUBECONFIG_PATH}"
chmod 600 "${KUBECONFIG_PATH}"
kubectl config set-cluster default --insecure-skip-tls-verify=true --kubeconfig="${KUBECONFIG_PATH}" >/dev/null 2>&1 || true
sed -i '/certificate-authority-data/d' "${KUBECONFIG_PATH}" || true
export KUBECONFIG="${KUBECONFIG_PATH}"
echo "[✓] Cluster kubeconfig retrieved and configured."

# 4. Wait for worker nodes to join cluster
echo "[*] Waiting for all 3 nodes to join cluster and report Ready..."
while true; do
  READY_NODES=$(kubectl get nodes --no-headers 2>/dev/null | grep -c " Ready" || true)
  echo "  Ready nodes: ${READY_NODES}/3"
  if [ "${READY_NODES}" -ge 3 ]; then
    break
  fi
  sleep 4
done
echo "[*] Assigning Kubernetes tier roles..."
kubectl label node collabify-node-controller node-role.kubernetes.io/data=true --overwrite
kubectl label node collabify-node-ingest node-role.kubernetes.io/ingest=true --overwrite
kubectl label node collabify-node-worker node-role.kubernetes.io/worker=true --overwrite
kubectl get nodes -o wide

# 5. Package application code
echo "[*] Packaging Collabify application source code..."
TAR_PATH="/tmp/collabify-source.tar.gz"
tar --exclude="node_modules" --exclude=".git" --exclude="infra/terraform/.terraform" -czf "${TAR_PATH}" -C "${REPO_DIR}" .

# 6. Distribute source code and install dependencies on all nodes
NODES=("${CONTROLLER_IP}" "${INGEST_IP}" "${WORKER_IP}")
for NODE in "${NODES[@]}"; do
  echo "[*] Syncing application code to ${NODE}:/opt/collabify..."
  scp ${SSH_OPTS} "${TAR_PATH}" "jimmy@${NODE}:/tmp/collabify-source.tar.gz"
  ssh ${SSH_OPTS} "jimmy@${NODE}" "sudo ln -sf /usr/local/bin/bun /usr/local/bin/bunx || true && sudo chown -R jimmy:jimmy /opt/collabify && tar --no-same-owner -xzf /tmp/collabify-source.tar.gz -C /opt/collabify && cd /opt/collabify && bun install && bun x prisma generate"
done
echo "[✓] Source code and dependencies synchronized across all nodes."

# 7. Apply Kubernetes base, PostgreSQL, Redis, API, and Worker manifests
echo "[*] Applying Kubernetes manifests..."
kubectl apply -f "${K8S_DIR}/00-base.yaml"
kubectl apply -f "${K8S_DIR}/01-postgres.yaml"
kubectl apply -f "${K8S_DIR}/02-redis.yaml"

echo "[*] Waiting for PostgreSQL and Redis StatefulSets to become Ready..."
kubectl rollout status statefulset/collabify-postgres -n collabify --timeout=120s
kubectl rollout status statefulset/collabify-redis -n collabify --timeout=60s

# 8. Run PostgreSQL database migrations and permission seeds
echo "[*] Waiting for PostgreSQL port 5432 to become reachable on controller..."
while ! ssh ${SSH_OPTS} "jimmy@${CONTROLLER_IP}" "bash -c 'echo > /dev/tcp/127.0.0.1/5432' 2>/dev/null"; do
  sleep 2
done

echo "[*] Applying Prisma database migrations inside cluster..."
ssh ${SSH_OPTS} "jimmy@${CONTROLLER_IP}" "cd /opt/collabify && DATABASE_URL='postgresql://postgres:postgres@localhost:5432/collabify?schema=public' bun x prisma migrate deploy"

echo "[*] Seeding RBAC permissions..."
ssh ${SSH_OPTS} "jimmy@${CONTROLLER_IP}" "cd /opt/collabify && DATABASE_URL='postgresql://postgres:postgres@localhost:5432/collabify?schema=public' bun run prisma/seeds/index.ts"

# 9. Deploy Application Pods
echo "[*] Deploying Collabify API and Worker workloads..."
kubectl apply -f "${K8S_DIR}/03-api.yaml"
kubectl apply -f "${K8S_DIR}/04-workers.yaml"

echo "[*] Waiting for Collabify API to become Ready..."
kubectl rollout status deployment/collabify-api -n collabify --timeout=180s

echo "========================================================================"
echo " Verifying Live Deployment"
echo "========================================================================"
kubectl get pods -n collabify -o wide
kubectl get svc -n collabify

echo "[*] Probing API health endpoint on ingest node: http://${INGEST_IP}:30001/health..."
for i in {1..10}; do
  if curl -sf "http://${INGEST_IP}:30001/health"; then
    echo ""
    echo "[✓] Collabify is LIVE and HEALTHY on distributed GCP cluster!"
    break
  fi
  sleep 2
done
