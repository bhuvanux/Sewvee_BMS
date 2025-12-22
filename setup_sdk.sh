#!/bin/bash
export JAVA_HOME=$(brew --prefix openjdk)
echo "Installing SDK components... (This may take a while)"
yes | sdkmanager --licenses
sdkmanager "platform-tools" "emulator" "platforms;android-34" "build-tools;34.0.0" "system-images;android-34;google_apis;arm64-v8a"

echo "Creating AVD 'Pixel_Light'..."
avdmanager create avd -n Pixel_Light -k "system-images;android-34;google_apis;arm64-v8a" --device "pixel_5" --force

echo "Setup Complete! You can now use ./start_emulator.sh"
