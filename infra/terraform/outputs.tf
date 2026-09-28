output "controller_public_ip" {
  description = "Public IP of the Collabify controller & data node"
  value       = google_compute_instance.controller.network_interface[0].access_config[0].nat_ip
}

output "controller_private_ip" {
  description = "Internal VPC IP of the controller node"
  value       = google_compute_instance.controller.network_interface[0].network_ip
}

output "ingest_public_ip" {
  description = "Public IP of the web/WebSocket ingest node"
  value       = google_compute_instance.ingest.network_interface[0].access_config[0].nat_ip
}

output "worker_public_ip" {
  description = "Public IP of the asynchronous worker node"
  value       = google_compute_instance.worker.network_interface[0].access_config[0].nat_ip
}

output "vault_bucket_name" {
  description = "Ephemeral GCS bucket for Collabify vault storage"
  value       = google_storage_bucket.vault.name
}

output "whiteboard_bucket_name" {
  description = "Ephemeral GCS bucket for Collabify whiteboard snapshots"
  value       = google_storage_bucket.whiteboard.name
}

output "ssh_command" {
  description = "SSH command to access the cluster controller"
  value       = "ssh -i ${var.ssh_public_key_path} ${var.ssh_user}@${google_compute_instance.controller.network_interface[0].access_config[0].nat_ip}"
}
