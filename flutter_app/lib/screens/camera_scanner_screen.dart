import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image/image.dart' as img;
import 'dart:async';
import '../services/image_preprocessor.dart';
import '../services/ring_decoder.dart';

/// Real-time camera scanner with auto-detection
/// 
/// Features:
/// 1. Live camera preview
/// 2. Auto-detect morphing code
/// 3. Show detection overlay
/// 4. Auto-capture when stable
/// 5. Quality feedback
class CameraScannerScreen extends StatefulWidget {
  const CameraScannerScreen({Key? key}) : super(key: key);

  @override
  State<CameraScannerScreen> createState() => _CameraScannerScreenState();
}

class _CameraScannerScreenState extends State<CameraScannerScreen> {
  CameraController? _controller;
  bool _isDetecting = false;
  bool _codeDetected = false;
  Map<String, double>? _detectedCode;
  int _detectionStability = 0;
  Timer? _detectionTimer;
  
  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }
  
  @override
  void dispose() {
    _detectionTimer?.cancel();
    _controller?.dispose();
    super.dispose();
  }
  
  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        _showError('No camera available');
        return;
      }
      
      // Use back camera
      final camera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );
      
      _controller = CameraController(
        camera,
        ResolutionPreset.high,
        enableAudio: false,
      );
      
      await _controller!.initialize();
      
      if (mounted) {
        setState(() {});
        _startDetection();
      }
    } catch (e) {
      _showError('Camera error: $e');
    }
  }
  
  void _startDetection() {
    _detectionTimer = Timer.periodic(
      const Duration(milliseconds: 500),
      (_) => _detectCode(),
    );
  }
  
  Future<void> _detectCode() async {
    if (_isDetecting || _controller == null || !_controller!.value.isInitialized) {
      return;
    }
    
    _isDetecting = true;
    
    try {
      final image = await _controller!.takePicture();
      final bytes = await image.readAsBytes();
      final decoded = img.decodeImage(bytes);
      
      if (decoded != null) {
        final preprocessor = ImagePreprocessor();
        final detection = preprocessor.detectMorphingCode(decoded);
        
        if (detection != null) {
          // Code detected!
          setState(() {
            _codeDetected = true;
            _detectedCode = detection;
          });
          
          // Check stability (same detection multiple times)
          _detectionStability++;
          
          if (_detectionStability >= 3) {
            // Stable detection - auto capture
            _detectionTimer?.cancel();
            await _captureAndDecode(decoded);
          }
        } else {
          setState(() {
            _codeDetected = false;
            _detectedCode = null;
            _detectionStability = 0;
          });
        }
      }
    } catch (e) {
      print('Detection error: $e');
    } finally {
      _isDetecting = false;
    }
  }
  
  Future<void> _captureAndDecode(img.Image image) async {
    // Process and decode
    final preprocessor = ImagePreprocessor();
    final processed = preprocessor.preprocessImage(image);
    
    final decoder = RingDecoder();
    final binary = await decoder.readAllRings(processed);
    
    // Return result to previous screen
    if (mounted) {
      Navigator.pop(context, binary);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (_controller == null || !_controller!.value.isInitialized) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Morphing Code'),
        backgroundColor: Colors.black,
      ),
      body: Stack(
        children: [
          // Camera preview
          CameraPreview(_controller!),
          
          // Detection overlay
          if (_codeDetected && _detectedCode != null)
            CustomPaint(
              painter: DetectionOverlayPainter(_detectedCode!),
              size: Size.infinite,
            ),
          
          // Status overlay
          Positioned(
            top: 20,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(16),
              color: Colors.black54,
              child: Column(
                children: [
                  if (_codeDetected) ...[
                    const Icon(Icons.check_circle, color: Colors.green, size: 32),
                    const SizedBox(height: 8),
                    Text(
                      'Code Detected! Stabilizing... $_detectionStability/3',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ] else ...[
                    const Icon(Icons.search, color: Colors.orange, size: 32),
                    const SizedBox(height: 8),
                    const Text(
                      'Searching for morphing code...\nAlign the circular pattern in view',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
          ),
          
          // Manual capture button
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: FloatingActionButton(
                onPressed: () async {
                  _detectionTimer?.cancel();
                  final image = await _controller!.takePicture();
                  final bytes = await image.readAsBytes();
                  final decoded = img.decodeImage(bytes);
                  if (decoded != null) {
                    await _captureAndDecode(decoded);
                  }
                },
                backgroundColor: Colors.white,
                child: const Icon(Icons.camera, color: Colors.black, size: 32),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  void _showError(String message) {
    if (mounted) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Error'),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    }
  }
}

/// Custom painter for detection overlay
class DetectionOverlayPainter extends CustomPainter {
  final Map<String, double> detection;
  
  DetectionOverlayPainter(this.detection);
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.green
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    
    final centerX = detection['x']!;
    final centerY = detection['y']!;
    final radius = detection['radius']!;
    
    // Draw circle overlay
    canvas.drawCircle(
      Offset(centerX, centerY),
      radius,
      paint,
    );
    
    // Draw crosshair
    canvas.drawLine(
      Offset(centerX - 20, centerY),
      Offset(centerX + 20, centerY),
      paint,
    );
    canvas.drawLine(
      Offset(centerX, centerY - 20),
      Offset(centerX, centerY + 20),
      paint,
    );
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
