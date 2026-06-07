# scripts/install-crossplane.ps1
$ErrorActionPreference = "Stop"

Write-Host "[INFO] Adding Crossplane Helm repository..." -ForegroundColor Cyan
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update

Write-Host "[INFO] Installing Crossplane..." -ForegroundColor Cyan
helm upgrade --install crossplane crossplane-stable/crossplane `
  --namespace crossplane-system `
  --create-namespace `
  --wait

Write-Host "[INFO] Installing Crossplane Helm Provider..." -ForegroundColor Cyan
# This assumes we have kubectl installed and available
kubectl apply -f https://raw.githubusercontent.com/crossplane-contrib/provider-helm/master/package/crossplane.yaml

Write-Host "[INFO] Applying Crossplane SQLDatabase Definitions..." -ForegroundColor Cyan
kubectl apply -f ../crossplane/sql-database-definition.yaml
kubectl apply -f ../crossplane/sql-database-composition.yaml

Write-Host "[SUCCESS] Crossplane Configured." -ForegroundColor Green
