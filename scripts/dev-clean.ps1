# Cleanly stops stale dev processes, clears apps/web/.next, and starts turbo run dev

Write-Host "=== CampusEdge Dev Clean ===" -ForegroundColor Cyan

# 1. Stop node processes on ports 3000..3010 and 4000
$ports = @(3000..3010) + @(4000)
$connections = Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue

if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -eq 'node') {
            Write-Host "Stopping node process on port listener PID $p..." -ForegroundColor Yellow
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}

# 2. Wait a moment for ports to release
Start-Sleep -Seconds 1

# 3. Clean apps/web/.next
$nextDir = Join-Path $PSScriptRoot "..\apps\web\.next"
if (Test-Path $nextDir) {
    Write-Host "Removing stale $nextDir..." -ForegroundColor Yellow
    Remove-Item -Path $nextDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Dev workspace cleaned. Starting turbo run dev..." -ForegroundColor Green
pnpm run dev
