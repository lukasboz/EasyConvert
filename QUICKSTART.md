# EasyConvert - Quick Start Guide

## ✅ Installation Complete!

All required binaries are installed and ready:

```
✓ FFmpeg (192 MB) - Video/Audio conversion
✓ ImageMagick (55 KB) - Image conversion
✓ Pandoc (216 MB) - Document conversion
✓ 7-Zip (2.4 MB) - Archive conversion
```

## 🚀 Run the Application

Open a terminal in the project directory and run:

```bash
npm run tauri:dev
```

**First-time launch:**
- Rust compilation may take 2-5 minutes
- Subsequent launches are much faster

## 📋 How to Use

1. **Add Files**: Drag & drop files or click the drop zone
2. **Select Format**: Choose output format from dropdown for each file
3. **Convert**: Click "Convert All" button
4. **Done**: Converted files appear in same directory as originals

## 🎯 Supported Formats

### Images
JPG, PNG, WebP, GIF, BMP, TIFF

### Videos
MP4, MKV, WebM, MOV, AVI

### Audio
MP3, WAV, FLAC, AAC, OGG, M4A

### Documents
PDF, DOCX, TXT, Markdown, HTML, RTF

### Archives
ZIP, 7Z, TAR, GZ, RAR

## 🔧 Build Production Installer

```bash
npm run tauri:build
```

Output: `src-tauri\target\release\bundle\msi\EasyConvert_0.1.0_x64_en-US.msi`

## 📁 Project Structure

```
EasyConvert/
├── src/              # React frontend
├── src-tauri/        # Rust backend
│   ├── binaries/     # ✓ All conversion tools installed
│   └── src/          # Source code
├── package.json
└── README.md
```

## 🆘 Troubleshooting

**"Rust not found"**
- Restart your terminal
- Or run: `refreshenv` (if using chocolatey)

**"Conversion failed"**
- Check input file is valid
- Ensure output directory is writable
- Verify format combination is supported

**"Sidecar binary not found"**
- All binaries are in `src-tauri/binaries/` ✓
- If still issues, see SETUP.md for manual installation

## 💡 Tips

- **Batch Processing**: Add multiple files and convert all at once
- **Quality Settings**: Future feature - control output quality
- **Progress Tracking**: Real-time progress bars for each conversion
- **Cross-Platform**: Same codebase works on Windows and macOS

## 🎨 Features

- Modern, intuitive drag-and-drop UI
- Real-time conversion progress
- Batch file processing
- Automatic format detection
- No file size limits
- Completely offline - no cloud uploads
- Privacy-focused - all processing local

---

**Ready to convert?** Just run `npm run tauri:dev` and start converting! 🚀
