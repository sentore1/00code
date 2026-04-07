# ShotCode Scanner Mobile App

A standalone mobile app for scanning ShotCodes using your phone's camera.

## Installation

### Prerequisites
- Node.js installed
- Expo CLI installed: `npm install -g expo-cli`
- For Android: Android Studio or Expo Go app
- For iOS: Xcode (Mac only) or Expo Go app

### Quick Start (Testing)

1. Install dependencies:
```bash
cd scanner-app
npm install
```

2. Start the development server:
```bash
npm start
```

3. Scan the QR code with:
   - **Android**: Expo Go app from Play Store
   - **iOS**: Expo Go app from App Store or Camera app

### Build APK (Android)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure build:
```bash
eas build:configure
```

4. Build APK:
```bash
eas build --platform android --profile preview
```

5. Download the APK from the link provided

### Build IPA (iOS)

1. Build for iOS:
```bash
eas build --platform ios --profile preview
```

2. Download and install via TestFlight or direct installation

## Alternative: Build Standalone APK Locally

### Using Expo (Easier)

```bash
# Install expo-cli
npm install -g expo-cli

# Build APK
expo build:android -t apk
```

### Using React Native CLI (More Control)

If you want a pure React Native app without Expo:

1. Eject from Expo:
```bash
expo eject
```

2. Build with React Native:
```bash
# Android
cd android
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

## Features

- Real-time camera scanning
- Automatic ShotCode detection
- High-accuracy decoding with error correction
- Works offline
- Dark mode UI
- Supports codes up to 12,000+ characters

## Permissions Required

- Camera access (for scanning codes)

## Usage

1. Open the app
2. Tap "Start Scanning"
3. Point camera at a ShotCode
4. Hold steady until decoded
5. View the decoded text

## Technical Details

- Built with React Native + Expo
- Uses expo-camera for camera access
- Implements same decode algorithm as web version
- Optimized for mobile performance (10×10 sampling grid)

## Troubleshooting

### Camera not working
- Check app permissions in phone settings
- Restart the app
- Ensure good lighting

### Decode fails
- Hold phone steady
- Ensure code is centered and fills the circle
- Try different distances
- Ensure code is not blurry

### Build fails
- Update Node.js to latest LTS version
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Distribution

### Google Play Store
1. Create developer account ($25 one-time fee)
2. Build signed APK with `eas build`
3. Upload to Play Console
4. Fill in app details and publish

### Apple App Store
1. Create developer account ($99/year)
2. Build IPA with `eas build`
3. Upload to App Store Connect
4. Submit for review

### Direct APK Distribution
- Share the APK file directly
- Users need to enable "Install from Unknown Sources"
- Not recommended for public distribution

## License

MIT
