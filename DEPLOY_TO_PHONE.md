# Deploy Flutter App to Your Phone

## ✅ Phone Connected - Let's Deploy!

You've connected your phone to the PC. Now let's get the Flutter app running on it!

---

## Step 1: Verify Phone Connection

```bash
# Check if your phone is detected
flutter devices

# You should see something like:
# Android SDK built for x86 (mobile)    • emulator-5554 • android-x86    • Android 11 (API 30)
# Or your actual phone name
```

If your phone doesn't appear:
- Enable USB Debugging on your phone
- Accept the USB debugging prompt
- Try again

---

## Step 2: Create Flutter Project

```bash
# Create new Flutter project
flutter create morphing_code_scanner
cd morphing_code_scanner

# Verify it works
flutter run
```

This will:
1. Create a new Flutter project
2. Build the app
3. Deploy to your connected phone
4. Show a demo app

---

## Step 3: Copy Our App Files

### Option A: Manual Copy (Recommended)

1. **Copy lib folder**
   - Copy all files from `flutter_app/lib/` 
   - Paste into your project's `lib/` folder
   - Replace existing files

2. **Copy pubspec.yaml**
   - Copy `flutter_app/pubspec.yaml`
   - Replace your project's `pubspec.yaml`

3. **Install dependencies**
   ```bash
   flutter pub get
   ```

### Option B: Command Line

```bash
# From your project directory
cp -r flutter_app/lib/* lib/
cp flutter_app/pubspec.yaml .
flutter pub get
```

---

## Step 4: Configure Permissions

### Android Permissions

**File: `android/app/src/main/AndroidManifest.xml`**

Find the `<manifest>` tag and add these permissions:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

**Example:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.morphing_code_scanner">

    <!-- Add these permissions -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application>
        <!-- ... rest of file ... -->
    </application>
</manifest>
```

---

## Step 5: Deploy to Phone

### Run on Connected Phone

```bash
# Make sure you're in the project directory
cd morphing_code_scanner

# Run on your phone
flutter run

# Or specify the device
flutter run -d <device-id>
```

### What Happens

1. Flutter builds the app
2. Installs it on your phone
3. Launches the app
4. Shows console output

### Expected Output

```
Launching lib/main.dart on Android Device in debug mode...
Running Gradle task 'assembleDebug'...
✓ Built build/app/outputs/apk/debug/app-debug.apk (45.2MB).
Installing and launching...
✓ Installed build/app/outputs/apk/debug/app-debug.apk.
Launching lib/main.dart on Android Device...
```

---

## Step 6: Test the App

### On Your Phone

1. **Scanner Screen**
   - Tap "Pick from Gallery"
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

### Issue: Phone Not Detected

```bash
# Check connection
flutter devices

# If not showing:
# 1. Enable USB Debugging on phone
# 2. Accept USB debugging prompt
# 3. Try again
```

### Issue: Build Fails

```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

### Issue: Permission Denied

- Check AndroidManifest.xml
- Verify permissions are added
- Rebuild and redeploy

### Issue: App Crashes on Launch

```bash
# Check logs
flutter logs

# Look for error messages
# Common issues:
# - Missing permissions
# - Database initialization error
# - Image loading error
```

### Issue: Camera Not Working

- Grant camera permission on phone
- Check AndroidManifest.xml
- Verify camera permission is added

### Issue: Gallery Not Working

- Grant storage permission on phone
- Check AndroidManifest.xml
- Verify storage permissions are added

---

## Advanced Options

### Run in Release Mode (Faster)

```bash
flutter run --release
```

### Run with Verbose Output

```bash
flutter run -v
```

### Build APK for Distribution

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Install APK Manually

```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

---

## Testing with Web App

### Generate Morphing Code

1. Open web app in browser
2. Go to "Advanced (20K)" tab
3. Enter 30,000 characters
4. Download the image

### Scan with Flutter App

1. Open Flutter app on phone
2. Tap "Pick from Gallery"
3. Select the downloaded image
4. App decodes and shows results

### Verify Results

- Check if scan number matches
- Verify execution results
- Check AI insights
- View in history

---

## Performance Tips

### Faster Builds

```bash
# Use release mode for testing
flutter run --release

# Or use profile mode
flutter run --profile
```

### Faster Deployment

```bash
# Skip build if already built
flutter run --fast-start

# Or use hot reload
# Press 'r' in console to reload
# Press 'R' to restart
```

### Monitor Performance

```bash
# Check frame rate
flutter run --profile

# Use DevTools
flutter pub global activate devtools
devtools
```

---

## Next Steps

### Immediate

1. ✅ Connect phone to PC
2. ✅ Create Flutter project
3. ✅ Copy app files
4. ✅ Configure permissions
5. ✅ Deploy to phone
6. ✅ Test the app

### Short-term

1. Generate morphing codes from web app
2. Scan with Flutter app
3. Verify results
4. Test all screens

### Medium-term

1. Customize formulas
2. Add more features
3. Optimize performance
4. Prepare for app store

---

## Quick Reference

### Essential Commands

```bash
# Check devices
flutter devices

# Create project
flutter create morphing_code_scanner

# Install dependencies
flutter pub get

# Run on phone
flutter run

# Run in release mode
flutter run --release

# Build APK
flutter build apk --release

# Check logs
flutter logs

# Clean build
flutter clean
```

---

## File Locations

### Android Manifest
```
android/app/src/main/AndroidManifest.xml
```

### App Files
```
lib/
├── main.dart
├── models/
├── services/
├── database/
└── screens/
```

### Dependencies
```
pubspec.yaml
```

---

## Success Checklist

- [ ] Phone connected to PC
- [ ] Flutter devices shows your phone
- [ ] Flutter project created
- [ ] App files copied
- [ ] pubspec.yaml updated
- [ ] Dependencies installed
- [ ] Permissions configured
- [ ] App deployed to phone
- [ ] App launches successfully
- [ ] Scanner screen works
- [ ] Can pick images
- [ ] Decoding works
- [ ] Results display
- [ ] History stores data
- [ ] Insights show

---

## You're Ready!

Everything is set up. Your phone is connected and ready to run the Flutter app.

### Next Action

1. Create Flutter project
2. Copy app files
3. Configure permissions
4. Run: `flutter run`
5. Test on your phone

**Let's go!** 🚀

---

## Need Help?

### Common Issues

**Q: Phone not detected**
A: Enable USB Debugging in phone settings

**Q: Build fails**
A: Run `flutter clean` then `flutter pub get`

**Q: App crashes**
A: Check `flutter logs` for errors

**Q: Permissions not working**
A: Verify AndroidManifest.xml has all permissions

**Q: Camera not working**
A: Grant camera permission on phone

---

## Summary

You now have:
✅ Phone connected to PC
✅ Flutter environment ready
✅ App files prepared
✅ Deployment guide

**Ready to deploy!** 🎉

