#!/bin/bash
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH=$ANDROID_HOME/platform-tools:$PATH

echo "Running Android App with Java 17..."
echo "JAVA_HOME set to: $JAVA_HOME"
npx react-native run-android
