#!/usr/bin/env bash
# ==============================================================================
# Collabify Distributed Infrastructure - Terraform Apply
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="${SCRIPT_DIR}/../terraform"

echo "========================================================================"
echo " Provisions Collabify Distributed Infrastructure on GCP"
echo "========================================================================"

cd "${TF_DIR}"
export GOOGLE_OAUTH_ACCESS_TOKEN="$(gcloud auth print-access-token)"

echo "[*] Initializing Terraform with GCS remote state..."
terraform init

echo "[*] Creating execution plan..."
terraform plan -out=tfplan

echo "[*] Applying infrastructure changes..."
terraform apply -auto-approve tfplan

echo "[✓] Collabify infrastructure provisioned successfully!"
terraform output
