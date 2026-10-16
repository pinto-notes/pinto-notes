#!/bin/zsh
# Builds Pinto Notes and installs it on a connected iPhone.
#
#   scripts/install-phone.sh            # the first connected iPhone
#
# Signs with the paid team set in project.yml: an install lasts a year and
# the share extension works (app group group.dev.emilwagman.pane).
set -euo pipefail
cd "$(dirname "$0")/.."
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer

DD=build/ddphone

# devicectl and xcodebuild name the phone differently: keep both.
json=$(mktemp)
xcrun devicectl list devices --json-output "$json" >/dev/null 2>&1
read device udid <<<"$(python3 -c '
import json, os, sys
want = os.environ.get("PHONE", "Emil")  # only this phone, never another device this Mac knows
for d in json.load(open(sys.argv[1]))["result"]["devices"]:
    hw, cp, props = d.get("hardwareProperties", {}), d.get("connectionProperties", {}), d.get("deviceProperties", {})
    if hw.get("deviceType") == "iPhone" and want.lower() in props.get("name", "").lower() and cp.get("tunnelState") == "connected":
        print(d["identifier"], hw.get("udid", "")); break
' "$json")"
rm -f "$json"
if [[ -z ${device:-} ]]; then
  echo "Your iPhone (${PHONE:-Emil}) isn't connected. Plug it in or put it on the same Wi-Fi, unlock it, and try again." >&2
  exit 1
fi
echo "Installing on $device"

app=$DD/Build/Products/Release-iphoneos/Pane.app
rm -rf "$app" # never install a stale build
xcodegen generate >/dev/null
xcodebuild -project Pane.xcodeproj -scheme Pane -configuration Release \
  -destination "platform=iOS,id=$udid" -derivedDataPath $DD -allowProvisioningUpdates -allowProvisioningDeviceRegistration \
  build | grep -E "error|BUILD" || true

[[ -d $app ]] || { echo "Build failed." >&2; exit 1; }
xcrun devicectl device install app --device "$device" "$app"
# This phone is the team's: one launch with -PintoInternal YES keeps the PintoInternal default, so
# its telemetry says internal: true and testing stays out of the numbers.
bundle=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$app/Info.plist")
xcrun devicectl device process launch --device "$device" --terminate-existing "$bundle" -PintoInternal YES >/dev/null 2>&1 ||
  echo "Couldn't open the app to mark this phone as the team's. Unlock it and run the script again." >&2
echo "Installed. First launch: Settings → General → VPN & Device Management → trust your Apple ID."
