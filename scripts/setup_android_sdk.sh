#!/bin/bash
set -e

# Configuration
SDK_DIR="$HOME/android-sdk"
CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip"
ANDROID_API_LEVEL="36" # Matching project requirement
BUILD_TOOLS_VERSION="36.0.0"

echo "🚀 Starting Android SDK Setup (Release Manager Mode)..."

# 1. Create SDK Directory
if [ -d "$SDK_DIR" ]; then
    echo "⚠️  SDK Directory $SDK_DIR already exists."
else
    echo "📂 Creating SDK directory at $SDK_DIR..."
    mkdir -p "$SDK_DIR"
fi

# 2. Download Command Line Tools if command not found
if [ ! -f "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" ]; then
    echo "⬇️  Downloading Command Line Tools..."
    curl -o "$SDK_DIR/cmdline-tools.zip" "$CMDLINE_TOOLS_URL"
    
    echo "📦 Unzipping..."
    unzip -q "$SDK_DIR/cmdline-tools.zip" -d "$SDK_DIR/cmd_temp"
    
    # Restructure for correct hierarchy: cmdline-tools/latest/bin/...
    mkdir -p "$SDK_DIR/cmdline-tools/latest"
    mv "$SDK_DIR/cmd_temp/cmdline-tools/"* "$SDK_DIR/cmdline-tools/latest/"
    rm -rf "$SDK_DIR/cmd_temp" "$SDK_DIR/cmdline-tools.zip"
    echo "✅ Command Line Tools installed."
else
    echo "✅ Command Line Tools already installed."
fi

# 3. Setup Environment Variables for this session
export ANDROID_HOME="$SDK_DIR"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "🛠️  Checking sdkmanager..."
which sdkmanager

# 4. Accept Licenses
echo "📝 Accepting Licenses..."
yes | sdkmanager --licenses > /dev/null

# 5. Install Packages
echo "📦 Installing Required Packages (This may take a while)..."
echo "   - platform-tools"
echo "   - platforms;android-$ANDROID_API_LEVEL"
echo "   - build-tools;$BUILD_TOOLS_VERSION"

sdkmanager "platform-tools" \
           "platforms;android-$ANDROID_API_LEVEL" \
           "build-tools;$BUILD_TOOLS_VERSION"

# 6. Create/Update local.properties for the project
PROJECT_ROOT=$(pwd)
LOCAL_PROPERTIES="$PROJECT_ROOT/android/local.properties"
echo "CONFIGURING local.properties at $LOCAL_PROPERTIES..."
echo "sdk.dir=$SDK_DIR" > "$LOCAL_PROPERTIES"

echo "🎉 Android SDK Setup Complete!"
echo "📍 SDK Location: $SDK_DIR"
echo "👉 You can now run './gradlew assembleRelease' in the android folder."
