#!/bin/bash
export JAVA_HOME=$(brew --prefix openjdk)
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH

echo "Starting Emulator (Pixel_Light)..."
emulator -avd Pixel_Light -no-boot-anim -netdelay none -netspeed full
