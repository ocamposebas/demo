param([string]$Version = "2.3.1-labcore")
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
$source = Join-Path $PSScriptRoot "phase-one-coa-manager (6).php"
$target = Join-Path $PSScriptRoot "phase-one-coa-manager-$Version.zip"
if (-not (Test-Path -LiteralPath $source)) { throw "COA plugin source not found: $source" }
if (Test-Path -LiteralPath $target) { throw "Destination already exists: $target" }
$stream = [IO.File]::Open($target, [IO.FileMode]::CreateNew)
$archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create)
try {
  $entry = $archive.CreateEntry("phase-one-coa-manager/phase-one-coa-manager.php", [IO.Compression.CompressionLevel]::Optimal)
  $input = [IO.File]::OpenRead($source)
  $output = $entry.Open()
  try { $input.CopyTo($output) } finally { $output.Dispose(); $input.Dispose() }
  foreach ($asset in @("admin.css", "admin.js")) {
    $assetEntry = $archive.CreateEntry("phase-one-coa-manager/assets/$asset", [IO.Compression.CompressionLevel]::Optimal)
    $assetOutput = $assetEntry.Open()
    $writer = [IO.StreamWriter]::new($assetOutput)
    try { $writer.Write("/* Inline assets are provided by phase-one-coa-manager.php. */") } finally { $writer.Dispose() }
  }
} finally { $archive.Dispose(); $stream.Dispose() }
Write-Output $target
