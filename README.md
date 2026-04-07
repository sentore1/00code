# ShotCode V2 - Ultra High Capacity Circular Barcode

A high-capacity circular barcode encoder/decoder that converts text into circular patterns with exceptional accuracy.

## Features

- **Ultra High Capacity**: Encode up to ~4,500 characters (raw) or ~8,000+ with compression
- **High Accuracy**: 9×9 sampling grid (81 sample points per segment) with adaptive thresholding
- **Real-time Encoding**: See the ShotCode pattern update as you type
- **Decode from Image**: Upload and decode ShotCode images with confidence metrics
- **Space Compression**: Automatic compression for repeated spaces
- **Test Mode**: Built-in encode/decode verification

## Installation

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

Open http://localhost:5173 (Vite default port)

## Build for Production

```bash
npm run build
```

## Usage

### Encoding
1. Type or paste text into the input field (up to 10,000 characters)
2. The ShotCode pattern generates automatically
3. Click "Download PNG" to save the image
4. Click "Test Decode" to verify accuracy

### Decoding
1. Click "Choose Image" button
2. Select a ShotCode PNG file
3. View decoded text with confidence percentage
4. Check browser console (F12) for detailed decode logs

## Technical Specifications

- **Configuration**: 150 rings × 240 segments = 36,000 bits
- **Canvas Size**: 4800×4800 pixels (ultra-large for maximum accuracy)
- **Capacity**: 4,498 bytes raw, ~8,000+ with space compression
- **Sampling**: 9×9 grid per segment (81 sample points)
- **Segment Angle**: 1.5° per segment
- **Threshold**: Adaptive (samples black center and white background)
- **Encoding**: Outer-to-inner ring order
- **Header**: 16-bit length field (supports up to 65,535 characters)

## How It Works

1. **Compression**: Repeated spaces (3+) are compressed using RLE markers
2. **Binary Conversion**: Text converted to 8-bit binary per character
3. **Length Header**: 16-bit header stores compressed text length
4. **Ring Encoding**: Data encoded from outer rings to inner rings
5. **Segment Encoding**: Each segment represents 1 bit (black=1, white=0)
6. **Decoding**: 9×9 sampling grid reads each segment with majority voting
7. **Adaptive Threshold**: Calculates optimal black/white threshold from actual image data
8. **Decompression**: Expands compressed spaces back to original text

## Accuracy Tips

- Use high-resolution PNG format for downloads
- Avoid JPEG compression (causes artifacts)
- Ensure good lighting when photographing printed codes
- Keep the code flat and centered when scanning
- Larger texts (500+ chars) work best with space-heavy content

## Project Structure

```
src/
├── App.jsx              # Main app component
├── ShotCodeV2.jsx       # Current ultra high capacity implementation
├── main.jsx             # React entry point
└── App.css              # Styles
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Requires HTML5 Canvas API

## License

MIT
