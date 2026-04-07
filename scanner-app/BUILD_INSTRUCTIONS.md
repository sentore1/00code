# Step-by-Step Build Instructions

## Step 1: Install Dependencies

Open your terminal in the `scanner-app` folder and run:

```bash
npm install
```

## Step 2: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 3: Create Expo Account (if you don't have one)

Go to https://expo.dev and sign up for a free account.

## Step 4: Login to EAS

```bash
eas login
```

Enter your Expo username and password.

## Step 5: Configure the Project

```bash
eas build:configure
```

This will ask you a few questions:
- Select platform: Choose "All" (or just "Android" if you only want APK)
- It will automatically create eas.json (already created for you)

## Step 6: Build APK for Android

```bash
eas build --platform android --profile preview
```

This will:
1. Upload your code to Expo servers
2. Build the APK in the cloud
3. Give you a download link

**Wait time:** 10-20 minutes for the build to complete.

## Step 7: Download and Install

Once the build completes:
1. Click the download link in the terminal
2. Transfer the APK to your Android phone
3. Open the APK file on your phone
4. Allow "Install from Unknown Sources" if prompted
5. Install the app

## Alternative: Build Locally (Faster but more complex)

If you want to build locally without waiting:

### For Android:

1. Install Android Studio
2. Set up Android SDK
3. Run:
```bash
cd scanner-app
npx expo prebuild
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### "eas: command not found"
```bash
npm install -g eas-cli
# Or if using yarn:
yarn global add eas-cli
```

### "Not logged in"
```bash
eas login
```

### Build fails with "Invalid credentials"
```bash
eas logout
eas login
```

### Want to check build status
```bash
eas build:list
```

### Cancel a build
Press Ctrl+C in terminal, or go to https://expo.dev/accounts/[your-username]/projects/shotcode-scanner/builds

## Build for iOS (Mac required for local build)

```bash
eas build --platform ios --profile preview
```

Note: iOS builds require an Apple Developer account ($99/year) for distribution.

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build Android APK
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile preview

# Check build status
eas build:list

# View build logs
eas build:view

# Test locally first
npm start
```

## Testing Before Building

Before building, test the app locally:

```bash
npm start
```

Then:
1. Install "Expo Go" app on your phone
2. Scan the QR code shown in terminal
3. Test the scanner functionality
4. If it works, proceed with building

## Cost

- EAS Build: FREE (limited builds per month)
- Expo Account: FREE
- Android Distribution: FREE (direct APK) or $25 one-time (Play Store)
- iOS Distribution: $99/year (Apple Developer account required)

## Next Steps After Building

1. Test the APK on multiple devices
2. Fix any bugs
3. Rebuild with `eas build --platform android --profile production`
4. Distribute via:
   - Direct APK sharing
   - Google Play Store
   - Your own website
