# scripts/start-cluster.ps1
$ErrorActionPreference = "Stop"

Write-Host "[INFO] Starting Minikube cluster..." -ForegroundColor Cyan
minikube start --driver=docker

if ($LASTEXITCODE -eq 0 -or $?) {
    Write-Host "[SUCCESS] Minikube cluster started." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to start Minikube." -ForegroundColor Red
    exit 1
}
