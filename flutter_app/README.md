# Morphing Code Scanner - Flutter App

A Flutter application to scan and decode Advanced Morphing Codes with AI-powered insights.

## Features

- **Ring Decoder**: Reads 150 concentric rings from morphing code images
- **Chunk Extractor**: Parses binary data into structured chunks
- **Formula Executor**: Executes calculations (agriculture, logistics, business)
- **AI Reasoning**: Generates intelligent insights and recommendations
- **History Storage**: SQLite database for scan records and insights
- **Living Data System**: Same code → different results per scan

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── models/
│   └── scan_record.dart     # Scan data model
├── services/
│   ├── ring_decoder.dart    # Ring reading
│   ├── chunk_extractor.dart # Binary parsing
│   ├── formula_executor.dart # Formula execution
│   └── ai_reasoning.dart    # AI insights
├── database/
│   └── database_helper.dart # SQLite management
└── screens/
    ├── scanner_screen.dart  # Camera/gallery scanning
    ├── results_screen.dart  # Latest results
    ├── history_screen.dart  # Scan history
    └── insights_screen.dart # AI insights
```

## Getting Started

### Prerequisites

- Flutter 3.0+
- Dart 3.0+
- Android Studio or Xcode

### Installation

1. **Create Flutter project**
```bash
flutter create morphing_code_scanner
cd morphing_code_scanner
```

2. **Copy files**
- Copy all files from `flutter_app/lib/` to your `lib/` directory
- Copy `pubspec.yaml` to your project root

3. **Install dependencies**
```bash
flutter pub get
```

4. **Configure permissions**

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

**iOS** (`ios/Runner/Info.plist`):
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan morphing codes</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photos to scan morphing codes</string>
```

5. **Run the app**
```bash
flutter run
```

## How It Works

### 1. Scanner Screen
- Pick image from gallery or take photo
- App loads the image
- Decodes the morphing code

### 2. Ring Decoder
- Reads 150 concentric rings
- Extracts binary data
- Supports partial decoding (read only needed rings)

### 3. Chunk Extractor
- Parses metadata (scan tracking, device info)
- Extracts formulas (executable logic)
- Reads state (current values)
- Retrieves data (primary dataset)
- Gets evolution (predictions)
- Accesses history (scan log)

### 4. Formula Executor
- Executes agriculture formulas (yield, cost, profit)
- Executes logistics formulas (route, inventory, time)
- Executes business formulas (sales, pricing, demand)
- Generates recommendations

### 5. AI Reasoning
- Identifies patterns (trend, volatility, seasonality)
- Suggests actions (increase production, optimize costs)
- Generates insights (human-readable observations)
- Predicts outcomes (future results)

### 6. Database Storage
- Stores scan records
- Tracks state history
- Saves AI insights
- Enables historical analysis

## Screens

### Scanner Screen
- Pick image from gallery
- Take photo with camera
- Decode morphing code
- Show results

### Results Screen
- Display latest scan results
- Show execution results
- Display AI insights
- Show recommendations

### History Screen
- List all previous scans
- Show scan timeline
- View scan details
- Track evolution

### Insights Screen
- Display AI-generated insights
- Show patterns identified
- List suggestions
- Show predictions

## Database Schema

### Scans Table
```sql
CREATE TABLE scans (
  id TEXT PRIMARY KEY,
  scanNumber INTEGER,
  timestamp TEXT,
  deviceId TEXT,
  metadata TEXT,
  execution TEXT,
  aiInsights TEXT,
  decision TEXT,
  outcome TEXT,
  outcomeTime TEXT
)
```

### State History Table
```sql
CREATE TABLE state_history (
  id TEXT PRIMARY KEY,
  timestamp TEXT,
  state TEXT,
  mutation TEXT,
  evolution TEXT
)
```

### Insights Table
```sql
CREATE TABLE insights (
  id TEXT PRIMARY KEY,
  timestamp TEXT,
  patterns TEXT,
  suggestions TEXT,
  insights TEXT,
  predictions TEXT
)
```

## API Reference

### RingDecoder
```dart
// Read specific ring section
Future<List<int>> readRings(img.Image image, int startRing, int endRing)

// Fast reads
Future<List<int>> readMetadata(img.Image image)
Future<List<int>> readFormulas(img.Image image)
Future<List<int>> readState(img.Image image)
Future<List<int>> readData(img.Image image)
Future<List<int>> readEvolution(img.Image image)
Future<List<int>> readHistory(img.Image image)
```

### ChunkExtractor
```dart
// Parse binary into structured data
Map<String, dynamic> extractMetadata(List<int> bits)
Map<String, dynamic> extractFormulas(List<int> bits)
Map<String, dynamic> extractState(List<int> bits)
Map<String, dynamic> extractEvolution(List<int> bits)
```

### FormulaExecutor
```dart
// Execute formulas based on type
Future<Map<String, dynamic>> execute(Map<String, dynamic> dataset)
```

### AIReasoningEngine
```dart
// Generate insights
Future<Map<String, dynamic>> analyzeDataset(Map<String, dynamic> dataset)
```

### DatabaseHelper
```dart
// Database operations
Future<void> insertScan(Map<String, dynamic> scan)
Future<List<Map<String, dynamic>>> getAllScans()
Future<Map<String, dynamic>?> getLatestScan()
Future<void> insertState(Map<String, dynamic> state)
Future<List<Map<String, dynamic>>> getStateHistory()
Future<void> insertInsight(Map<String, dynamic> insight)
Future<List<Map<String, dynamic>>> getAllInsights()
```

## Performance

- **Decoding**: ~700ms for 3000×3000 image
- **Accuracy**: 82%+ for all shapes
- **Storage**: ~2KB per scan
- **Database**: <100ms query time

## Troubleshooting

### Camera Permission Denied
- Check AndroidManifest.xml and Info.plist
- Grant permissions in app settings

### Image Decoding Fails
- Ensure image is valid PNG from web app
- Check image size (should be 3000×3000)

### Database Errors
- Delete app and reinstall (clears database)
- Check SQLite version compatibility

## Future Enhancements

- [ ] Add error correction (Reed-Solomon)
- [ ] Implement multi-language support
- [ ] Add cloud sync
- [ ] Build web dashboard
- [ ] Add color encoding (3x capacity)
- [ ] Implement multi-layer codes

## License

MIT License

## Support

For issues or questions, refer to the main project documentation.

## Related Files

- `HOW_IT_WORKS_TECHNICAL.md` - Technical deep dive
- `FLUTTER_APP_STARTER.md` - Implementation guide
- `DYNAMIC_RING_ARCHITECTURE.md` - System architecture
