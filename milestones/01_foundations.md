# Milestone 1: Local Cloud Engine Setup

## Objective
Automatically provision the underlying compute and routing layer for the OpenCloud platform.

## Tasks
- [ ] Detect host operating system and install `curl`, `kubectl`, and `helm`.
- [ ] Install K3s (or Minikube if on macOS) securely on the local machine.
- [ ] Verify `kubectl get nodes` returns a healthy, active local node.
- [ ] Deploy the Traefik Ingress Controller using Helm if not natively bundled.
- [ ] Create a shell script wrapper called `opencloud-init.sh` that checks the health of this cluster.

## Success Criteria
Running `kubectl get pods -A` shows a running cluster with active CoreDNS and Ingress routing components. Do not proceed to Milestone 2 until all checks pass.