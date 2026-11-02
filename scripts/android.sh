#!/bin/sh
# Builds the debug app, installs it on the connected device and points it at Metro.
# JAVA_HOME, ANDROID_HOME and ADB override the tools found here.
set -e
cd "$(dirname "$0")/.."

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
if [ -z "$JAVA_HOME" ] && [ -d "$HOME/.local/jdks/temurin-17" ]; then
  export JAVA_HOME="$HOME/.local/jdks/temurin-17"
fi

# WSL cannot reach USB or wireless devices directly, so use the Windows adb.exe.
if [ -z "$ADB" ] && grep -qi microsoft /proc/version 2>/dev/null; then
  for candidate in \
    /mnt/c/Users/*/AppData/Local/Android/Sdk/platform-tools/adb.exe \
    /mnt/c/Users/*/AppData/Local/Microsoft/WinGet/Packages/Google.PlatformTools_*/platform-tools/adb.exe; do
    if [ -x "$candidate" ]; then
      ADB="$candidate"
      break
    fi
  done
fi
ADB="${ADB:-adb}"

if ! command -v "$ADB" >/dev/null; then
  echo "adb not found. Install Android platform-tools or set ADB to its full path." >&2
  exit 1
fi

APK=android/app/build/outputs/apk/debug/app-debug.apk
PACKAGE=com.wardrobeatlas.app

SERIAL="$("$ADB" devices | tr -d '\r' | awk 'NR > 1 && $2 == "device" { print $1; exit }')"
if [ -z "$SERIAL" ]; then
  echo "No device found. Connect a phone, turn on USB debugging and accept the prompt on the phone." >&2
  exit 1
fi

(cd android && ./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a)

case "$ADB" in
  *.exe) APK="$(wslpath -w "$APK")" ;;
esac

"$ADB" -s "$SERIAL" install -r "$APK"
"$ADB" -s "$SERIAL" reverse tcp:8081 tcp:8081
"$ADB" -s "$SERIAL" shell am start -n "$PACKAGE.debug/$PACKAGE.MainActivity"
