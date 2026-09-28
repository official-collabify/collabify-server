variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "gen-lang-client-0072932240"
}

variable "region" {
  description = "The GCP region for the benchmark"
  type        = string
  default     = "asia-south1"
}

variable "zone" {
  description = "The GCP zone for the benchmark"
  type        = string
  default     = "asia-south1-a"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "benchmark"
}

variable "controller_machine_type" {
  description = "Machine type for the k3s control plane + data services node"
  type        = string
  default     = "e2-medium"
}

variable "worker_machine_type" {
  description = "Machine type for the k3s worker nodes"
  type        = string
  default     = "e2-medium"
}

variable "ssh_user" {
  description = "SSH username for instance provisioning"
  type        = string
  default     = "jimmy"
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key file"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "k3s_token" {
  description = "Pre-shared secret token for k3s cluster join"
  type        = string
  default     = "collabify-bench-secure-token-2026"
  sensitive   = true
}
