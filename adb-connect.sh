#!/bin/bash

# -----------------------------
# CONFIG
# -----------------------------
# ⚠️  UPDATE THIS IP if your phone's IP changes (Settings > About Phone > Status > IP Address)
PHONE_IP="192.168.1.44"
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
echo "🔍 Checking for port conflicts on 8089..."
PORT_PID=$(lsof -t -i:8089)
if [ ! -z "$PORT_PID" ]; then
    echo "⚠️  Port 8089 is already in use by PID: $PORT_PID"
    # Try to find if it's THIS project
    if ps -p $PORT_PID -o command | grep -q "sewvee"; then
        echo "✅ Existing process belongs to this project. Continuing..."
    else
        echo "🛑 Port 8089 is used by another process."
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
# Check if already connected
if adb devices | grep -q "$PHONE_IP:$ADB_PORT.*device"; then
    echo "✅ Already connected to $PHONE_IP:$ADB_PORT"
else
    echo "🔄 Establishing connection (trying direct connect)..."
    # Try connecting first (if device is already in TCPIP mode)
    adb connect $PHONE_IP:$ADB_PORT
    
    # Check if successful
    if adb devices | grep -q "$PHONE_IP:$ADB_PORT.*device"; then
        echo "✅ Connected successfully!"
    else
        echo "⚠️  Direct connect failed. Attempting to switch to TCP/IP mode (requires USB)..."
        adb tcpip $ADB_PORT
        sleep 2
        adb connect $PHONE_IP:$ADB_PORT
    fi
fi

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

echo "🔄 Establishing port reverse for Metro (8010)..."
adb -s $PHONE_IP:$ADB_PORT reverse tcp:8010 tcp:8010

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
EAS_BUILD_PROFILE=staging npx expo run:android --device "$MODEL_NAME" --port 8010
# Note: if the above fails, you can try: npx expo run:android --device $PHONE_IP:$ADB_PORT
