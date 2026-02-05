# PowerShell script to replace hardcoded API URLs with centralized import
# Run this from schomas-frontend directory: .\update-api-urls.ps1

$srcDir = Join-Path $PSScriptRoot "src"
$files = Get-ChildItem -Path $srcDir -Include *.ts,*.tsx,*.js,*.jsx -Recurse -File | 
         Where-Object { $_.FullName -notmatch 'node_modules|dist|build|config\\api' }

$pattern1 = 'import\.meta\.env\.VITE_API_BASE_URL \|\| `\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| `\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| ''http://localhost:5000/api/v1''\}`\}`'
$pattern2 = 'import\.meta\.env\.VITE_API_BASE_URL \|\| `\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| ''http://localhost:5000/api/v1''\}`'
$pattern3 = "import\.meta\.env\.VITE_API_BASE_URL \|\| 'http://localhost:5000/api/v1'"
$replacement = 'API_BASE_URL'

$updatedFiles = @()
$totalFiles = 0

Write-Host "🔍 Scanning files in $srcDir..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {
    $totalFiles++
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    $originalContent = $content
    
    # Replace pattern 1 (most nested)
    if ($content -match [regex]::Escape($pattern1)) {
        $content = $content -replace [regex]::Escape($pattern1), $replacement
        $modified = $true
    }
    
    # Replace pattern 2 (medium nested)
    if ($content -match [regex]::Escape($pattern2)) {
        $content = $content -replace [regex]::Escape($pattern2), $replacement
        $modified = $true
    }
    
    # Replace pattern 3 (simple)
    if ($content -match [regex]::Escape($pattern3)) {
        $content = $content -replace [regex]::Escape($pattern3), $replacement
        $modified = $true
    }
    
    # Add import if modified and not already present
    if ($modified -and $content -notmatch "from '@/config/api'") {
        # Find position after last import
        $lines = $content -split "`n"
        $lastImportIndex = -1
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^import\s+" -and $lines[$i] -notmatch "@/config/api") {
                $lastImportIndex = $i
            }
        }
        
        if ($lastImportIndex -ge 0) {
            $importLine = "import { API_BASE_URL } from '@/config/api';"
            $lines = @($lines[0..$lastImportIndex]) + $importLine + @($lines[($lastImportIndex+1)..($lines.Count-1)])
            $content = $lines -join "`n"
        }
    }
    
    if ($modified -and $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $relativePath = $file.FullName.Replace($PSScriptRoot + "\", "")
        $updatedFiles += $relativePath
        Write-Host "✅ Updated: $relativePath" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Yellow
Write-Host "✨ Summary" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Yellow
Write-Host "Total files scanned: $totalFiles" -ForegroundColor White
Write-Host "Files updated: $($updatedFiles.Count)" -ForegroundColor Green
Write-Host ""

if ($updatedFiles.Count -gt 0) {
    Write-Host "Updated files:" -ForegroundColor Cyan
    foreach ($f in $updatedFiles) {
        Write-Host "  - $f" -ForegroundColor Gray
    }
} else {
    Write-Host "✓ No files needed updating!" -ForegroundColor Green
}
