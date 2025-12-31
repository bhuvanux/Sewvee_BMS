#!/bin/bash
set -e

echo "🚀 Starting Local Production Build (APK)..."

# 1. Environment Setup
export EAS_BUILD_PROFILE=production
echo "✓ Environment set to PRODUCTION"

# 2. Prebuild (Generate Native Code)
echo "📦 Generating Android native code..."
npx expo prebuild --platform android --clean

# 2.1 Restore Secrets (After clean)
echo "🔑 Restoring signing keys..."
if [ -f "secrets/key.properties" ]; then
  cp secrets/key.properties android/
else
  echo "⚠️ Warning: secrets/key.properties not found!"
fi

if [ -f "secrets/sewvee-prod.jks" ]; then
  # Ensure the destination folder exists
  mkdir -p android/app
  cp secrets/sewvee-prod.jks android/app/
else
  echo "⚠️ Warning: secrets/sewvee-prod.jks not found!"
fi

# 2.2 Patch Gradle for Signing & Linting (Critical)
echo "🔧 Patching build.gradle for Release Signing & Linting..."
node scripts/fix_gradle_signing.js

# 2.5 Ensure SDK Location
if [ -z "$ANDROID_HOME" ]; then
  export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
fi
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# 3. Build APK
echo "🛠 Building Release APK..."
cd android
./gradlew assembleRelease

echo "✅ Production APK Build Complete!"
echo "📍 APK Location: android/app/build/outputs/apk/release/app-release.apk"
