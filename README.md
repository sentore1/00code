# ShotCode - Minimal Encoder & Decoder

A minimal black and white circular barcode encoder/decoder with dark/light mode.

## Features

- **Encode**: Convert text to circular ShotCode patterns (up to 400 characters)
- **Decode**: Upload and decode ShotCode images
- **LZW Compression**: Automatic compression for better capacity
- **Dark/Light Mode**: Toggle between themes
- **Minimal UI**: Clean black and white design

## Installation

```bash
npm install
```

## Run

```bash
npm run dev
```

Open http://localhost:3000

## Build

```bash
npm run build
```

## Usage

1. **Encode Mode**: Type text, see the ShotCode pattern, download as PNG
2. **Decode Mode**: Upload a ShotCode image to extract the text
3. Toggle theme with the sun/moon button in the header

## Technical Details

- 24 concentric rings × 72 segments
- 2 bits per segment
- LZW compression for text > 20 chars
- Position markers for alignment
- Grayscale intensity encoding
