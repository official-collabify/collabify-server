terraform {
  backend "gcs" {
    bucket = "collabify-tfstate-512036370406"
    prefix = "collabify/benchmark"
  }
}
