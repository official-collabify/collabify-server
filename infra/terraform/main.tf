resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# ==============================================================================
# NETWORKING
# ==============================================================================
resource "google_compute_network" "vpc" {
  name                    = "collabify-vpc"
  auto_create_subnetworks = false
  description             = "Dedicated VPC for Collabify distributed benchmark cluster"
}

resource "google_compute_subnetwork" "subnet" {
  name          = "collabify-subnet-mumbai"
  ip_cidr_range = "10.10.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

resource "google_compute_firewall" "allow_internal" {
  name    = "collabify-allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.10.0.0/16"]
}

resource "google_compute_firewall" "allow_external" {
  name    = "collabify-allow-external"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443", "3001", "6443", "30000-32767"]
  }
  allow {
    protocol = "icmp"
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["collabify-node"]
}

# ==============================================================================
# EPHEMERAL STORAGE BUCKETS
# ==============================================================================
resource "google_storage_bucket" "vault" {
  name                        = "collabify-bench-vault-${random_id.bucket_suffix.hex}"
  location                    = var.region
  force_destroy               = true
  uniform_bucket_level_access = true
}

resource "google_storage_bucket" "whiteboard" {
  name                        = "collabify-bench-whiteboard-${random_id.bucket_suffix.hex}"
  location                    = var.region
  force_destroy               = true
  uniform_bucket_level_access = true
}

# ==============================================================================
# COMPUTE NODES (DISTRIBUTED 3-NODE k3s TOPOLOGY)
# ==============================================================================
locals {
  ssh_pub = file(pathexpand(var.ssh_public_key_path))
}

# Node 1: Controller & Data Tier (PostgreSQL + Redis + k3s API)
resource "google_compute_instance" "controller" {
  name         = "collabify-node-controller"
  machine_type = var.controller_machine_type
  zone         = var.zone
  tags         = ["collabify-node", "collabify-controller"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2404-lts-amd64"
      size  = 30
      type  = "pd-balanced"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
    network_ip = "10.10.1.10"

    access_config {
      // Ephemeral public IP for administration & ingress
    }
  }

  metadata = {
    ssh-keys = "${var.ssh_user}:${local.ssh_pub}"
  }

  metadata_startup_script = <<-EOF
    #!/usr/bin/env bash
    set -euo pipefail
    apt-get update -y && apt-get install -y curl ufw git unzip build-essential
    ufw disable || true
    mkdir -p /opt/collabify && chmod 777 /opt/collabify

    # Install Bun
    export HOME=/root
    curl -fsSL https://bun.sh/install | bash
    cp /root/.bun/bin/bun /usr/local/bin/bun || true

    # Install k3s server (single-node control plane, data role)
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --cluster-init --token=${var.k3s_token} --node-ip=10.10.1.10 --flannel-backend=vxlan --disable traefik --write-kubeconfig-mode 644" sh -
  EOF
}

# Node 2: Web & WebSocket Ingestion Tier
resource "google_compute_instance" "ingest" {
  name         = "collabify-node-ingest"
  machine_type = var.worker_machine_type
  zone         = var.zone
  tags         = ["collabify-node", "collabify-ingest"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2404-lts-amd64"
      size  = 20
      type  = "pd-balanced"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
    network_ip = "10.10.1.20"

    access_config {
      // Ephemeral public IP
    }
  }

  metadata = {
    ssh-keys = "${var.ssh_user}:${local.ssh_pub}"
  }

  metadata_startup_script = <<-EOF
    #!/usr/bin/env bash
    set -euo pipefail
    apt-get update -y && apt-get install -y curl ufw git unzip build-essential
    ufw disable || true
    mkdir -p /opt/collabify && chmod 777 /opt/collabify

    # Install Bun
    export HOME=/root
    curl -fsSL https://bun.sh/install | bash
    cp /root/.bun/bin/bun /usr/local/bin/bun || true

    # Wait for controller k3s API
    while ! curl -k -s https://10.10.1.10:6443/ping; do
      sleep 3
    done

    # Install k3s agent
    curl -sfL https://get.k3s.io | K3S_URL=https://10.10.1.10:6443 K3S_TOKEN=${var.k3s_token} INSTALL_K3S_EXEC="agent --node-ip=10.10.1.20" sh -
  EOF

  depends_on = [google_compute_instance.controller]
}

# Node 3: Asynchronous Workers Tier (Redis Streams & BullMQ)
resource "google_compute_instance" "worker" {
  name         = "collabify-node-worker"
  machine_type = var.worker_machine_type
  zone         = var.zone
  tags         = ["collabify-node", "collabify-worker"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2404-lts-amd64"
      size  = 20
      type  = "pd-balanced"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
    network_ip = "10.10.1.30"

    access_config {
      // Ephemeral public IP
    }
  }

  metadata = {
    ssh-keys = "${var.ssh_user}:${local.ssh_pub}"
  }

  metadata_startup_script = <<-EOF
    #!/usr/bin/env bash
    set -euo pipefail
    apt-get update -y && apt-get install -y curl ufw git unzip build-essential
    ufw disable || true
    mkdir -p /opt/collabify && chmod 777 /opt/collabify

    # Install Bun
    export HOME=/root
    curl -fsSL https://bun.sh/install | bash
    cp /root/.bun/bin/bun /usr/local/bin/bun || true

    # Wait for controller k3s API
    while ! curl -k -s https://10.10.1.10:6443/ping; do
      sleep 3
    done

    # Install k3s agent
    curl -sfL https://get.k3s.io | K3S_URL=https://10.10.1.10:6443 K3S_TOKEN=${var.k3s_token} INSTALL_K3S_EXEC="agent --node-ip=10.10.1.30" sh -
  EOF

  depends_on = [google_compute_instance.controller]
}
