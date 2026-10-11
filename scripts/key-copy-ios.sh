#!/bin/zsh
# Signing in opens the notes on a new device, in iPhone simulators against the STAGING project
# (PaneUITests/KeyCopyUITests; docs/Technical/recoverable-key.md). Never production.
#
#   scripts/key-copy-ios.sh [run]
#   BEFORE=<a checkout of the build from before> scripts/key-copy-ios.sh [run]
#
# It makes two throwaway accounts and four simulators of its own, and removes them afterwards.
# The simulators run without the Simulator app, so nothing shows on screen; it stops if the
# Simulator app is open, since their windows would appear there. Screenshots: .shots/<run>.
#
# Steps 1 to 4 use this checkout's build: a new account's first device stores the copy, a second
# device opens by signing in, the first turns on Advanced protection, and a third is
# then asked to link. Steps 5 and 6 need BEFORE, a checkout of dev from before this: that build
# signs in and makes an account's key, this
# build is installed over it and asks first, and a second device that was waiting opens by itself.
#
# Needs Config/Backend.staging.local.xcconfig (scripts/staging.sh app-config) and .secrets/staging.env.
set -euo pipefail
cd "$(dirname "$0")/.."
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
PROD_REF=rodegaeruhyybqilrnpn
MAIN="$(cd "$(git rev-parse --git-common-dir)/.." && pwd)"
source "$MAIN/.secrets/staging.env"
REF=${STAGING_REF:?no staging project}
[[ $REF != "$PROD_REF" ]] || { echo "That's the production project. Refusing." >&2; exit 1; }
[[ -f Config/Backend.staging.local.xcconfig ]] || { echo "No Config/Backend.staging.local.xcconfig: run scripts/staging.sh app-config first." >&2; exit 1; }
grep -q "$REF" Config/Backend.staging.local.xcconfig || { echo "Config/Backend.staging.local.xcconfig isn't the staging project's." >&2; exit 1; }
if pgrep -xq Simulator; then echo "The Simulator app is open: its windows would show these simulators. Quit it and run this again." >&2; exit 1; fi

API_URL="https://$REF.supabase.co"
keys=$(supabase projects api-keys --project-ref "$REF" -o json 2>/dev/null)
SERVICE_ROLE_KEY=$(print -r -- "$keys" | python3 -c "import sys,json;k=json.JSONDecoder().raw_decode(sys.stdin.read())[0];print(next(x['api_key'] for x in k if x.get('name')=='service_role'))")
admin=(-H "authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY" -H 'content-type: application/json')
run=$(uuidgen | tr 'A-Z' 'a-z' | cut -c1-13)
RUN=${1:-key-copy-$(date +%H%M%S)}
OUT="$PWD/.shots/$RUN"
mkdir -p "$OUT"
PASSWORD="key-copy-ios-$run-Aa1"
# Resend's own sink address: the notice email a fetch sends goes nowhere and bounces nothing.
NEW="delivered+key-copy-ios-new-$run@resend.dev" OLD="delivered+key-copy-ios-old-$run@resend.dev"
ids=() sims=()
cleanup() {
  for s in $sims; do xcrun simctl shutdown "$s" 2>/dev/null || true; xcrun simctl delete "$s" 2>/dev/null || true; done
  for id in $ids; do curl -sf -X DELETE "$API_URL/auth/v1/admin/users/$id" "${admin[@]}" >/dev/null || true; done
}
# Also when it is stopped or killed: a stalled run once left its simulators booted for five hours.
trap cleanup EXIT INT TERM HUP
for email in $NEW $OLD; do
  ids+=("$(curl -sf -X POST "$API_URL/auth/v1/admin/users" "${admin[@]}" -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\",\"email_confirm\":true}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')")
done

runtime=$(xcrun simctl list runtimes | grep -oE 'com\.apple\.CoreSimulator\.SimRuntime\.iOS-[0-9-]+' | tail -1)
# A simulator of this run's own. It sets `made` and lists it for the cleanup; called as it is, not
# in $(...), where the list would be a subshell's and the simulators would be left behind.
sim() { # <name>
  made=$(xcrun simctl create "key-copy $1 $run" com.apple.CoreSimulator.SimDeviceType.iPhone-17 "$runtime")
  sims+=("$made")
}
# Booted without the Simulator app, and silent: no keyboard clicks or lock sounds.
boot() {
  xcrun simctl boot "$1" 2>/dev/null || true; xcrun simctl bootstatus "$1" -b >/dev/null
  xcrun simctl status_bar "$1" override --time "9:41" --batteryLevel 100 --cellularBars 4 --wifiBars 3 2>/dev/null || true
  xcrun simctl spawn "$1" defaults write com.apple.preferences.sounds keyboard -bool false 2>/dev/null || true
  xcrun simctl spawn "$1" defaults write com.apple.preferences.sounds lock-sound -bool false 2>/dev/null || true
}

# The staging project's address and key as build settings (Config/Beta.xcconfig would also rename
# the app, and the unit tests' host with it). In a simulator the app's own name and id are fine.
backend=()
while IFS= read -r line; do
  [[ $line == PANE_*=* ]] && backend+=("${${line%% =*}// /}=${line#*= }")
done < Config/Backend.staging.local.xcconfig
build() { # <checkout> <derived data> <a simulator> <name>: the app and its UI tests, on the staging backend
  (cd "$1" && { command -v xcodegen >/dev/null && xcodegen generate >/dev/null; true; } &&
    nice -n 10 xcodebuild -project Pane.xcodeproj -scheme Pane -destination "id=$3" -derivedDataPath "$2" \
      CODE_SIGNING_ALLOWED=NO "${backend[@]}" build-for-testing > "$OUT/build-$4.log" 2>&1) || { grep -E "error:" "$OUT/build-$4.log" | sort -u | cut -c1-300 | head -20 >&2; return 1; }
  ls "$2"/Build/Products/*.xctestrun | head -1
}
step() { # <xctestrun> <simulator> <email> <test> : one test on one simulator
  local name=${4##*/}
  TEST_RUNNER_PANE_EMAIL=$3 TEST_RUNNER_PANE_PASSWORD=$PASSWORD TEST_RUNNER_PANE_SHOTS="$OUT" \
    nice -n 10 xcodebuild test-without-building -xctestrun "$1" -destination "id=$2" -only-testing:"PaneUITests/$4" -resultBundlePath "$OUT/$name.xcresult" > "$OUT/$name.log" 2>&1 \
    && print -- "✓ $name" || { print -- "✗ $name"; grep -E "error:|XCTAssert|failed" "$OUT/$name.log" | head -12; return 1; }
}

sim A; A=$made; sim B; B=$made
boot "$A"; boot "$B"
THIS=$(build "$PWD" "$PWD/build/ddsim-keycopy" "$A" this)
failed=0
step "$THIS" "$A" "$NEW" KeyCopyUITests/test1_TheFirstDeviceStoresACopy || failed=1
step "$THIS" "$A" "$NEW" KeyCopyUITests/test1b_AdvancedProtectionShowsTheRecoveryKeyFirst || failed=1
step "$THIS" "$B" "$NEW" KeyCopyUITests/test2_TheSecondDeviceOpensBySigningIn || failed=1
step "$THIS" "$A" "$NEW" KeyCopyUITests/test3_AdvancedProtection || failed=1
xcrun simctl shutdown "$A"; xcrun simctl shutdown "$B"
sim C; C=$made; boot "$C"
step "$THIS" "$C" "$NEW" KeyCopyUITests/test4_ANewDeviceOfAStrictAccountIsAskedToLink || failed=1

if [[ -n ${BEFORE:-} ]]; then
  sim D; D=$made; boot "$D"
  THEN=$(build "$BEFORE" "$BEFORE/build/ddsim-keycopy" "$D" before)
  # The build from before signs in and makes the account's key, as every build since 1.1 does.
  step "$THEN" "$D" "$OLD" SignOutRemoveUITests/test1_SignInAndWrite || failed=1
  # A second device, on this build, waits at the linking screen...
  step "$THIS" "$C" "$OLD" KeyCopyUITests/test6_AWaitingDeviceOpensByItself &
  waiting=$!
  for i in {1..120}; do [[ -f $OUT/6-waiting.png ]] && break; sleep 2; done
  # ...while the first device gets this build, is asked, and continues.
  step "$THIS" "$D" "$OLD" KeyCopyUITests/test5_AnAccountFromBeforeIsAskedFirst || failed=1
  wait $waiting || failed=1
fi
rm -rf "$OUT"/*.xcresult
ls "$OUT"/*.png 2>/dev/null | sed "s|$PWD/||"
(( failed == 0 )) && print -- "✓ All steps passed: $OUT" || { print -- "✗ Some steps failed: $OUT"; exit 1; }
