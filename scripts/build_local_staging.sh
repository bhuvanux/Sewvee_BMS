#!/bin/bash
set -e

echo "🚀 Starting Local Staging Build (APK)..."

# 1. Environment Setup
export EAS_BUILD_PROFILE=staging
echo "✓ Environment set to STAGING"

# 2. Prebuild (Generate Native Code)
echo "📦 Generating Android native code..."
npx expo prebuild --platform android --clean

# 2.5 Ensure SDK Location
if [ -z "$ANDROID_HOME" ]; then
  export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
fi
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# 3. Build APK
echo "🛠 Building Release APK..."
cd android
./gradlew assembleRelease

echo "✅ Staging Build Complete!"
echo "📍 APK Location: android/app/build/outputs/apk/release/app-release.apk"
