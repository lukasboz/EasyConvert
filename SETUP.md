# Setup Guide for EasyConvert

## Quick Start

### Option 1: Automatic Setup (Recommended)

Try running the automated script first:
```powershell
.\scripts\download-binaries.ps1
```

### Option 2: Manual Download (If automatic fails)

If the script fails for any binary, download them manually:

#### 1. FFmpeg (Video/Audio Conversion)
- Visit: https://github.com/BtbN/FFmpeg-Builds/releases
- Download: `ffmpeg-master-latest-win64-gpl.zip`
- Extract `ffmpeg.exe` from `bin/` folder
- Place in: `src-tauri/binaries/ffmpeg.exe`

#### 2. ImageMagick (Image Conversion)
- Visit: https://imagemagick.org/script/download.php#windows
- Download: ImageMagick portable (Q16-x64)
- Extract `magick.exe`
- Place in: `src-tauri/binaries/magick.exe`

**Or use winget:**
```powershell
winget install ImageMagick.ImageMagick
# Then copy from C:\Program Files\ImageMagick-7.x.x-Q16-HDRI\magick.exe
```

#### 3. Pandoc (Document Conversion)
- Visit: https://github.com/jgm/pandoc/releases/latest
- Download: `pandoc-x.x-windows-x86_64.zip`
- Extract `pandoc.exe`
- Place in: `src-tauri/binaries/pandoc.exe`

**Or use winget:**
```powershell
winget install JohnMacFarlane.Pandoc
# Then copy from C:\Users\<YourUser>\AppData\Local\Pandoc\pandoc.exe
```

#### 4. 7-Zip (Archive Conversion)
- Visit: https://www.7-zip.org/download.html
- Download: 7-Zip x64
- Install it
- Copy from: `C:\Program Files\7-Zip\7z.exe` and `7z.dll`
- Place in: `src-tauri/binaries/7z.exe` and `src-tauri/binaries/7z.dll`

**Or use winget:**
```powershell
winget install 7zip.7zip
# Then copy from C:\Program Files\7-Zip\
```

## Verify Installation

Check that all binaries are present:
```powershell
ls src-tauri\binaries\
```

You should see:
- `ffmpeg.exe`
- `magick.exe`
- `pandoc.exe`
- `7z.exe`
- `7z.dll`

## Run the Application

```bash
npm run tauri:dev
```

## Troubleshooting

### "Sidecar binary not found"
Make sure all `.exe` files are in `src-tauri/binaries/` directory.

### Permission denied
Right-click the `.exe` files → Properties → Unblock

### Rust not found
Restart your terminal after installing Rust, or run:
```powershell
refreshenv
```

## Alternative: Use System-Installed Tools

If you have these tools installed system-wide, you can modify `src-tauri/src/utils/sidecar.rs` to use system paths instead of bundled binaries.
