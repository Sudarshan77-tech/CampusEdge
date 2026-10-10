param()

function Inspect-EnvFile($filePath) {
    if (-not (Test-Path $filePath)) {
        Write-Host "File Not Found: $filePath"
        return
    }
    Write-Host "`n=== Inspecting: $filePath ==="
    $lines = Get-Content $filePath
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        if ($trimmed.StartsWith('#') -or [string]::IsNullOrWhiteSpace($trimmed)) { continue }
        $splitIdx = $trimmed.IndexOf('=')
        if ($splitIdx -le 0) { continue }
        $name = $trimmed.Substring(0, $splitIdx).Trim()
        $val = $trimmed.Substring($splitIdx + 1).Trim()
        
        $len = $val.Length
        $hasQuotes = ($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))
        $inner = $val.Trim('"').Trim("'")
        $hasSpaces = $inner.Contains(' ')
        $hasBrackets = $inner.Contains('[') -or $inner.Contains(']') -or $inner.Contains('(') -or $inner.Contains(')')
        $hasTrailingSlash = $inner.EndsWith('/')
        $startsHttps = $inner.StartsWith('https://')
        $startsHttp = $inner.StartsWith('http://')
        $endsSupabaseCo = $inner.EndsWith('.supabase.co')
        $startsSbPub = $inner.StartsWith('sb_publishable_')
        $startsSbSec = $inner.StartsWith('sb_secret_')
        $isLocalHost = $inner.Contains('localhost') -or $inner.Contains('127.0.0.1')
        
        Write-Host "Key: $name (Length: $len)"
        Write-Host "  Quoted: $hasQuotes | Spaces: $hasSpaces | Brackets: $hasBrackets | TrailingSlash: $hasTrailingSlash"
        if ($startsHttps) { Write-Host "  Protocol: https" }
        elseif ($startsHttp) { Write-Host "  Protocol: http" }
        else { Write-Host "  Protocol: none/other" }
        if ($endsSupabaseCo) { Write-Host "  Domain: ends with .supabase.co" }
        if ($isLocalHost) { Write-Host "  Target: contains localhost/127.0.0.1" }
        if ($startsSbPub) { Write-Host "  Format: starts with sb_publishable_" }
        if ($startsSbSec) { Write-Host "  Format: starts with sb_secret_" }
    }
}

Inspect-EnvFile 'apps/web/.env.local'
Inspect-EnvFile 'apps/web/.env.local.remote'
Inspect-EnvFile 'apps/api/.env'
Inspect-EnvFile 'apps/api/.env.local'
if (Test-Path '.env') { Inspect-EnvFile '.env' } else { Write-Host "`nRoot .env does not exist." }

Write-Host "`n=== Comparison & Validation Check ==="
Write-Host "`n=== Database Connection Pooler Check (apps/api/.env) ==="
$dbLine = (Get-Content apps/api/.env | Where-Object { $_ -match '^DATABASE_URL=' }).Split('=', 2)[1].Trim().Trim('"').Trim("'")
Write-Host "Contains port 6543 (transaction pooler): $($dbLine.Contains(':6543'))"
Write-Host "Contains pgbouncer=true: $($dbLine.Contains('pgbouncer=true'))"
Write-Host "Contains connection_limit: $($dbLine.Contains('connection_limit'))"

Write-Host "`n=== Reachability Testing (Step 2.4) ==="
$webRemoteUrl = (Get-Content apps/web/.env.local.remote | Where-Object { $_ -match '^NEXT_PUBLIC_SUPABASE_URL=' }).Split('=', 2)[1].Trim().Trim('"').Trim("'")
$pubKey = (Get-Content apps/web/.env.local.remote | Where-Object { $_ -match '^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=' }).Split('=', 2)[1].Trim().Trim('"').Trim("'")
try {
    $res = Invoke-WebRequest -Uri "$webRemoteUrl/auth/v1/health" -Headers @{ apikey = $pubKey } -UseBasicParsing -TimeoutSec 10
    Write-Host "Supabase remote auth/v1/health HTTP status: $($res.StatusCode)"
} catch {
    Write-Host "Supabase remote auth/v1/health FAILED: $_"
}

try {
    $apiRes = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "Local API GET /api/v1/health HTTP status: $($apiRes.StatusCode)"
} catch {
    Write-Host "Local API GET /api/v1/health HTTP status (or failed): $_"
}


