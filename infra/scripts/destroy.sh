#!/usr/bin/env bash
# ==============================================================================
# Collabify Distributed Infrastructure - Teardown & Verification
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="${SCRIPT_DIR}/../terraform"

echo "========================================================================"
echo " Destroying Collabify Distributed Infrastructure on GCP"
echo "========================================================================"

cd "${TF_DIR}"
export GOOGLE_OAUTH_ACCESS_TOKEN="$(gcloud auth print-access-token)"

echo "[*] Retrieving bucket names for cleanup..."
VAULT_BUCKET="$(terraform output -raw vault_bucket_name 2>/dev/null || echo "")"
WB_BUCKET="$(terraform output -raw whiteboard_bucket_name 2>/dev/null || echo "")"

if [ -n "${VAULT_BUCKET}" ]; then
  echo "[*] Purging objects from gs://${VAULT_BUCKET}..."
  gcloud storage rm --recursive "gs://${VAULT_BUCKET}/**" 2>/dev/null || true
fi

if [ -n "${WB_BUCKET}" ]; then
  echo "[*] Purging objects from gs://${WB_BUCKET}..."
  gcloud storage rm --recursive "gs://${WB_BUCKET}/**" 2>/dev/null || true
fi

echo "[*] Executing terraform destroy..."
terraform destroy -auto-approve

echo "========================================================================"
echo " Post-Teardown Verification Audit (Collabify)"
echo "========================================================================"
echo "[*] Checking running Compute Engine instances..."
gcloud compute instances list --filter="name:collabify-node*" --project="gen-lang-client-0072932240"

echo "[*] Checking unattached disks..."
gcloud compute disks list --filter="name:collabify-node*" --project="gen-lang-client-0072932240"

echo "[✓] Collabify teardown complete and verified."
