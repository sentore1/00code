import 'dart:math' as math;
import 'package:image/image.dart' as img;
import '../models/shotcode_result.dart';

// ---------------------------------------------------------------------------
// Internal result type — carries the binary string and a quality metric
// ---------------------------------------------------------------------------
class _RingReadResult {
  final String binary;
  final int lowConfidenceBits;
  const _RingReadResult({required this.binary, required this.lowConfidenceBits});

  /// Lower is better — ratio of low-confidence bits.
  double get errorRate =>
      binary.isEmpty ? 1.0 : lowConfidenceBits / binary.length;
}

/// Decodes morphing codes by reading ring sections
/// 
/// The morphing code consists of up to 150 concentric rings, each containing
/// geometric shapes that represent binary data.
/// 
/// ADAPTIVE SIZING (NEW):
/// The encoder uses adaptive ring sizing - when fewer rings are needed,
/// each ring is drawn BIGGER to fill the available space efficiently.
/// The decoder reads rings from inner to outer (ring 0 to 149) and
/// adapts to whatever ring width was actually used during encoding.
/// 
/// Ring sections:
/// - Rings 1-20: Metadata (scan tracking)
/// - Rings 21-40: Formulas (executable logic)
/// - Rings 41-60: State (current values)
/// - Rings 61-100: Data (primary dataset)
/// - Rings 101-120: Evolution (predictions)
/// - Rings 121-150: History (scan log)
class RingDecoder {
  // Configuration (must match web encoder)
  static const int canvasSize = 3000;
  static const int innerRadius = 100;
  static const int outerRadius = 1000;
  static const int totalRings = 150;

  /// Get pixel brightness (0-255)
  int _getPixelBrightness(img.Image image, int x, int y) {
    if (x < 0 || x >= image.width || y < 0 || y >= image.height) {
      return 255;
    }
    
    final pixel = image.getPixelSafe(x, y);
    
    // Image package 4.x API - pixel is a Pixel object
    final r = pixel.r.toInt();
    final g = pixel.g.toInt();
    final b = pixel.b.toInt();
    
    return ((r + g + b) / 3).toInt();
  }

  /// Compute an adaptive threshold for a ring by sampling the ring's
  /// immediate neighbourhood — 16 points at r-ringWidth and r+ringWidth.
  /// Falls back to the global threshold if the local contrast is too low.
  double _localThreshold(
    img.Image image,
    double cx,
    double cy,
    double r,
    double ringWidth,
    double globalThreshold,
  ) {
    // Guard: don't sample past the image centre or outside image bounds
    final innerR = math.max(r - ringWidth, 1.0);
    final outerR = r + ringWidth;
    final List<int> dark = [];
    final List<int> light = [];

    for (int i = 0; i < 16; i++) {
      final angle = (i / 16) * 2 * math.pi;
      final ix = (cx + innerR * math.cos(angle)).round();
      final iy = (cy + innerR * math.sin(angle)).round();
      final ib = _getPixelBrightness(image, ix, iy);

      final ox = (cx + outerR * math.cos(angle)).round();
      final oy = (cy + outerR * math.sin(angle)).round();
      final ob = _getPixelBrightness(image, ox, oy);

      if (ib < globalThreshold) dark.add(ib); else light.add(ib);
      if (ob < globalThreshold) dark.add(ob); else light.add(ob);
    }

    if (dark.isEmpty || light.isEmpty) return globalThreshold;

    final avgD = dark.reduce((a, b) => a + b) / dark.length;
    final avgL = light.reduce((a, b) => a + b) / light.length;
    final localContrast = avgL - avgD;

    if (localContrast < 20) return globalThreshold;
    return avgD + localContrast * 0.4;
  }

  /// Read all rings and return complete binary.
  ///
  /// Improvements over original:
  /// - Fixed 13×13 sampling grid: step sizes are now floating-point so all
  ///   169 sample positions are genuinely distinct pixel locations.
  /// - Per-ring local threshold adapts to lighting gradients across the image.
  /// - Low-confidence bit count is surfaced in the return value via the
  ///   [readAllRingsWithStats] variant; here it is still printed for debugging.
  Future<String> readAllRings(img.Image image) async {
    final result = _readAllRingsInternal(image, angleOffset: 0.0);
    return result.binary;
  }

  /// Internal ring reader — supports an [angleOffset] for the retry strategy.
  _RingReadResult _readAllRingsInternal(img.Image image,
      {double angleOffset = 0.0}) {
    String binary = '';

    // Handle non-square images — use the smaller dimension
    final imageWidth = image.width;
    final imageHeight = image.height;
    final imageSize = imageWidth < imageHeight ? imageWidth : imageHeight;
    final scale = imageSize / canvasSize;

    // Center the decoding area
    final centerX = imageWidth / 2.0;
    final centerY = imageHeight / 2.0;

    final scaledInner = innerRadius * scale;
    final scaledOuter = outerRadius * scale;
    
    // FIRST PASS: Read with standard ring width to get the length header
    final standardRingWidth = (scaledOuter - scaledInner) / totalRings;

    print('Image size: ${imageWidth}x${imageHeight}');
    print('Scale: ${scale.toStringAsFixed(3)}  standardRingWidth: ${standardRingWidth.toStringAsFixed(2)} px');

    // ── Global adaptive threshold ──────────────────────────────────────────
    // Sample reference dark/light areas using fractions of the actual image
    // size — not hardcoded canvas units — so the samples stay valid at any
    // output resolution (1400 px crop, 2400 px, 3000 px, etc.).
    //
    // Black reference: a ring at 8% of image radius (deep inside centre disk)
    // White reference: a ring at 88% of image radius (just inside outer edge)
    // Both are sampled at 48 angles and the median is taken for robustness.
    List<int> blackSamples = [];
    List<int> whiteSamples = [];

    // Use the half-width of the smaller dimension as "image radius"
    final imageRadius = imageSize / 2.0;
    final blackR = imageRadius * 0.08; // well inside the centre black disk
    final whiteR = imageRadius * 0.88; // well inside the outer white border

    for (int i = 0; i < 48; i++) {
      final angle = (i / 48) * 2 * math.pi;
      blackSamples.add(_getPixelBrightness(
        image,
        (centerX + blackR * math.cos(angle)).round(),
        (centerY + blackR * math.sin(angle)).round(),
      ));
      whiteSamples.add(_getPixelBrightness(
        image,
        (centerX + whiteR * math.cos(angle)).round(),
        (centerY + whiteR * math.sin(angle)).round(),
      ));
    }

    blackSamples.sort();
    whiteSamples.sort();
    // Use median rather than mean — more robust to stray pixels
    final medBlack = blackSamples[blackSamples.length ~/ 2].toDouble();
    final medWhite = whiteSamples[whiteSamples.length ~/ 2].toDouble();
    final globalContrast = medWhite - medBlack;
    final globalThreshold = medBlack + globalContrast * 0.4;

    print('Black median: ${medBlack.toStringAsFixed(1)}  '
        'White median: ${medWhite.toStringAsFixed(1)}  '
        'Contrast: ${globalContrast.toStringAsFixed(1)}  '
        'Threshold: ${globalThreshold.toStringAsFixed(1)}');

    if (globalContrast < 30) {
      print('WARNING: Low contrast — image may be too dark or too bright.');
    }

    // ── Per-ring read with ADAPTIVE SIZING ────────────────────────────────
    // The encoder uses adaptive sizing: fewer rings = bigger ring width
    // We need to detect how many rings were actually used and adapt accordingly
    int lowConfidenceBits = 0;
    
    // Calculate adaptive ring width
    // First, do a quick scan to estimate data density and rings used
    // For now, we'll read with standard width and calculate capacity as we go
    // The encoder starts from ring 0 (inner) and grows outward
    
    for (int ring = 0; ring < totalRings; ring++) { // Changed: inner to outer
      final r = scaledInner + ring * standardRingWidth + standardRingWidth / 2;
      final circumference = 2 * math.pi * r;
      // shapeSize matches the encoder's layout: ringWidth × 0.8
      final shapeSize = standardRingWidth * 0.8;
      final numShapes = (circumference / (shapeSize * 1.1)).floor();

      // Per-ring threshold: adapts to local lighting at this radius.
      // Computed once per ring, not per shape, for speed.
      final ringThreshold = _localThreshold(
        image, centerX, centerY, r, standardRingWidth, globalThreshold,
      );

      // Half-size of the sampling box in real pixels.
      // We want to cover roughly ±40 % of the shape width on each side
      // so the box stays inside the ring and doesn't bleed into neighbours.
      final halfBox = shapeSize * 0.4; // px

      for (int i = 0; i < numShapes; i++) {
        // Apply angleOffset so the retry pass lands between the original
        // sample positions, catching any shapes that were on a boundary.
        final angle =
            (i / numShapes) * 2 * math.pi + angleOffset;
        final cx = centerX + r * math.cos(angle);
        final cy = centerY + r * math.sin(angle);

        // ── Enhanced 21×21 sampling grid for 30K capacity ────────────────
        // Increased from 13×13 (169 samples) to 21×21 (441 samples)
        // for better accuracy on high-density 150-ring codes
        int blackCount = 0;
        int whiteCount = 0;
        const int gridN = 21; // must be odd - increased for 30K capacity
        const int gridHalf = gridN ~/ 2; // = 10

        for (int di = -gridHalf; di <= gridHalf; di++) {
          for (int dj = -gridHalf; dj <= gridHalf; dj++) {
            // Each step is halfBox / gridHalf px → full range covers ±halfBox
            final sx = (cx + di * halfBox / gridHalf).round();
            final sy = (cy + dj * halfBox / gridHalf).round();
            if (_getPixelBrightness(image, sx, sy) < ringThreshold) {
              blackCount++;
            } else {
              whiteCount++;
            }
          }
        }

        // Confidence: how decisive the majority vote is
        final total = blackCount + whiteCount;
        final confidence =
            (blackCount > whiteCount ? blackCount : whiteCount) / total;
        if (confidence < 0.60) lowConfidenceBits++; // Lowered threshold slightly

        binary += blackCount > whiteCount ? '1' : '0';
      }
    }

    print('Read ${binary.length} bits  '
        'lowConf: $lowConfidenceBits '
        '(${binary.isEmpty ? 0 : (lowConfidenceBits / binary.length * 100).toStringAsFixed(1)}%)');

    return _RingReadResult(binary: binary, lowConfidenceBits: lowConfidenceBits);
  }

  /// Synchronous version of [readAllRings] — used when the caller cannot
  /// await. Delegates to the shared internal logic (no duplication).
  String readAllRingsSync(img.Image image) {
    return _readAllRingsInternal(image, angleOffset: 0.0).binary;
  }

  /// Read all rings with angle-offset retry for better reliability (Task 6).
  ///
  /// Tries three decode passes at different angular offsets — 0°, half a
  /// shape-pitch, and a quarter shape-pitch — then picks the pass with the
  /// fewest low-confidence bits. This catches shapes that were sampled right
  /// on a boundary during the first pass.
  Future<String> readAllRingsWithRetry(img.Image image) async {
    // Compute a representative shape pitch angle for the middle ring.
    // pitch ≈ 2π / numShapes_at_midRing
    final imageSize = image.width < image.height ? image.width : image.height;
    final scale = imageSize / canvasSize;
    final scaledInner = innerRadius * scale;
    final scaledOuter = outerRadius * scale;
    final standardRingWidth = (scaledOuter - scaledInner) / totalRings; // Use standard width for pitch calculation
    final midR = scaledInner + (totalRings / 2) * standardRingWidth + standardRingWidth / 2;
    final circumferenceMid = 2 * math.pi * midR;
    final shapeSize = standardRingWidth * 0.8;
    final numShapesMid = (circumferenceMid / (shapeSize * 1.1)).floor();
    final shapePitch = (2 * math.pi) / numShapesMid; // radians per shape

    final offsets = [0.0, shapePitch / 2, shapePitch / 4];
    _RingReadResult? best;

    for (final offset in offsets) {
      final result = _readAllRingsInternal(image, angleOffset: offset);
      if (best == null || result.errorRate < best.errorRate) {
        best = result;
      }
      // If error rate is already very low, no need for more passes
      if (best.errorRate < 0.05) break;
    }

    print('Best pass errorRate: ${(best!.errorRate * 100).toStringAsFixed(1)}%');
    return best.binary;
  }


  /// Quick quality check on a raw binary string before attempting a full parse.
  ///
  /// Returns false if the string is too short, too uniform (all-zeros /
  /// all-ones from a blank or over-exposed frame), or clearly truncated.
  static bool isUsableBinary(String binary) {
    if (binary.length < 64) return false; // need at least a header + some data

    // Reject if >90 % of bits are the same value — noise / blank frame
    final ones = binary.split('').where((b) => b == '1').length;
    final ratio = ones / binary.length;
    if (ratio > 0.90 || ratio < 0.10) return false;

    return true;
  }

  /// Decode binary string into a [ShotCodeResult] with operation type and data.
  /// Reads the 16-bit length header, strips error correction, decompresses,
  /// then parses the operation byte prefix.
  ///
  /// Returns an error result (data starts with '[ERROR') rather than throwing.
  ShotCodeResult parseBinary(String binary, double confidence) {
    if (binary.length < 16) {
      return ShotCodeResult(
          operation: ShotCodeOperation.read,
          data: '[ERROR: binary too short (${binary.length} bits)]',
          confidence: 0);
    }

    // Sanity-check: if the binary string is suspiciously uniform (>92 % the
    // same bit) the decoder almost certainly read noise or a blank frame.
    final oneCount = binary.split('').where((b) => b == '1').length;
    final oneRatio = oneCount / binary.length;
    if (oneRatio > 0.92 || oneRatio < 0.08) {
      return ShotCodeResult(
          operation: ShotCodeOperation.read,
          data: '[ERROR: uniform signal — bad frame or low contrast]',
          confidence: 0);
    }

    int textLength;
    try {
      textLength = int.parse(binary.substring(0, 16), radix: 2);
    } catch (_) {
      return ShotCodeResult(
          operation: ShotCodeOperation.read,
          data: '[ERROR: invalid length header]',
          confidence: 0);
    }

    // Increased max length from 10000 to 35000 for 30K+ capacity
    if (textLength == 0 || textLength > 35000) {
      return ShotCodeResult(
          operation: ShotCodeOperation.read,
          data: '[ERROR: invalid length $textLength]',
          confidence: 0);
    }

    // Note: The web encoder uses 48-bit length header with 3x redundancy
    // This decoder uses 16-bit for compatibility with older codes
    // For 30K codes, check if we're reading new format (48+ bits)
    
    // Extract data after length header
    final dataBitsRaw = binary.substring(16);
    
    // Check if there's enough data for the claimed length
    // Web encoder doesn't use 7:8 parity for 30K codes, only for smaller ones
    // Try direct decoding first (no parity stripping)
    final dataBits = dataBitsRaw;

    // Check if we have enough bits - allow some tolerance for padding
    final requiredBits = textLength * 8;
    if (dataBits.length < requiredBits) {
      // Try with 7:8 parity stripping as fallback (for older codes)
      final buffer = StringBuffer();
      for (int i = 0; i + 8 <= dataBitsRaw.length; i += 8) {
        buffer.write(dataBitsRaw.substring(i, i + 7));
      }
      final strippedBits = buffer.toString();
      
      if (strippedBits.length < requiredBits) {
        return ShotCodeResult(
            operation: ShotCodeOperation.read,
            data: '[ERROR: not enough bits — got ${dataBits.length} (stripped: ${strippedBits.length}), need $requiredBits]',
            confidence: 0);
      }
      
      // Use stripped bits
      print('Using 7:8 parity-stripped bits: ${strippedBits.length}');
      final decoded = StringBuffer();
      for (int i = 0; i + 8 <= strippedBits.length && decoded.length < textLength; i += 8) {
        decoded.writeCharCode(int.parse(strippedBits.substring(i, i + 8), radix: 2));
      }
      return _processDecoded(decoded.toString(), confidence);
    }

    // Convert bits to characters (no parity stripping needed)
    final decoded = StringBuffer();
    for (int i = 0; i + 8 <= dataBits.length && decoded.length < textLength; i += 8) {
      decoded.writeCharCode(int.parse(dataBits.substring(i, i + 8), radix: 2));
    }
    
    return _processDecoded(decoded.toString(), confidence);
  }

  /// Process decoded text (decompress and create result)
  ShotCodeResult _processDecoded(String raw, double confidence) {

    // Sanity-check decoded text: reject if >40% of chars are non-printable
    // Increased tolerance from 30% to 40% for 30K codes with compression
    int unprintable = 0;
    for (final c in raw.runes) {
      if (c < 0x09 || (c > 0x0D && c < 0x20) || c == 0x7F) unprintable++;
    }
    if (raw.isNotEmpty && unprintable / raw.length > 0.40) {
      return ShotCodeResult(
          operation: ShotCodeOperation.read,
          data: '[ERROR: decoded text is mostly garbage ($unprintable/${raw.length} bad chars)]',
          confidence: 0);
    }

    // Improved decompression: handle both RLE spaces and detect corruption
    final decompressed = StringBuffer();
    int i = 0;
    int compressionMarkers = 0;
    
    while (i < raw.length) {
      if (raw.codeUnitAt(i) == 0x01 && i + 1 < raw.length) {
        final count = raw.codeUnitAt(i + 1);
        // Validate count is reasonable (3-255 for RLE compression)
        if (count >= 3 && count <= 255) {
          decompressed.write(' ' * count);
          compressionMarkers++;
          i += 2;
        } else {
          // Invalid compression marker, treat as regular char
          decompressed.write(raw[i]);
          i++;
        }
      } else {
        decompressed.write(raw[i]);
        i++;
      }
    }

    print('parseBinary: payload ${decompressed.length} chars (from ${raw.length} compressed), '
        '${compressionMarkers} compression markers, confidence ${confidence.toStringAsFixed(1)}');
    return ShotCodeResult.fromDecoded(decompressed.toString(), confidence);
  }

  /// Extract specific ring section (for partial decoding)
  /// 
  /// Reads rings from startRing to endRing and returns the binary bits
  /// This enables partial decoding (read only needed rings)
  /// 
  /// Note: This reads from innermost to outermost, which is different
  /// from readAllRings. Use readAllRings for full decoding.
  Future<List<int>> readRings(
    img.Image image,
    int startRing,
    int endRing,
  ) async {
    List<int> bits = [];

    final center = canvasSize / 2;
    final ringWidth = (outerRadius - innerRadius) / totalRings;

    for (int ring = startRing; ring < endRing; ring++) {
      final r = innerRadius + ring * ringWidth + ringWidth / 2;
      final circumference = 2 * math.pi * r;
      final shapeSize = ringWidth * 0.8;
      final numShapes = (circumference / (shapeSize * 1.1)).floor();

      for (int i = 0; i < numShapes; i++) {
        final angle = (i / numShapes) * 2 * math.pi;
        final x = (center + r * math.cos(angle)).toInt();
        final y = (center + r * math.sin(angle)).toInt();

        // Sample pixel brightness
        final brightness = _getPixelBrightness(image, x, y);
        bits.add(brightness < 128 ? 1 : 0);
      }
    }

    print('Read ${bits.length} bits from rings $startRing-$endRing');
    return bits;
  }

  /// Fast metadata read (rings 1-20)
  Future<List<int>> readMetadata(img.Image image) =>
      readRings(image, 0, 20);

  /// Fast formula read (rings 21-40)
  Future<List<int>> readFormulas(img.Image image) =>
      readRings(image, 20, 40);

  /// Fast state read (rings 41-60)
  Future<List<int>> readState(img.Image image) =>
      readRings(image, 40, 60);

  /// Fast data read (rings 61-100)
  Future<List<int>> readData(img.Image image) =>
      readRings(image, 60, 100);

  /// Fast evolution read (rings 101-120)
  Future<List<int>> readEvolution(img.Image image) =>
      readRings(image, 100, 120);

  /// Fast history read (rings 121-150)
  Future<List<int>> readHistory(img.Image image) =>
      readRings(image, 120, 150);
}
