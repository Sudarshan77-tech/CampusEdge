# Inspect listening ports for Next.js (3000-3010) and NestJS (4000)
$ports = @(3000..3010) + @(4000)
Write-Host "Checking listening ports: $($ports -join ', ')..." -ForegroundColor Cyan

$connections = Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue

if ($connections) {
    $connections | ForEach-Object {
        $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        [PSCustomObject]@{
            Port        = $_.LocalPort
            State       = $_.State
            PID         = $_.OwningProcess
            ProcessName = if ($proc) { $proc.ProcessName } else { "Unknown" }
            CommandLine = if ($proc) { $proc.CommandLine } else { "N/A" }
        }
    } | Format-Table -AutoSize
} else {
    Write-Host "All checked ports are free." -ForegroundColor Green
}
