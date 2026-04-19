# PowerShell script to download conversion binaries for Windows
# Run this script from the project root directory

$BIN_DIR = "src-tauri\binaries"

# Create binaries directory
New-Item -ItemType Directory -Force -Path $BIN_DIR | Out-Null

Write-Host "Downloading conversion binaries..." -ForegroundColor Green
Write-Host ""

# FFmpeg for Windows
Write-Host "Downloading FFmpeg..." -ForegroundColor Cyan
$FFMPEG_URL = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
$FFMPEG_ZIP = "$env:TEMP\ffmpeg.zip"
$FFMPEG_EXTRACT = "$env:TEMP\ffmpeg"

Invoke-WebRequest -Uri $FFMPEG_URL -OutFile $FFMPEG_ZIP
Expand-Archive -Path $FFMPEG_ZIP -DestinationPath $FFMPEG_EXTRACT -Force
Copy-Item "$FFMPEG_EXTRACT\ffmpeg-*\bin\ffmpeg.exe" "$BIN_DIR\ffmpeg.exe"
Remove-Item $FFMPEG_ZIP
Remove-Item $FFMPEG_EXTRACT -Recurse
Write-Host "  FFmpeg downloaded" -ForegroundColor Green

# ImageMagick for Windows
Write-Host "Downloading ImageMagick..." -ForegroundColor Cyan
$MAGICK_URL = "https://imagemagick.org/archive/binaries/ImageMagick-7.1.1-42-portable-Q16-x64.zip"
$MAGICK_ZIP = "$env:TEMP\magick.zip"
$MAGICK_EXTRACT = "$env:TEMP\magick"

Invoke-WebRequest -Uri $MAGICK_URL -OutFile $MAGICK_ZIP
Expand-Archive -Path $MAGICK_ZIP -DestinationPath $MAGICK_EXTRACT -Force
Copy-Item "$MAGICK_EXTRACT\magick.exe" "$BIN_DIR\magick.exe"
Remove-Item $MAGICK_ZIP
Remove-Item $MAGICK_EXTRACT -Recurse
Write-Host "  ImageMagick downloaded" -ForegroundColor Green

# Pandoc for Windows
Write-Host "Downloading Pandoc..." -ForegroundColor Cyan
$PANDOC_URL = "https://github.com/jgm/pandoc/releases/download/3.7/pandoc-3.7-windows-x86_64.zip"
$PANDOC_ZIP = "$env:TEMP\pandoc.zip"
$PANDOC_EXTRACT = "$env:TEMP\pandoc"

Invoke-WebRequest -Uri $PANDOC_URL -OutFile $PANDOC_ZIP
Expand-Archive -Path $PANDOC_ZIP -DestinationPath $PANDOC_EXTRACT -Force
Copy-Item "$PANDOC_EXTRACT\pandoc-*\pandoc.exe" "$BIN_DIR\pandoc.exe"
Remove-Item $PANDOC_ZIP
Remove-Item $PANDOC_EXTRACT -Recurse
Write-Host "  Pandoc downloaded" -ForegroundColor Green

# 7-Zip for Windows
Write-Host "Downloading 7-Zip..." -ForegroundColor Cyan
$SEVENZIP_URL = "https://www.7-zip.org/a/7z2408-x64.exe"
$SEVENZIP_INSTALLER = "$env:TEMP\7z-installer.exe"

Invoke-WebRequest -Uri $SEVENZIP_URL -OutFile $SEVENZIP_INSTALLER

# Extract 7z.exe and 7z.dll from the installer
$SEVENZIP_EXTRACT = "$env:TEMP\7z-extract"
New-Item -ItemType Directory -Force -Path $SEVENZIP_EXTRACT | Out-Null
Start-Process -FilePath $SEVENZIP_INSTALLER -ArgumentList "/S /D=$SEVENZIP_EXTRACT" -Wait

if (Test-Path "$SEVENZIP_EXTRACT\7z.exe") {
    Copy-Item "$SEVENZIP_EXTRACT\7z.exe" "$BIN_DIR\7z.exe"
    Copy-Item "$SEVENZIP_EXTRACT\7z.dll" "$BIN_DIR\7z.dll"
    Write-Host "  7-Zip downloaded" -ForegroundColor Green
} else {
    Write-Host "  Warning: Could not extract 7z.exe automatically" -ForegroundColor Yellow
    Write-Host "  Please manually copy 7z.exe to $BIN_DIR" -ForegroundColor Yellow
}

Remove-Item $SEVENZIP_INSTALLER
Remove-Item $SEVENZIP_EXTRACT -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "All binaries downloaded successfully!" -ForegroundColor Green
Write-Host "Location: $BIN_DIR" -ForegroundColor Cyan
