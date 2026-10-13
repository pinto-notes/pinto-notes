#!/bin/zsh
# Says whether an app (or the app in an .xcarchive) carries the PostHog key, without printing it.
#
#   scripts/check-telemetry-key.sh build/testflight/ios-2610102255.xcarchive
#
# Exits 1 when the Info.plist has no phc_ PanePostHogKey: that build would send no telemetry
# (docs/Technical/app-telemetry.md). The iPhone and Mac 1.2 builds sent to App Review on 10-10
# were archived before telemetry reached main, and nothing said so; testflight.sh now runs this
# before it uploads.
set -euo pipefail
target=${1:?usage: $0 <app or xcarchive>}
app=$target
if [[ $target == *.xcarchive ]]; then
  app=$(ls -d "$target"/Products/Applications/*.app 2>/dev/null | head -1)
  [[ -n $app ]] || { echo "No app in $target" >&2; exit 2; }
fi
plist="$app/Contents/Info.plist"
[[ -f $plist ]] || plist="$app/Info.plist"
[[ -f $plist ]] || { echo "No Info.plist in $app" >&2; exit 2; }
key=$(plutil -extract PanePostHogKey raw -o - "$plist" 2>/dev/null || true)
if [[ $key == phc_?* ]]; then
  echo "PostHog key: present ($(basename "$app"))"
else
  echo "PostHog key: absent ($(basename "$app")): this build would send no telemetry." >&2
  exit 1
fi
