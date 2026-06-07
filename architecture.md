# OpenCloud Architecture Specification

## Design Philosophy
OpenCloud acts as a declarative translation layer. The user provides a simple configuration, and OpenCloud translates it into underlying open-source cloud-native tools.

## Tech Stack Decisions
*   **Core Language:** Go (Golang 1.21+)
*   **CLI Framework:** Cobra CLI (`github.com/spf13/cobra`)
*   **API Framework:** Gin Gonic (`github.com/gin-gonic/gin`)
*   **Kubernetes Integration:** Official Go Client (`k8s.io/client-go`)

## Core Component Flow
1. **User/Client Layer:** A compiled Go binary CLI (`opencloud`) that sends commands.
2. **Control Plane (The Brain):** A lightweight Go REST API service that receives requests, validates them, and converts them into infrastructure actions.
3. **Infrastructure Layer (The Muscle):** K3s running Traefik for routing and Helm/Operators for stateful services.

## Data Flow Example (Deploying an App)
User CLI (`opencloud deploy app`) 
  ──> Go API Backend (Gin)
  ──> Programmatic Manifest Generation via `client-go`
  ──> Applied directly to the K3s cluster.