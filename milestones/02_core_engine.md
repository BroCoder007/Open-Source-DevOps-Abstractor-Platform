# Milestone 2: Core Abstraction Engine (Go API & CLI)

## Objective
Build a compiled Go backend API and companion CLI tool that communicates natively with the local K3s cluster.

## Tasks
- [ ] Initialize a Go module: `go mod init opencloud`.
- [ ] Pull required dependencies: `go get k8s.io/client-go`, `github.com/spf13/cobra`, and `github.com/gin-gonic/gin`.
- [ ] Build a REST API in Go with a POST `/api/v1/deploy` endpoint accepting JSON (`app_name`, `image`, `port`).
- [ ] Implement the abstraction engine using `client-go` to programmatically generate and apply a Kubernetes Deployment and Service resource.
- [ ] Build the `opencloud` CLI binary using Cobra that routes commands to the Go API.

## Success Criteria
Running `./opencloud deploy --name web-test --image nginx` compiles the Go binary, sends the payload, and spins up a functional Nginx pod inside K3s with zero raw YAML exposed.