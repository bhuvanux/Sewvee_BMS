#!/bin/bash

# -----------------------------
# CONFIG
# -----------------------------
PHONE_IP="192.168.31.155"
ADB_PORT=5555
JAVA_HOME_PATH="/opt/homebrew/opt/openjdk@17"
ANDROID_HOME_PATH="/opt/homebrew/share/android-commandlinetools"

# -----------------------------
# ENVIRONMENT SETUP
# -----------------------------
export JAVA_HOME="$JAVA_HOME_PATH"
export ANDROID_HOME="$ANDROID_HOME_PATH"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "☕ Java version:"
java -version || { echo "❌ Java not found"; exit 1; }

echo "🤖 Android Home: $ANDROID_HOME"

# -----------------------------
# PORT CHECK
# -----------------------------
echo "🔍 Checking for port conflicts on 8081..."
PORT_PID=$(lsof -t -i:8081)
if [ ! -z "$PORT_PID" ]; then
    echo "⚠️  Port 8081 is already in use by PID: $PORT_PID"
    # Try to find if it's THIS project
    if ps -p $PORT_PID -o command | grep -q "sewvee_mini"; then
        echo "✅ Existing process belongs to this project. Continuing..."
    else
        echo "🛑 Port 8081 is used by another process."
        echo "   Do you want to kill it? (y/n)"
        read -t 5 -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill -9 $PORT_PID
            echo "💥 Process killed."
        fi
    fi
fi

# -----------------------------
# ADB WIFI CONNECT (HARDENED)
# -----------------------------
echo "🔄 Resetting ADB Server..."
adb kill-server
adb start-server
adb disconnect

echo "📡 Connecting to Android device at $PHONE_IP:$ADB_PORT..."

# Reachability Check
echo "🔍 Checking if device is reachable on the network..."
if ! ping -c 1 -W 2 $PHONE_IP > /dev/null; then
    echo "❌ ERROR: Cannot reach $PHONE_IP"
    echo "   Please check:"
    echo "   1. Is your phone on the SAME Wi-Fi as this Mac?"
    echo "   2. Has the phone's IP changed? (Check phone Settings > About > Status)"
    echo "   3. Is the phone's screen on and Wi-Fi active?"
    exit 1
fi
echo "✅ Device is reachable!"

adb tcpip $ADB_PORT
sleep 2
adb connect $PHONE_IP:$ADB_PORT

# Wait for device to be online
echo "⏳ Verifying connection..."
MAX_RETRIES=5
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
    STATE=$(adb -s $PHONE_IP:$ADB_PORT get-state 2>/dev/null)
    if [ "$STATE" == "device" ]; then
        echo "✅ Device is online and ready!"
        break
    fi
    echo "🟡 Device not ready (State: ${STATE:-offline}). Retrying in 3s..."
    adb connect $PHONE_IP:$ADB_PORT
    sleep 3
    COUNT=$((COUNT + 1))
done

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Failed to connect after $MAX_RETRIES attempts."
    exit 1
fi

echo "🔄 Establishing port reverse for Metro (8081)..."
adb -s $PHONE_IP:$ADB_PORT reverse tcp:8081 tcp:8081

adb devices

# Start Dev Server separately is usually redundant as run:android handles it
# but if you prefer a persistent background one, it needs to be ready.
# We'll skip the background start to avoid port collisions during build.

# -----------------------------
# RUN APP ON PHYSICAL DEVICE
# -----------------------------
# Expo expects model names with underscores (as seen in adb devices -l)
MODEL_NAME=$(adb -s $PHONE_IP:$ADB_PORT shell getprop ro.product.model | tr -d '\r' | tr ' ' '_')
echo "📱 Launching app on $MODEL_NAME ($PHONE_IP)..."
npx expo run:android --device "$MODEL_NAME"
# Note: if the above fails, you can try: npx expo run:android --device $PHONE_IP:$ADB_PORT
