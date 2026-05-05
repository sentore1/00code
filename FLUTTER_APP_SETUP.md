# Flutter App Setup Guide

## Complete Step-by-Step Instructions

### Step 1: Install Flutter (If Not Already Installed)

**Windows/Mac/Linux:**
```bash
# Download Flutter from https://flutter.dev/docs/get-started/install
# Extract to a location (e.g., ~/flutter)
# Add to PATH:
export PATH="$PATH:~/flutter/bin"

# Verify installation
flutter doctor
```

### Step 2: Create Flutter Project

```bash
# Create new project
flutter create morphing_code_scanner
cd morphing_code_scanner

# Verify it works
flutter run
```

### Step 3: Copy Project Files

**Copy these files from `flutter_app/` to your project:**

```
lib/
├── main.dart
├── models/
│   └── scan_record.dart
├── services/
│   ├── ring_decoder.dart
│   ├── chunk_extractor.dart
│   ├── formula_executor.dart
│   └── ai_reasoning.dart
├── database/
│   └── database_helper.dart
└── screens/
    ├── scanner_screen.dart
    ├── results_screen.dart
    ├── history_screen.dart
    └── insights_screen.dart
```

### Step 4: Update pubspec.yaml

Replace your `pubspec.yaml` with the one from `flutter_app/pubspec.yaml`

Or manually add dependencies:
```yaml
dependencies:
  flutter:
    sdk: flutter
  camera: ^0.10.5+5
  image: ^4.0.17
  sqflite: ^2.3.0
  path_provider: ^2.1.1
  uuid: ^4.0.0
  fl_chart: ^0.65.0
  intl: ^0.19.0
  permission_handler: ^11.4.4
  image_picker: ^1.0.0
```

### Step 5: Install Dependencies

```bash
flutter pub get
```

### Step 6: Configure Android Permissions

**File: `android/app/src/main/AndroidManifest.xml`**

Add these permissions:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### Step 7: Configure iOS Permissions

**File: `ios/Runner/Info.plist`**

Add these keys:
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan morphing codes</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photos to scan morphing codes</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>We need to save photos to your library</string>
```

### Step 8: Run the App

**On Android:**
```bash
flutter run
```

**On iOS:**
```bash
flutter run -d ios
```

**On Web (if enabled):**
```bash
flutter run -d web
```

### Step 9: Test the App

1. **Scanner Screen**
   - Tap "Pick from Gallery" or "Take Photo"
   - Select a morphing code image
   - App decodes and shows results

2. **Results Screen**
   - Shows latest scan results
   - Displays execution results
   - Shows AI insights

3. **History Screen**
   - Lists all previous scans
   - Tap to view details

4. **Insights Screen**
   - Shows AI-generated insights
   - Displays suggestions

---

## Troubleshooting

### Issue: Flutter not found
```bash
# Add Flutter to PATH
export PATH="$PATH:~/flutter/bin"

# Verify
flutter doctor
```

### Issue: Dependencies won't install
```bash
# Clean and reinstall
flutter clean
flutter pub get
```

### Issue: Build fails on Android
```bash
# Update Android SDK
flutter doctor --android-licenses

# Clean build
flutter clean
flutter run
```

### Issue: Build fails on iOS
```bash
# Update pods
cd ios
pod repo update
pod install
cd ..

# Clean and rebuild
flutter clean
flutter run -d ios
```

### Issue: Camera permission denied
- Check AndroidManifest.xml and Info.plist
- Grant permissions in app settings
- Reinstall app

### Issue: Image decoding fails
- Ensure image is valid PNG
- Check image size (should be 3000×3000)
- Try a different image

---

## Project Structure

```
morphing_code_scanner/
├── android/                 # Android-specific code
├── ios/                     # iOS-specific code
├── lib/
│   ├── main.dart           # App entry point
│   ├── models/             # Data models
│   ├── services/           # Business logic
│   ├── database/           # Database management
│   └── screens/            # UI screens
├── test/                   # Unit tests
├── pubspec.yaml            # Dependencies
├── pubspec.lock            # Locked versions
└── README.md               # Documentation
```

---

## File Descriptions

### lib/main.dart
- App entry point
- Main screen with bottom navigation
- Navigation between 4 screens

### lib/models/scan_record.dart
- ScanRecord data model
- JSON serialization/deserialization

### lib/services/ring_decoder.dart
- Reads 150 concentric rings
- Extracts binary data
- Supports partial decoding

### lib/services/chunk_extractor.dart
- Parses binary into chunks
- Extracts metadata, formulas, state, etc.
- Converts bits to integers

### lib/services/formula_executor.dart
- Executes agriculture formulas
- Executes logistics formulas
- Executes business formulas
- Generates recommendations

### lib/services/ai_reasoning.dart
- Identifies patterns
- Suggests actions
- Generates insights
- Predicts outcomes

### lib/database/database_helper.dart
- SQLite database management
- CRUD operations
- Query helpers

### lib/screens/scanner_screen.dart
- Camera/gallery image picking
- Image decoding
- Result display

### lib/screens/results_screen.dart
- Latest scan results
- Execution results
- AI insights

### lib/screens/history_screen.dart
- Scan history list
- Scan details
- Timeline view

### lib/screens/insights_screen.dart
- AI-generated insights
- Patterns and suggestions
- Predictions

---

## Next Steps

1. **Test with Web App**
   - Generate morphing codes from web app
   - Scan with Flutter app
   - Verify results

2. **Customize**
   - Add your own formulas
   - Customize UI
   - Add more features

3. **Deploy**
   - Build APK for Android
   - Build IPA for iOS
   - Publish to app stores

---

## Build Commands

### Android APK
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### iOS App
```bash
flutter build ios --release
# Output: build/ios/iphoneos/Runner.app
```

### Web
```bash
flutter build web --release
# Output: build/web/
```

---

## Performance Tips

1. **Optimize Image Loading**
   - Use smaller images when possible
   - Cache decoded images

2. **Database Optimization**
   - Create indexes on frequently queried columns
   - Archive old scans

3. **Memory Management**
   - Dispose resources properly
   - Use FutureBuilder for async operations

4. **UI Performance**
   - Use ListView.builder for long lists
   - Avoid rebuilding entire widgets

---

## Testing

### Unit Tests
```bash
flutter test
```

### Integration Tests
```bash
flutter test integration_test/
```

### Performance Testing
```bash
flutter run --profile
```

---

## Debugging

### Enable Debug Logging
```dart
// In main.dart
void main() {
  debugPrintBeginFrameBanner = true;
  debugPrintEndFrameBanner = true;
  runApp(const MorphingCodeApp());
}
```

### Use DevTools
```bash
flutter pub global activate devtools
devtools
```

### Check Logs
```bash
flutter logs
```

---

## Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Dart Documentation](https://dart.dev/guides)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Camera Plugin](https://pub.dev/packages/camera)
- [Image Plugin](https://pub.dev/packages/image)

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the main documentation
3. Check Flutter documentation
4. Ask in Flutter community forums

---

## Summary

You now have a complete Flutter app that:
- ✅ Scans morphing codes
- ✅ Decodes ring sections
- ✅ Executes formulas
- ✅ Generates AI insights
- ✅ Stores history
- ✅ Displays results

**Ready to build!** 🚀

