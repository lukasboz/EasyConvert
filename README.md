# EasyConvert

A cross-platform desktop file converter built with Tauri and React. Convert between various file formats with a modern, drag-and-drop interface.

## Features

- **Image Conversion**: JPG, PNG, WebP, GIF, BMP, TIFF, HEIC, ICO (and SVG input)
- **Video Conversion**: MP4, MKV, WebM, MOV, AVI, FLV, 3GP, M4V, TS, WMV
- **Audio Conversion**: MP3, WAV, FLAC, AAC, OGG, M4A, OPUS, WMA, ALAC
- **Document Conversion**: PDF, DOCX, TXT, Markdown, HTML, RTF, EPUB, ODT, RST
- **Archive Conversion**: ZIP, 7Z, TAR, GZ, BZ2, XZ

- Drag-and-drop interface
- Batch conversion support with bulk format selector
- Real-time progress tracking
- Quality slider, optional output folder, dark mode
- Keyboard shortcuts (Ctrl+O open · Ctrl+Enter convert · Esc clear)
- Cross-platform (Windows, macOS)

## Prerequisites

- **Node.js** 18 or later
- **Rust** 1.70 or later
- **Windows**: Visual Studio Build Tools with "Desktop development with C++" workload

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/easyconvert.git
cd easyconvert
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Download Conversion Binaries

**Windows:**
```powershell
.\scripts\download-binaries.ps1
```

This will download FFmpeg, ImageMagick, Pandoc, and 7-Zip to `src-tauri/binaries/`.

### 4. Run Development Server

```bash
npm run tauri:dev
```

The application will open automatically.

## Development

### Project Structure

```
EasyConvert/
├── src/                          # React frontend
│   ├── components/               # UI components
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript definitions
│   └── utils/                    # Helper functions
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── commands/             # Tauri command handlers
│   │   ├── converters/           # Format converters
│   │   ├── router/               # Conversion routing
│   │   ├── models/               # Data models
│   │   └── utils/                # Utilities
│   └── binaries/                 # External conversion tools
└── scripts/                      # Setup scripts
```

### Adding a New Format

1. Add format to `src-tauri/src/models/format.rs`
2. Implement converter in `src-tauri/src/converters/`
3. Register converter in `format_router.rs`
4. Update TypeScript types in `src/types/conversion.ts`

## Building

### Development Build

```bash
npm run tauri:dev
```

### Production Build

```bash
npm run tauri:build
```

Installers will be created in `src-tauri/target/release/bundle/`:
- **Windows**: `msi/EasyConvert_0.1.0_x64_en-US.msi`

## Testing Conversions

1. Drag files into the drop zone or click to browse
2. Select output format for each file
3. Click "Convert All"
4. Converted files will be saved in the same directory as the source files

## Troubleshooting

### "Sidecar binary not found"

Run the binary download script:
```powershell
.\scripts\download-binaries.ps1
```

### Conversion fails

Check that:
- The input file is not corrupted
- You have write permissions in the output directory
- The input format is supported

### Development server won't start

1. Ensure Node.js and Rust are installed:
   ```bash
   node --version
   cargo --version
   ```

2. Clean and reinstall dependencies:
   ```bash
   rm -rf node_modules dist
   npm install
   ```

## Technologies

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Tauri 2.0, Rust
- **Conversion Tools**: FFmpeg, ImageMagick, Pandoc, 7-Zip

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Acknowledgments

- [Tauri](https://tauri.app/) - Desktop app framework
- [FFmpeg](https://ffmpeg.org/) - Multimedia processing
- [ImageMagick](https://imagemagick.org/) - Image processing
- [Pandoc](https://pandoc.org/) - Document conversion
- [7-Zip](https://www.7-zip.org/) - Archive management
