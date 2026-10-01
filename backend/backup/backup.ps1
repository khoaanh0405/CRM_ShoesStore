$projectRoot = Split-Path $PSScriptRoot -Parent
$composeRoot = Split-Path $projectRoot -Parent

$envFile = Join-Path $projectRoot ".env"

if (!(Test-Path $envFile)) {
    Write-Host "Khong tim thay file .env!" -ForegroundColor Red
    exit 1
}

$date = Get-Date -Format "yyyy-MM-dd"
$backupFileName = "backup_$date.dump"
$backupFile = Join-Path $PSScriptRoot $backupFileName

Write-Host ""
Write-Host "========================================"
Write-Host "          SAO LUU CO SO DU LIEU"
Write-Host "========================================"
Write-Host ""
Write-Host "Dang sao luu..."
Write-Host "File: $backupFile"
Write-Host ""

docker compose `
    -f (Join-Path $composeRoot "docker-compose.yml") `
    run --rm `
    backup `
    sh -c "pg_dump `"`$DATABASE_URL`" -F c -b -v -f /backup/$backupFileName"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Sao luu thanh cong!" -ForegroundColor Green
    Write-Host "Backup: $backupFile"
}
else {
    Write-Host ""
    Write-Host "Sao luu that bai!" -ForegroundColor Red
    exit 1
}