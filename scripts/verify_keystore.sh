#!/bin/bash
set -e

PROPS_FILE="android/key.properties"
KEYSTORE_FILE="android/app/sewvee-prod.jks"

if [ ! -f "$PROPS_FILE" ]; then
  echo "❌ Missing $PROPS_FILE"
  exit 1
fi

if [ ! -f "$KEYSTORE_FILE" ]; then
  echo "❌ Missing $KEYSTORE_FILE"
  exit 1
fi

# Extract values (trimming whitespace)
STORE_PASS=$(grep '^storePassword=' "$PROPS_FILE" | cut -d'=' -f2 | xargs)
KEY_ALIAS=$(grep '^keyAlias=' "$PROPS_FILE" | cut -d'=' -f2 | xargs)
KEY_PASS=$(grep '^keyPassword=' "$PROPS_FILE" | cut -d'=' -f2 | xargs)

echo "🔍 Verifying Keystore..."
echo "   File: $KEYSTORE_FILE"
echo "   Alias: $KEY_ALIAS"

# Check Keystore Password & Alias
if keytool -list -keystore "$KEYSTORE_FILE" -storepass "$STORE_PASS" -alias "$KEY_ALIAS" > /dev/null 2>&1; then
  echo "✅ SUCCESS: Keystore password and Alias are CORRECT!"
else
  echo "❌ FAILED: Incorrect password or missing alias."
  echo "   (Or the keystore file is still corrupted)"
  exit 1
fi
