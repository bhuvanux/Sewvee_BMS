#!/bin/bash
set -e

echo "🚀 Starting Local Production Build (AAB)..."

# 1. Environment Setup
export EAS_BUILD_PROFILE=production
echo "✓ Environment set to PRODUCTION"

# 2. Prebuild (Generate Native Code)
echo "📦 Generating Android native code..."
npx expo prebuild --platform android --clean

# 2.5 Ensure SDK Location
if [ -z "$ANDROID_HOME" ]; then
  export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
fi
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# 3. Build AAB
echo "🛠 Building Release Bundle (AAB)..."
cd android
./gradlew bundleRelease

echo "✅ Production Build Complete!"
echo "📍 AAB Location: android/app/build/outputs/bundle/release/app-release.aab"
