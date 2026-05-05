import 'package:image/image.dart' as img;
import 'dart:math' as math;

/// Image preprocessing for better decoding accuracy
/// 
/// Optimizations for bad cameras:
/// 1. Auto-detect morphing code location
/// 2. Crop to code area
/// 3. Enhance contrast
/// 4. Sharpen edges
/// 5. Denoise
/// 6. Normalize brightness
class ImagePreprocessor {
  /// Detect the morphing code circle in the image
  /// 
  /// Returns: {x, y, radius} of the detected circle, or null if not found
  Map<String, double>? detectMorphingCode(img.Image image) {
    print('Detecting morphing code...');
    
    final width = image.width;
    final height = image.height;
    
    // The morphing code should be a significant portion of the image
    // Look for a large circular pattern, not just any dark spot
    
    // Try different potential radii (from 20% to 45% of image size)
    final minRadius = (math.min(width, height) * 0.2).toInt();
    final maxRadius = (math.min(width, height) * 0.45).toInt();
    
    print('Searching for radius between $minRadius and $maxRadius');
    
    Map<String, double>? bestDetection;
    double bestScore = 0;
    
    // Search in a grid of potential centers
    final stepX = width ~/ 8;
    final stepY = height ~/ 8;
    
    for (int cx = width ~/ 4; cx < width * 3 ~/ 4; cx += stepX) {
      for (int cy = height ~/ 4; cy < height * 3 ~/ 4; cy += stepY) {
        // Try different radii at this center
        for (int r = minRadius; r < maxRadius; r += 50) {
          final score = _scoreCircleDetection(image, cx.toDouble(), cy.toDouble(), r.toDouble());
          
          if (score > bestScore) {
            bestScore = score;
            bestDetection = {
              'x': cx.toDouble(),
              'y': cy.toDouble(),
              'radius': r.toDouble(),
            };
          }
        }
      }
    }
    
    print('Best detection score: ${bestScore.toStringAsFixed(2)}');
    
    if (bestScore < 0.3) {
      print('Detection score too low, using default (center of image)');
      // Use center of image with default radius
      return {
        'x': width / 2,
        'y': height / 2,
        'radius': math.min(width, height) * 0.35,
      };
    }
    
    if (bestDetection != null) {
      print('Detected center: (${bestDetection['x']}, ${bestDetection['y']})');
      print('Detected radius: ${bestDetection['radius']}');
    }
    
    return bestDetection;
  }
  
  /// Score a potential circle detection
  /// 
  /// Checks for:
  /// 1. Dark center (black circle)
  /// 2. Light middle area (white background with shapes)
  /// 3. Dark outer ring (black border)
  /// 
  /// Returns score 0-1 (higher is better)
  double _scoreCircleDetection(img.Image image, double cx, double cy, double radius) {
    int centerBlackCount = 0;
    int middleWhiteCount = 0;
    int outerBlackCount = 0;
    int samples = 0;
    
    // Sample at different radii
    final centerRadius = radius * 0.1; // Inner 10%
    final middleRadius = radius * 0.5; // Middle 50%
    final outerRadius = radius * 0.95; // Outer 95%
    
    for (int i = 0; i < 36; i++) {
      final angle = (i / 36) * 2 * math.pi;
      
      // Check center (should be black)
      final centerX = (cx + centerRadius * math.cos(angle)).toInt();
      final centerY = (cy + centerRadius * math.sin(angle)).toInt();
      if (_isInBounds(image, centerX, centerY)) {
        if (_getPixelBrightness(image, centerX, centerY) < 100) {
          centerBlackCount++;
        }
        samples++;
      }
      
      // Check middle (should be white/light)
      final middleX = (cx + middleRadius * math.cos(angle)).toInt();
      final middleY = (cy + middleRadius * math.sin(angle)).toInt();
      if (_isInBounds(image, middleX, middleY)) {
        if (_getPixelBrightness(image, middleX, middleY) > 150) {
          middleWhiteCount++;
        }
      }
      
      // Check outer (should be black)
      final outerX = (cx + outerRadius * math.cos(angle)).toInt();
      final outerY = (cy + outerRadius * math.sin(angle)).toInt();
      if (_isInBounds(image, outerX, outerY)) {
        if (_getPixelBrightness(image, outerX, outerY) < 100) {
          outerBlackCount++;
        }
      }
    }
    
    if (samples == 0) return 0;
    
    // Calculate score based on pattern match
    final centerScore = centerBlackCount / 36;
    final middleScore = middleWhiteCount / 36;
    final outerScore = outerBlackCount / 36;
    
    // Weighted average (center and outer are most important)
    return (centerScore * 0.4 + middleScore * 0.2 + outerScore * 0.4);
  }
  
  bool _isInBounds(img.Image image, int x, int y) {
    return x >= 0 && x < image.width && y >= 0 && y < image.height;
  }
  
  /// Preprocess image for better decoding
  /// 
  /// Steps:
  /// 1. Detect and crop to morphing code (FAST)
  /// 2. Resize to optimal size (3000x3000)
  /// 3. Enhance contrast
  /// 4. Sharpen
  img.Image preprocessImage(img.Image image) {
    print('Preprocessing image...');
    print('Original size: ${image.width}x${image.height}');
    
    // Step 1: Quick detection (skip if image is already square and good size)
    img.Image processed = image;
    
    final isSquare = (image.width - image.height).abs() < 100;
    final isGoodSize = image.width >= 2000 && image.width <= 4000;
    
    if (!isSquare || !isGoodSize) {
      print('Quick detection...');
      final detection = detectMorphingCodeFast(image);
      
      if (detection != null) {
        // Crop to the detected area with padding
        final centerX = detection['x']!.toInt();
        final centerY = detection['y']!.toInt();
        final radius = detection['radius']!.toInt();
        final padding = (radius * 0.15).toInt();
        
        final cropSize = (radius + padding) * 2;
        final cropX = (centerX - radius - padding).clamp(0, image.width - 1);
        final cropY = (centerY - radius - padding).clamp(0, image.height - 1);
        final cropWidth = cropSize.clamp(1, image.width - cropX);
        final cropHeight = cropSize.clamp(1, image.height - cropY);
        
        print('Cropping to: ($cropX, $cropY, $cropWidth, $cropHeight)');
        
        processed = img.copyCrop(
          processed,
          x: cropX,
          y: cropY,
          width: cropWidth,
          height: cropHeight,
        );
      }
    }
    
    // Step 2: Resize to square 3000x3000 (optimal for decoder)
    final targetSize = 3000;
    if (processed.width != targetSize || processed.height != targetSize) {
      print('Resizing to ${targetSize}x$targetSize');
      processed = img.copyResize(
        processed,
        width: targetSize,
        height: targetSize,
        interpolation: img.Interpolation.linear, // Faster than cubic
      );
    }
    
    // Step 3: Enhance contrast (quick)
    print('Enhancing contrast...');
    processed = img.adjustColor(
      processed,
      contrast: 1.2,
      brightness: 1.05,
    );
    
    // Step 4: Light sharpen (skip heavy processing)
    print('Sharpening...');
    processed = img.convolution(
      processed,
      filter: [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0,
      ],
    );
    
    print('Preprocessing complete');
    return processed;
  }
  
  /// Fast morphing code detection (optimized for speed)
  /// 
  /// Uses coarse sampling and simple heuristics
  Map<String, double>? detectMorphingCodeFast(img.Image image) {
    print('Fast detection...');
    
    final width = image.width;
    final height = image.height;
    
    // Assume code is roughly centered (most common case)
    final centerX = width / 2;
    final centerY = height / 2;
    
    // Estimate radius by finding the outer black ring
    // Sample only 8 directions (fast)
    double? detectedRadius;
    
    for (double r = math.min(width, height) * 0.2; r < math.min(width, height) * 0.5; r += 30) {
      int blackCount = 0;
      
      // Sample in 8 directions only
      for (int i = 0; i < 8; i++) {
        final angle = (i / 8) * 2 * math.pi;
        final x = (centerX + r * math.cos(angle)).toInt();
        final y = (centerY + r * math.sin(angle)).toInt();
        
        if (_isInBounds(image, x, y)) {
          final brightness = _getPixelBrightness(image, x, y);
          if (brightness < 100) blackCount++;
        }
      }
      
      // If we find a ring with >50% black pixels, that's the outer ring
      if (blackCount >= 4) {
        detectedRadius = r;
        break;
      }
    }
    
    if (detectedRadius == null) {
      print('Using default radius');
      detectedRadius = math.min(width, height) * 0.35;
    }
    
    print('Fast detected: center ($centerX, $centerY), radius $detectedRadius');
    
    return {
      'x': centerX,
      'y': centerY,
      'radius': detectedRadius,
    };
  }
  
  /// Check if image quality is good enough for decoding
  /// 
  /// Returns quality score 0-100 (FAST version)
  int assessImageQuality(img.Image image) {
    int score = 100;
    
    // Check 1: Resolution
    final minDimension = math.min(image.width, image.height);
    if (minDimension < 1000) {
      score -= 30;
    } else if (minDimension < 2000) {
      score -= 15;
    }
    
    // Check 2: Quick contrast check (only 20 samples)
    List<int> samples = [];
    final random = math.Random();
    for (int i = 0; i < 20; i++) {
      final x = (image.width * random.nextDouble()).toInt();
      final y = (image.height * random.nextDouble()).toInt();
      samples.add(_getPixelBrightness(image, x, y));
    }
    
    samples.sort();
    final contrast = samples[18] - samples[2];
    
    if (contrast < 50) {
      score -= 25;
    } else if (contrast < 100) {
      score -= 10;
    }
    
    print('Quality score: $score/100');
    return score.clamp(0, 100);
  }
  
  int _getPixelBrightness(img.Image image, int x, int y) {
    if (x < 0 || x >= image.width || y < 0 || y >= image.height) {
      return 255;
    }
    
    final pixel = image.getPixelSafe(x, y);
    final r = pixel.r.toInt();
    final g = pixel.g.toInt();
    final b = pixel.b.toInt();
    
    return ((r + g + b) / 3).toInt();
  }
}
