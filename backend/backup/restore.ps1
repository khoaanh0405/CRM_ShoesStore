$projectRoot = Split-Path $PSScriptRoot -Parent
$composeRoot = Split-Path $projectRoot -Parent

$envFile = Join-Path $projectRoot ".env"

if (!(Test-Path $envFile)) {
    Write-Host "Khong tim thay file .env!" -ForegroundColor Red
    exit 1
}

while ($true) {

    Clear-Host

    Write-Host "========================================"
    Write-Host "       PHUC HOI CO SO DU LIEU"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Nhan ENTER  : Phuc hoi ban backup moi nhat"
    Write-Host "Nhap ngay   : Phuc hoi backup theo ngay (yyyy-MM-dd)"
    Write-Host "Nhap Q      : Thoat"
    Write-Host ""

    $date = Read-Host "Lua chon"

    # ENTER -> backup moi nhat
    if ([string]::IsNullOrWhiteSpace($date)) {

        $backup = Get-ChildItem $PSScriptRoot -Filter "backup_*.dump" |
                  Sort-Object LastWriteTime -Descending |
                  Select-Object -First 1

        if ($null -eq $backup) {
            Write-Host ""
            Write-Host "Khong tim thay file backup nao!" -ForegroundColor Red
            Read-Host "Nhan Enter de thu lai"
            continue
        }
    }

    # Q -> thoat
    elseif ($date -eq "q" -or $date -eq "Q") {

        Write-Host "Da thoat."
        break
    }

    # Nhap ngay cu the
    else {

        $parsedDate = [datetime]::MinValue

        $validDate = [datetime]::TryParseExact(
            $date,
            "yyyy-MM-dd",
            $null,
            [Globalization.DateTimeStyles]::None,
            [ref]$parsedDate
        )

        if (!$validDate) {
            Write-Host ""
            Write-Host "Sai dinh dang ngay! Vui long nhap theo yyyy-MM-dd." -ForegroundColor Red
            Read-Host "Nhan Enter de nhap lai"
            continue
        }

        $backupPath = Join-Path $PSScriptRoot "backup_$date.dump"

        if (!(Test-Path $backupPath)) {
            Write-Host ""
            Write-Host "Khong tim thay backup ngay $date!" -ForegroundColor Red
            Read-Host "Nhan Enter de nhap lai"
            continue
        }

        $backup = Get-Item $backupPath
    }

    # Xac nhan
    Write-Host ""
    Write-Host "File backup duoc chon:"
    Write-Host $backup.FullName
    Write-Host ""

    $confirm = Read-Host "CANH BAO: Restore co the ghi de du lieu hien tai. Tiep tuc? (Y/N)"

    if ($confirm -ne "Y" -and $confirm -ne "y") {
        Write-Host "Da huy phuc hoi."
        Read-Host "Nhan Enter de tiep tuc"
        continue
    }

    Write-Host ""
    Write-Host "Dang phuc hoi..." -ForegroundColor Yellow
    Write-Host ""

    # Lay ten file backup
    $backupFileName = $backup.Name

    # Chay pg_restore ben trong Docker
    docker compose `
        -f (Join-Path $composeRoot "docker-compose.yml") `
        run --rm `
        backup `
        sh -c "pg_restore --clean --if-exists --no-owner --no-privileges --verbose --exit-on-error -d `"`$DATABASE_URL`" /backup/$backupFileName"

    if ($LASTEXITCODE -eq 0) {

        Write-Host ""
        Write-Host "Phuc hoi thanh cong!" -ForegroundColor Green
        Write-Host "Backup: $($backup.FullName)"
    }
    else {

        Write-Host ""
        Write-Host "Phuc hoi that bai!" -ForegroundColor Red
    }

    Read-Host "Nhan Enter de tro ve menu"
}