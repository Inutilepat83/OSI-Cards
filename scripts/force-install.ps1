# OSI Cards Library - Force Integration Script (PowerShell)
param (
    [string]$TargetDir = ".",
    [string]$LibTarball = "C:\Users\W2k234ad\Desktop\OSI-Cards-1\dist\osi-cards-lib\osi-cards-lib-1.5.57.tgz"
)

if (!(Test-Path "$TargetDir\package.json")) {
    Write-Error "❌ Error: package.json not found in $TargetDir"
    exit
}

Write-Host "🚀 Forcing OSI Cards Library integration in $TargetDir..."

# 1. Add overrides to package.json
Write-Host "📦 Adding dependency overrides..."
$pkg = Get-Content "$TargetDir\package.json" | ConvertFrom-Json

if ($null -eq $pkg.overrides) {
    $pkg | Add-Member -MemberType NoteProperty -Name "overrides" -Value @{}
}

$angularDeps = @("@angular/common", "@angular/core", "@angular/forms", "@angular/platform-browser", "@angular/platform-browser-dynamic", "@angular/router", "@angular/animations", "zone.js", "rxjs")
$legacyPackages = @("@angular-slider/ngx-slider", "@ng-select/ng-select", "angular-datatables", "ngx-bootstrap", "ngx-markdown", "ngx-treeview-v18")

foreach ($pkgName in $legacyPackages) {
    if ($null -eq $pkg.overrides.$pkgName) {
        $pkg.overrides | Add-Member -MemberType NoteProperty -Name $pkgName -Value @{}
    }
    foreach ($dep in $angularDeps) {
        $pkg.overrides.$pkgName | Add-Member -MemberType NoteProperty -Name $dep -Value "`$$dep" -Force
    }
}

$pkg | ConvertTo-Json -Depth 10 | Set-Content "$TargetDir\package.json"

# 2. Install the library
Write-Host "📥 Installing library..."
Set-Location $TargetDir
npm install $LibTarball --legacy-peer-deps

Write-Host "✅ Force integration complete!"
