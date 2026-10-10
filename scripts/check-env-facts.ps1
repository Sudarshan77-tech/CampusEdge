# Inspect NEXT_PUBLIC_API_URL and WEB_ORIGIN safe facts
$webPath = Join-Path $PSScriptRoot "..\apps\web\.env.local"
if (Test-Path $webPath) {
    Get-Content $webPath | Where-Object { $_ -match 'NEXT_PUBLIC_API_URL' } | ForEach-Object {
        $parts = $_.Split('=', 2)
        $val = $parts[1].Trim()
        $hasQuotes = $val.StartsWith('"') -or $val.StartsWith("'")
        $hasBrackets = $val.Contains('[') -or $val.Contains(']')
        Write-Host "NEXT_PUBLIC_API_URL safe facts:"
        Write-Host "  Length: $($val.Length)"
        Write-Host "  Scheme: $($val -replace '://.*', '')"
        Write-Host "  HasTrailingSlash: $($val.EndsWith('/'))"
        Write-Host "  HasQuotes: $hasQuotes"
        Write-Host "  HasBrackets: $hasBrackets"
        Write-Host "  HostPort: $($val -replace '^https?://', '')"
    }
}

$apiPath = Join-Path $PSScriptRoot "..\apps\api\.env"
if (Test-Path $apiPath) {
    Get-Content $apiPath | Where-Object { $_ -match '^WEB_ORIGIN' } | ForEach-Object {
        $parts = $_.Split('=', 2)
        $val = $parts[1].Trim()
        $hasQuotes = $val.StartsWith('"') -or $val.StartsWith("'")
        $hasBrackets = $val.Contains('[') -or $val.Contains(']')
        Write-Host "WEB_ORIGIN safe facts:"
        Write-Host "  Length: $($val.Length)"
        Write-Host "  Scheme: $($val -replace '://.*', '')"
        Write-Host "  HasTrailingSlash: $($val.EndsWith('/'))"
        Write-Host "  HasQuotes: $hasQuotes"
        Write-Host "  HasBrackets: $hasBrackets"
        Write-Host "  HostPort: $($val -replace '^https?://', '')"
    }
}
