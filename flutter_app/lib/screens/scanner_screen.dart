import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image/image.dart' as img;
import 'dart:io';
import '../services/ring_decoder.dart';
import '../services/grid_decoder.dart';
import '../services/chunk_extractor.dart';
import '../services/formula_executor.dart';
import '../services/ai_reasoning.dart';
import '../services/image_preprocessor.dart';
import '../database/database_helper.dart';
import 'package:uuid/uuid.dart';

/// Scanner Screen with Enhanced Scanning Experience
/// 
/// Features:
/// 1. Image preview before processing
/// 2. Quality feedback
/// 3. Scanning tips
/// 4. Progress indicator
/// 5. Better error handling
class ScannerScreen extends StatefulWidget {
  const ScannerScreen({Key? key}) : super(key: key);

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  bool _isProcessing = false;
  String? _lastResult;
  String _selectedFormat = 'advanced'; // Default to advanced
  File? _selectedImage;
  String? _qualityFeedback;
  int? _qualityScore;

  final List<Map<String, String>> _formats = [
    {'id': 'advanced', 'name': 'Advanced (30K)', 'desc': '150 rings, highest capacity'},
    {'id': 'simple', 'name': 'Simple (5K)', 'desc': '30 rings, faster decoding'},
  ];

  /// Decompress text by replacing markers with spaces
  /// 
  /// Reverse of compress():
  /// 1. Scan through compressed text
  /// 2. Look for \x01 marker
  /// 3. Next byte is the space count
  /// 4. Replace with that many spaces
  String _decompress(String compressed) {
    String result = '';
    int i = 0;
    while (i < compressed.length) {
      if (compressed.codeUnitAt(i) == 1) {
        // Found marker, next byte is count
        if (i + 1 < compressed.length) {
          final count = compressed.codeUnitAt(i + 1);
          result += ' ' * count;
          i += 2;
        } else {
          i++;
        }
      } else {
        result += compressed[i];
        i++;
      }
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Morphing Code'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Header
              const Icon(Icons.qr_code_scanner, size: 64, color: Colors.blue),
              const SizedBox(height: 20),
              const Text(
                'Scan Morphing Code',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              const Text(
                'Select format and capture image',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
              const SizedBox(height: 30),
              
              // Format selector
              _buildFormatSelector(),
              
              const SizedBox(height: 30),
              
              // Image preview
              if (_selectedImage != null) ...[
                _buildImagePreview(),
                const SizedBox(height: 20),
              ],
              
              // Quality feedback
              if (_qualityFeedback != null) ...[
                _buildQualityFeedback(),
                const SizedBox(height: 20),
              ],
              
              // Action buttons
              if (_isProcessing)
                Column(
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 10),
                    const Text('Processing image...'),
                  ],
                )
              else if (_selectedImage == null)
                _buildCaptureButtons()
              else
                _buildProcessButtons(),
              
              // Scanning tips
              const SizedBox(height: 30),
              _buildScanningTips(),
              
              // Result display
              if (_lastResult != null) ...[
                const SizedBox(height: 30),
                _buildResultDisplay(),
              ],
            ],
          ),
        ),
      ),
    );
  }
  
  /// Build format selector
  Widget _buildFormatSelector() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select Code Format:',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ..._formats.map((format) => RadioListTile<String>(
            title: Text(format['name']!),
            subtitle: Text(format['desc']!),
            value: format['id']!,
            groupValue: _selectedFormat,
            onChanged: (value) {
              setState(() {
                _selectedFormat = value!;
                _selectedImage = null;
                _qualityFeedback = null;
                _qualityScore = null;
              });
            },
            dense: true,
            contentPadding: EdgeInsets.zero,
          )).toList(),
        ],
      ),
    );
  }
  
  /// Build image preview
  Widget _buildImagePreview() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[400]!, width: 2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Image.file(
          _selectedImage!,
          height: 300,
          fit: BoxFit.contain,
        ),
      ),
    );
  }
  
  /// Build quality feedback
  Widget _buildQualityFeedback() {
    Color feedbackColor;
    IconData feedbackIcon;
    
    if (_qualityScore! >= 70) {
      feedbackColor = Colors.green;
      feedbackIcon = Icons.check_circle;
    } else if (_qualityScore! >= 40) {
      feedbackColor = Colors.orange;
      feedbackIcon = Icons.warning;
    } else {
      feedbackColor = Colors.red;
      feedbackIcon = Icons.error;
    }
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: feedbackColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: feedbackColor),
      ),
      child: Row(
        children: [
          Icon(feedbackIcon, color: feedbackColor, size: 32),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Quality: $_qualityScore/100',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: feedbackColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _qualityFeedback!,
                  style: TextStyle(fontSize: 14, color: feedbackColor),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  /// Build capture buttons
  Widget _buildCaptureButtons() {
    return Column(
      children: [
        ElevatedButton.icon(
          onPressed: _pickImageFromCamera,
          icon: const Icon(Icons.camera_alt),
          label: const Text('Take Photo'),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
            backgroundColor: Colors.blue,
            foregroundColor: Colors.white,
            minimumSize: const Size(200, 50),
          ),
        ),
        const SizedBox(height: 15),
        OutlinedButton.icon(
          onPressed: _pickImageFromGallery,
          icon: const Icon(Icons.image),
          label: const Text('Pick from Gallery'),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
            minimumSize: const Size(200, 50),
          ),
        ),
      ],
    );
  }
  
  /// Build process buttons
  Widget _buildProcessButtons() {
    return Column(
      children: [
        ElevatedButton.icon(
          onPressed: _processSelectedImage,
          icon: const Icon(Icons.play_arrow),
          label: const Text('Decode Image'),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
            backgroundColor: Colors.green,
            foregroundColor: Colors.white,
            minimumSize: const Size(200, 50),
          ),
        ),
        const SizedBox(height: 15),
        OutlinedButton.icon(
          onPressed: () {
            setState(() {
              _selectedImage = null;
              _qualityFeedback = null;
              _qualityScore = null;
            });
          },
          icon: const Icon(Icons.refresh),
          label: const Text('Take Another Photo'),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
            minimumSize: const Size(200, 50),
          ),
        ),
      ],
    );
  }
  
  /// Build scanning tips
  Widget _buildScanningTips() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lightbulb, color: Colors.blue[700]),
              const SizedBox(width: 8),
              Text(
                'Scanning Tips',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue[700],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildTip('Use good lighting (bright, even light)'),
          _buildTip('Hold phone steady or use a surface'),
          _buildTip('Fill the frame with the code'),
          _buildTip('Avoid shadows and glare'),
          _buildTip('Clean camera lens before scanning'),
          _buildTip('Get as close as possible'),
        ],
      ),
    );
  }
  
  Widget _buildTip(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontSize: 16)),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
  
  /// Build result display
  Widget _buildResultDisplay() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.green),
      ),
      child: Column(
        children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 32),
          const SizedBox(height: 10),
          const Text(
            'Scan Successful!',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.green,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            _lastResult!,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 14),
          ),
        ],
      ),
    );
  }

  /// Pick image from gallery
  Future<void> _pickImageFromGallery() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 100, // Maximum quality
    );

    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
        _qualityFeedback = null;
        _qualityScore = null;
      });
      await _assessImageQuality(pickedFile.path);
    }
  }

  /// Pick image from camera
  Future<void> _pickImageFromCamera() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 100, // Maximum quality
      preferredCameraDevice: CameraDevice.rear, // Use rear camera
    );

    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
        _qualityFeedback = null;
        _qualityScore = null;
      });
      await _assessImageQuality(pickedFile.path);
    }
  }
  
  /// Assess image quality before processing
  Future<void> _assessImageQuality(String imagePath) async {
    try {
      final imageBytes = await img.decodeImageFile(imagePath);
      
      if (imageBytes == null) {
        setState(() {
          _qualityScore = 0;
          _qualityFeedback = 'Failed to load image';
        });
        return;
      }
      
      final preprocessor = ImagePreprocessor();
      final quality = preprocessor.assessImageQuality(imageBytes);
      
      String feedback;
      if (quality >= 70) {
        feedback = 'Excellent! Ready to decode.';
      } else if (quality >= 40) {
        feedback = 'Good enough. Will apply enhancement.';
      } else {
        feedback = 'Poor quality. Consider retaking with better lighting.';
      }
      
      setState(() {
        _qualityScore = quality;
        _qualityFeedback = feedback;
      });
    } catch (e) {
      setState(() {
        _qualityScore = 0;
        _qualityFeedback = 'Error assessing quality: $e';
      });
    }
  }
  
  /// Process the selected image
  Future<void> _processSelectedImage() async {
    if (_selectedImage == null) return;
    
    setState(() {
      _isProcessing = true;
    });

    try {
      await _processImage(_selectedImage!.path);
    } catch (e) {
      _showError('Processing error: $e');
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  /// Process the picked image
  Future<void> _processImage(String imagePath) async {
    setState(() {
      _isProcessing = true;
    });

    try {
      // Read image file
      final imageBytes = await Future.delayed(
        const Duration(milliseconds: 100),
        () => img.decodeImageFile(imagePath),
      );

      if (imageBytes == null) {
        _showError('Failed to load image');
        return;
      }

      print('Loaded image: ${imageBytes.width}x${imageBytes.height}');
      print('Selected format: $_selectedFormat');
      
      String decodedText = '';
      
      // Decode based on selected format
      if (_selectedFormat == 'grid') {
        // Grid Code - No preprocessing needed
        final decoder = GridDecoder();
        decodedText = await decoder.decodeGrid(imageBytes);
      } else {
        // Morphing codes - Use preprocessing
        final preprocessor = ImagePreprocessor();
        final quality = _qualityScore ?? preprocessor.assessImageQuality(imageBytes);
        
        print('Image quality: $quality/100');
        
        if (quality < 30) {
          _showError(
            'Image quality too low ($quality/100).\n\n'
            'Tips:\n'
            '• Use better lighting\n'
            '• Hold phone steady\n'
            '• Get closer to the code\n'
            '• Clean camera lens\n'
            '• Avoid shadows and glare'
          );
          return;
        }
        
        img.Image processed = imageBytes;
        
        // Apply preprocessing if quality is not excellent
        if (quality < 70) {
          print('Preprocessing image...');
          processed = preprocessor.preprocessImage(imageBytes);
          print('Processed image: ${processed.width}x${processed.height}');
        } else {
          print('Quality is good, skipping preprocessing');
        }
        
        // Decode morphing code
        final decoder = RingDecoder();
        final binary = await decoder.readAllRings(processed);
        
        print('Total bits decoded: ${binary.length}');
        
        if (binary.length < 59) {
          _showError('Not enough data decoded. Got ${binary.length} bits, need at least 59.');
          return;
        }
        
        print('First 100 bits: ${binary.substring(0, 100.clamp(0, binary.length))}');
        
        // Decode header
        final len1 = int.parse(binary.substring(0, 16), radix: 2);
        final len2 = int.parse(binary.substring(16, 32), radix: 2);
        final len3 = int.parse(binary.substring(32, 48), radix: 2);
        
        int byteLength = len1;
        if (len1 == len2 || len1 == len3) {
          byteLength = len1;
        } else if (len2 == len3) {
          byteLength = len2;
        }
        
        print('Length candidates: $len1, $len2, $len3 -> Using: $byteLength');
        
        if (byteLength > 50000 || byteLength == 0) {
          _showError('Invalid byte length: $byteLength. This may not be a valid code.');
          return;
        }
        
        final shapeIndex = int.parse(binary.substring(48, 51), radix: 2);
        final shapes = ['diamond', 'triangle', 'hexagon', 'chevron'];
        final decodedShape = shapeIndex < shapes.length ? shapes[shapeIndex] : 'unknown';
        
        final scanCount = int.parse(binary.substring(51, 59), radix: 2);
        
        print('Shape: $decodedShape (index: $shapeIndex)');
        print('Scan count: $scanCount');
        
        final dataBitLength = byteLength * 8;
        final expectedTotalBits = 59 + dataBitLength;
        
        if (binary.length < expectedTotalBits) {
          _showError('Incomplete data: expected $expectedTotalBits bits, got ${binary.length} bits.');
          return;
        }
        
        final dataBits = binary.substring(59, 59 + dataBitLength);
        
        List<int> bytes = [];
        for (int i = 0; i < dataBits.length; i += 8) {
          if (i + 8 <= dataBits.length) {
            bytes.add(int.parse(dataBits.substring(i, i + 8), radix: 2));
          }
        }
        
        print('Decoded ${bytes.length} bytes');
        
        try {
          decodedText = String.fromCharCodes(bytes);
        } catch (e) {
          _showError('UTF-8 decode error: $e');
          return;
        }
        
        if (decodedText.contains('\x01')) {
          print('Decompressing text...');
          decodedText = _decompress(decodedText);
        }
      }
      
      print('Decoded text length: ${decodedText.length}');
      print('Decoded text preview: ${decodedText.substring(0, 50.clamp(0, decodedText.length))}');
      
      if (decodedText.isEmpty) {
        _showError('Decoded text is empty. Try scanning again.');
        return;
      }
      
      // Build dataset
      final dataset = {
        'id': DateTime.now().millisecondsSinceEpoch,
        'type': _selectedFormat,
        'text': decodedText,
        'timestamp': DateTime.now().toIso8601String(),
      };

      // Execute formulas (using decoded text as input)
      final executor = FormulaExecutor();
      final execution = await executor.execute(dataset);

      // Generate AI insights
      final aiEngine = AIReasoningEngine();
      final reasoning = await aiEngine.analyzeDataset(dataset);

      // Store in database
      final db = DatabaseHelper();
      await db.insertScan({
        'id': const Uuid().v4(),
        'scanNumber': DateTime.now().millisecondsSinceEpoch,
        'timestamp': DateTime.now().toIso8601String(),
        'deviceId': 'flutter_app',
        'metadata': {
          'format': _selectedFormat,
          'textLength': decodedText.length,
        },
        'execution': execution,
        'aiInsights': reasoning,
      });

      // Show result
      setState(() {
        _lastResult =
            'Format: $_selectedFormat\nText: ${decodedText.substring(0, 30.clamp(0, decodedText.length))}...';
        _isProcessing = false;
      });

      // Show success dialog
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Scan Successful'),
            content: Text(
              'Format: $_selectedFormat\n'
              'Length: ${decodedText.length} chars\n\n'
              '${decodedText.substring(0, 200.clamp(0, decodedText.length))}${decodedText.length > 200 ? '...' : ''}\n\n'
              'Confidence: ${(reasoning['confidence'] * 100).toStringAsFixed(0)}%',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      _showError('Error: $e');
    }
  }

  /// Show error dialog
  void _showError(String message) {
    setState(() {
      _isProcessing = false;
    });

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
