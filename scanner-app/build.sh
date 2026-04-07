#!/bin/bash

echo "================================"
echo "ShotCode Scanner - Build Script"
echo "================================"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✓ npm is installed"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"

# Check if eas-cli is installed
if ! command -v eas &> /dev/null; then
    echo ""
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install EAS CLI"
        exit 1
    fi
fi

echo "✓ EAS CLI is installed"

# Check if logged in
echo ""
echo "🔐 Checking EAS login status..."
eas whoami &> /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Not logged in to EAS"
    echo ""
    echo "Please login to your Expo account:"
    eas login
    
    if [ $? -ne 0 ]; then
        echo "❌ Login failed"
        exit 1
    fi
fi

echo "✓ Logged in to EAS"

# Ask which platform to build
echo ""
echo "Which platform do you want to build?"
echo "1) Android (APK)"
echo "2) iOS"
echo "3) Both"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🏗️  Building Android APK..."
        echo "This will take 10-20 minutes. Please wait..."
        eas build --platform android --profile preview
        ;;
    2)
        echo ""
        echo "🏗️  Building iOS..."
        echo "This will take 10-20 minutes. Please wait..."
        eas build --platform ios --profile preview
        ;;
    3)
        echo ""
        echo "🏗️  Building both platforms..."
        echo "This will take 20-40 minutes. Please wait..."
        eas build --platform all --profile preview
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "📥 Download your app from the link above"
    echo "📱 Transfer to your phone and install"
else
    echo ""
    echo "❌ Build failed. Check the error messages above."
    exit 1
fi
