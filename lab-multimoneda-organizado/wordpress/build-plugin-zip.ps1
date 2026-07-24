param(
  [string]$Version = "1.0.9"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$wordpressRoot = $PSScriptRoot
$sourceRoot = Join-Path $wordpressRoot "lab-core-accounts"
$zipTarget = Join-Path $wordpressRoot "lab-core-accounts-$Version.zip"

if (-not (Test-Path -LiteralPath $sourceRoot)) {
  throw "Plugin source directory does not exist: $sourceRoot"
}

if (Test-Path -LiteralPath $zipTarget) {
  throw "Destination already exists: $zipTarget"
}

$zipStream = [System.IO.File]::Open(
  $zipTarget,
  [System.IO.FileMode]::CreateNew,
  [System.IO.FileAccess]::ReadWrite,
  [System.IO.FileShare]::None
)
$archive = [System.IO.Compression.ZipArchive]::new(
  $zipStream,
  [System.IO.Compression.ZipArchiveMode]::Create,
  $false
)

try {
  Get-ChildItem -LiteralPath $sourceRoot -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($sourceRoot.Length).TrimStart("\", "/")
    $entryName = "lab-core-accounts/" + $relative.Replace("\", "/")
    $entry = $archive.CreateEntry(
      $entryName,
      [System.IO.Compression.CompressionLevel]::Optimal
    )
    $inputStream = [System.IO.File]::OpenRead($_.FullName)
    $outputStream = $entry.Open()

    try {
      $inputStream.CopyTo($outputStream)
    } finally {
      $outputStream.Dispose()
      $inputStream.Dispose()
    }
  }
} finally {
  $archive.Dispose()
  $zipStream.Dispose()
}

$readArchive = [System.IO.Compression.ZipFile]::OpenRead($zipTarget)
try {
  $entries = @($readArchive.Entries | ForEach-Object { $_.FullName })
  $invalidEntries = @($entries | Where-Object { $_.Contains("\") })

  if ($invalidEntries.Count -gt 0) {
    throw "Archive contains Windows path separators: $($invalidEntries -join ', ')"
  }

  if ($entries -notcontains "lab-core-accounts/lab-core-accounts.php") {
    throw "Main plugin file is missing from the expected archive path."
  }

  [PSCustomObject]@{
    Zip = $zipTarget
    Entries = $entries.Count
    MainPluginFile = "lab-core-accounts/lab-core-accounts.php"
    PortablePaths = $true
  }
} finally {
  $readArchive.Dispose()
}
