param([string]$Version = "1.0.0")
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$source = Join-Path $PSScriptRoot "lab-core-rewards"
$target = Join-Path $PSScriptRoot "lab-core-rewards-$Version.zip"
if (Test-Path -LiteralPath $target) { throw "Destination already exists: $target" }
$stage = Join-Path ([System.IO.Path]::GetTempPath()) ("lab-core-rewards-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $stage | Out-Null
try {
  Copy-Item -LiteralPath $source -Destination $stage -Recurse
  [System.IO.Compression.ZipFile]::CreateFromDirectory($stage, $target)
} finally {
  Remove-Item -LiteralPath $stage -Recurse -Force
}
Write-Output $target
