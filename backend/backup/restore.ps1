$envFile = ".\.env"

if (!(Test-Path $envFile)) {
    Write-Host "Khong tim thay file .env!" -ForegroundColor Red
    exit
}

$databaseUrl = ((Get-Content $envFile |
    Select-String '^DATABASE_URL=').Line -replace '^DATABASE_URL=', '')

if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    Write-Host "Khong tim thay DATABASE_URL trong .env!" -ForegroundColor Red
    exit
}

$env:DATABASE_URL = $databaseUrl

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

    # Nếu nhấn Enter -> chọn backup mới nhất
    if ([string]::IsNullOrWhiteSpace($date)) {

        $backup = Get-ChildItem ".\backup\backup_*.dump" |
                  Sort-Object LastWriteTime -Descending |
                  Select-Object -First 1

        if ($null -eq $backup) {
            Write-Host ""
            Write-Host "Khong tim thay file backup nao!" -ForegroundColor Red
            Read-Host "Nhan Enter de thu lai"
            continue
        }

    }

    # Nếu nhập Q -> thoát
    elseif ($date -eq "q" -or $date -eq "Q") {
        Write-Host "Da thoat."
        break
    }

    # Nếu nhập ngày cụ thể
    else {

        # Kiểm tra đúng định dạng yyyy-MM-dd
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

        $backup = ".\backup\backup_$date.dump"

        if (!(Test-Path $backup)) {
            Write-Host ""
            Write-Host "Khong tim thay backup ngay $date!" -ForegroundColor Red
            Read-Host "Nhan Enter de nhap lai"
            continue
        }
    }

    # Xác nhận trước khi restore
    Write-Host ""
    Write-Host "File backup duoc chon:"
    Write-Host $backup
    Write-Host ""

    $confirm = Read-Host "Ban co chac chan muon phuc hoi? (Y/N)"

    if ($confirm -ne "Y" -and $confirm -ne "y") {
        Write-Host "Da huy phuc hoi."
        Read-Host "Nhan Enter de tiep tuc"
        continue
    }

    # Thực hiện restore
    pg_restore --clean --if-exists --no-owner --no-privileges --verbose --exit-on-error -d "$env:DATABASE_URL" $backup
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Phuc hoi thanh cong!" -ForegroundColor Green
        Write-Host "Backup: $backup"
    }
    else {
        Write-Host ""
        Write-Host "Phuc hoi that bai!" -ForegroundColor Red
    }

    Read-Host "Nhan Enter de tro ve menu"
}
