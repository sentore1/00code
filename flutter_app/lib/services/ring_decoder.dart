import 'dart:math' as math;
import 'package:image/image.dart' as img;

/// Decodes morphing codes by reading ring sections
/// 
/// The morphing code consists of 150 concentric rings, each containing
/// geometric shapes that represent binary data.
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

  /// Read all rings and return complete binary
  /// 
  /// This is the main decoding method that matches the web encoder exactly:
  /// 1. Scales image coordinates to match canvas size
  /// 2. Calculates adaptive threshold from black/white samples
  /// 3. Reads rings from outermost (149) to innermost (0)
  /// 4. Uses multi-sampling for better accuracy
  /// 5. Returns binary string matching encoded data
  Future<String> readAllRings(img.Image image) async {
    String binary = '';
    
    // Handle non-square images - use the smaller dimension
    final imageWidth = image.width;
    final imageHeight = image.height;
    final imageSize = imageWidth < imageHeight ? imageWidth : imageHeight;
    final scale = imageSize / canvasSize;
    
    // Center the decoding area
    final centerX = imageWidth / 2;
    final centerY = imageHeight / 2;
    
    final scaledInner = innerRadius * scale;
    final scaledOuter = outerRadius * scale;
    final ringWidth = (scaledOuter - scaledInner) / totalRings;
    
    print('Image size: ${imageWidth}x${imageHeight}');
    print('Using dimension: $imageSize');
    print('Scale factor: ${scale.toStringAsFixed(2)}');
    print('Center: (${centerX.toStringAsFixed(1)}, ${centerY.toStringAsFixed(1)})');
    print('Scaled inner: ${scaledInner.toStringAsFixed(1)}, outer: ${scaledOuter.toStringAsFixed(1)}');
    print('Ring width: ${ringWidth.toStringAsFixed(2)}');
    
    // Calculate adaptive threshold with more samples
    List<int> blackSamples = [];
    List<int> whiteSamples = [];
    
    // Sample center (black) - more samples for better threshold
    for (int i = 0; i < 40; i++) {
      final angle = (i / 40) * 2 * math.pi;
      final r = 65 * scale;
      final x = (centerX + r * math.cos(angle)).toInt();
      final y = (centerY + r * math.sin(angle)).toInt();
      blackSamples.add(_getPixelBrightness(image, x, y));
    }
    
    // Sample outside (white) - more samples for better threshold
    for (int i = 0; i < 40; i++) {
      final angle = (i / 40) * 2 * math.pi;
      final r = 970 * scale;
      final x = (centerX + r * math.cos(angle)).toInt();
      final y = (centerY + r * math.sin(angle)).toInt();
      whiteSamples.add(_getPixelBrightness(image, x, y));
    }
    
    final avgBlack = blackSamples.reduce((a, b) => a + b) / blackSamples.length;
    final avgWhite = whiteSamples.reduce((a, b) => a + b) / whiteSamples.length;
    
    // Use weighted threshold closer to black for better shape detection
    final threshold = avgBlack + (avgWhite - avgBlack) * 0.4;
    final contrast = avgWhite - avgBlack;
    
    print('Black avg: ${avgBlack.toStringAsFixed(1)}');
    print('White avg: ${avgWhite.toStringAsFixed(1)}');
    print('Contrast: ${contrast.toStringAsFixed(1)}');
    print('Threshold: ${threshold.toStringAsFixed(1)}');
    
    if (contrast < 30) {
      print('WARNING: Low contrast detected. Image may be too dark or too bright.');
    }

    // Read from outermost ring to innermost (matches web encoder)
    int lowConfidenceBits = 0;
    
    for (int ring = totalRings - 1; ring >= 0; ring--) {
      final r = scaledInner + ring * ringWidth + ringWidth / 2;
      final circumference = 2 * math.pi * r;
      final shapeSize = ringWidth * 0.8;
      final numShapes = (circumference / (shapeSize * 1.1)).floor();

      for (int i = 0; i < numShapes; i++) {
        final angle = (i / numShapes) * 2 * math.pi;
        final x = (centerX + r * math.cos(angle)).toInt();
        final y = (centerY + r * math.sin(angle)).toInt();

        // Multi-sample for better accuracy (13x13 grid = 169 samples per shape)
        int blackCount = 0;
        int whiteCount = 0;
        final sampleRadius = shapeSize * 0.5;
        
        // Sample in a 13x13 grid around the point for better accuracy
        for (int dx = -6; dx <= 6; dx++) {
          for (int dy = -6; dy <= 6; dy++) {
            final sx = x + (dx * sampleRadius / 6).toInt();
            final sy = y + (dy * sampleRadius / 6).toInt();
            final brightness = _getPixelBrightness(image, sx, sy);
            
            if (brightness < threshold) {
              blackCount++;
            } else {
              whiteCount++;
            }
          }
        }
        
        // Calculate confidence
        final total = blackCount + whiteCount;
        final confidence = (blackCount > whiteCount ? blackCount : whiteCount) / total;
        
        if (confidence < 0.65) {
          lowConfidenceBits++;
        }
        
        // Majority voting
        binary += blackCount > whiteCount ? '1' : '0';
      }
    }

    print('Read ${binary.length} total bits');
    print('Low confidence bits: $lowConfidenceBits (${(lowConfidenceBits / binary.length * 100).toStringAsFixed(1)}%)');
    
    return binary;
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
