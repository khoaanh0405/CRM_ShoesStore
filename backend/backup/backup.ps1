# Xác định thư mục backend
$projectRoot = Split-Path $PSScriptRoot -Parent

# Đọc file .env
$envFile = Join-Path $projectRoot ".env"

if (!(Test-Path $envFile)) {
    Write-Host "Khong tim thay file .env!" -ForegroundColor Red
    exit 1
}

# Lấy DATABASE_URL từ .env
$databaseUrl = (
    Get-Content $envFile |
    Select-String '^DATABASE_URL='
).Line -replace '^DATABASE_URL=', ''

if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    Write-Host "Khong tim thay DATABASE_URL trong .env!" -ForegroundColor Red
    exit 1
}

# Lấy ngày hiện tại
$date = Get-Date -Format "yyyy-MM-dd"

# Đường dẫn file backup
$backupFile = Join-Path $PSScriptRoot "backup_$date.dump"

Write-Host ""
Write-Host "========================================"
Write-Host "          SAO LUU CO SO DU LIEU"
Write-Host "========================================"
Write-Host ""
Write-Host "Dang sao luu..."
Write-Host "File: $backupFile"
Write-Host ""

# Thực hiện backup
pg_dump "$databaseUrl" -F c -b -v -f "$backupFile"

# Kiểm tra kết quả
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