#!/bin/zsh
# From a fresh clone to a Pinto Notes you built yourself, in one command (docs/MAKE-IT-YOURS.md).
#
#   scripts/setup.sh                 check this Mac, start the local backend, build the Mac app
#   scripts/setup.sh --open          the same, then open the app
#   scripts/setup.sh --local-only    no Docker and no backend: notes stay on this Mac, no sign-in
#
# It checks for Xcode 26, Homebrew and Docker and says what to do when one is missing, installs
# XcodeGen and the Supabase CLI with Homebrew if they aren't there, gives the app a name and bundle
# id of its own (scripts/make-it-yours.sh), starts the local backend (supabase start), and builds
# the Mac app into build/ddqa, where scripts/qa-test.sh's tests reuse it. Safe to run again: each step that's already done is skipped.
set -uo pipefail
SELF=${0:A}
cd "$(dirname "$SELF")/.."
ROOT=$PWD
OPEN=0 LOCAL=0
for a in "$@"; do
  case $a in
    --open) OPEN=1 ;;
    --local-only) LOCAL=1 ;;
    -h|--help) sed -n '2,11p' "$SELF" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $a (try --help)" >&2; exit 1 ;;
  esac
done

ok() { print -- "✓ $*"; }
step() { print -- "→ $*"; }
# Stop with what went wrong and what to do about it.
stop() { print -- "\n✗ $1" >&2; shift; for l in "$@"; do print -- "  $l" >&2; done; exit 1; }
START=$SECONDS

# 1. macOS and Xcode
major=$(sw_vers -productVersion | cut -d. -f1)
(( major >= 26 )) || stop "This Mac runs macOS $(sw_vers -productVersion); Pinto Notes needs macOS 26 or later." \
  "Update in System Settings → General → Software Update, then run scripts/setup.sh again."
dev=$(xcode-select -p 2>/dev/null)
if [[ $dev != */Xcode*.app/* ]]; then
  # Only the Command Line Tools are selected (the usual case on a new Mac): use Xcode itself.
  xcode=$(ls -d /Applications/Xcode.app /Applications/Xcode*.app 2>/dev/null | head -1)
  [[ -n $xcode ]] || stop "Xcode isn't installed." \
    "Install Xcode 26 from the App Store (about 15 GB, 20 to 40 minutes), open it once and let it" \
    "install its components, then run scripts/setup.sh again."
  dev=$xcode/Contents/Developer
fi
export DEVELOPER_DIR=$dev
xv=$(xcodebuild -version 2>/dev/null | head -1 | awk '{print $2}')
[[ ${xv%%.*} -ge 26 ]] 2>/dev/null || stop "This Xcode is ${xv:-not working} ($dev); Pinto Notes needs Xcode 26 or later." \
  "Install Xcode 26 from the App Store, open it once, then run scripts/setup.sh again."
if ! xcodebuild -checkFirstLaunchStatus >/dev/null 2>&1; then
  stop "Xcode hasn't finished setting up." "Open Xcode once and let it install its components, or run:" \
    "  sudo xcodebuild -runFirstLaunch" "then run scripts/setup.sh again."
fi
ok "Xcode $xv"

# 2. Homebrew and the tools
command -v brew >/dev/null || [[ -x /opt/homebrew/bin/brew ]] || stop "Homebrew isn't installed." \
  "Install it from https://brew.sh (one command, a few minutes), then run scripts/setup.sh again."
command -v brew >/dev/null || eval "$(/opt/homebrew/bin/brew shellenv)"
need=()
command -v xcodegen >/dev/null || need+=(xcodegen)
(( LOCAL )) || command -v supabase >/dev/null || need+=(supabase/tap/supabase)
if (( ${#need} )); then
  step "Installing ${need[*]} with Homebrew (a minute or two)"
  brew install "${need[@]}" >/dev/null || stop "brew install ${need[*]} failed." "Run it yourself to see why, then run scripts/setup.sh again."
fi
ok "XcodeGen $(xcodegen --version 2>/dev/null | awk '{print $NF}')$( (( LOCAL )) || print -n ", Supabase CLI $(supabase --version 2>/dev/null | head -1)")"

# 3. Who the app is. Never upstream's bundle id: a build under it would share the installed Pinto
# Notes' settings and Keychain items on this Mac.
if [[ ! -f Config/Identity.local.xcconfig ]]; then
  user=${${$(id -un):l}//[^a-z0-9]/}
  scripts/make-it-yours.sh --name "My Pinto Notes" --bundle-id "local.${user:-me}.notes" >/dev/null \
    || stop "scripts/make-it-yours.sh didn't work." "Run it yourself to see why."
  ok "Your app is My Pinto Notes (local.${user:-me}.notes). To rename it: scripts/make-it-yours.sh --name \"…\" --bundle-id com.you.notes"
else
  ok "Your app is $(sed -n 's/^PANE_DISPLAY_NAME = //p' Config/Identity.local.xcconfig) ($(sed -n 's/^PANE_BUNDLE_ID = //p' Config/Identity.local.xcconfig))"
fi

# 4. The backend
MARK="// Written by scripts/setup.sh --local-only"
if (( LOCAL )); then
  if [[ -f Config/Backend.local.xcconfig ]] && ! grep -qF "$MARK" Config/Backend.local.xcconfig; then
    stop "Config/Backend.local.xcconfig points this checkout at a backend already (scripts/deploy-backend.sh wrote it)." \
      "To build without one, move that file away first."
  fi
  printf '%s: no backend, notes stay on this device. Delete this file to use one again.\nPANE_SUPABASE_URL =\n' "$MARK" > Config/Backend.local.xcconfig
  ok "No backend: notes stay on this Mac, and there's no sign-in"
else
  [[ -f Config/Backend.local.xcconfig ]] && grep -qF "$MARK" Config/Backend.local.xcconfig && rm Config/Backend.local.xcconfig
  command -v docker >/dev/null || stop "Docker isn't installed. The local backend runs in it." \
    "Install Docker Desktop from https://www.docker.com/products/docker-desktop, open it, then run scripts/setup.sh again." \
    "Or build without a backend (notes stay on this Mac): scripts/setup.sh --local-only"
  docker info >/dev/null 2>&1 || stop "Docker isn't running." \
    "Open Docker Desktop and wait until it says the engine is running, then run scripts/setup.sh again." \
    "Or build without a backend (notes stay on this Mac): scripts/setup.sh --local-only"
  if supabase status >/dev/null 2>&1; then
    ok "The local backend is running"
  else
    step "Starting the local backend (the first time downloads about 3 GB of Docker images: 5 to 15 minutes)"
    mkdir -p build
    if ! supabase start > build/supabase-start.log 2>&1; then
      tail -5 build/supabase-start.log | sed 's/^/  /' >&2
      if grep -qiE "port is already allocated|address already in use" build/supabase-start.log; then
        stop "Something else is using a port the backend needs (56420 to 56429)." \
          "Another Supabase project is probably running. Stop it with 'supabase stop' in its folder" \
          "(docker ps lists what runs), then run scripts/setup.sh again. The full log: build/supabase-start.log"
      fi
      stop "supabase start failed. The full log is build/supabase-start.log." \
        "Often Docker needs more memory (Docker Desktop → Settings → Resources: 4 GB or more) or a restart."
    fi
    rm -f build/supabase-start.log
    ok "The local backend is running"
  fi
  # The app's key is Supabase's standard local key. A Supabase CLI that makes another one gets it here.
  key=$(supabase status -o env 2>/dev/null | sed -n 's/^ANON_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p')
  if [[ -n $key && $key != $(sed -n 's/^PANE_SUPABASE_KEY = //p' Config/Backend.xcconfig) && ! -f Config/Backend.local.xcconfig ]]; then
    printf '// Written by scripts/setup.sh: this Mac'"'"'s local backend has its own key.\nPANE_SUPABASE_KEY = %s\n' "$key" > Config/Backend.local.xcconfig
    ok "Using this local backend's key (Config/Backend.local.xcconfig)"
  fi
fi

# 5. The project and the build
xcodegen generate --quiet || stop "xcodegen generate failed." "Run it yourself to see why."
ok "Made Pane.xcodeproj"
mkdir -p build
LOG=$ROOT/build/setup-build.log
step "Building the Mac app (3 to 10 minutes the first time, under a minute after that)"
b=$SECONDS
# qa-test.sh's derived data and settings, so the tests build on this instead of building the app again.
if ! xcodebuild -project Pane.xcodeproj -scheme Pane -configuration Debug -destination 'platform=macOS' -derivedDataPath build/ddqa \
    ENABLE_TESTABILITY=YES ENABLE_HARDENED_RUNTIME=NO ONLY_ACTIVE_ARCH=YES SWIFT_ACTIVE_COMPILATION_CONDITIONS='$(inherited) QA' \
    CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM= PROVISIONING_PROFILE_SPECIFIER= build > "$LOG" 2>&1; then
  grep -E "error:" "$LOG" | sort -u | head -10 | sed 's/^/  /' >&2
  stop "The build failed (the errors are above, the full log is build/setup-build.log)." \
    "If it says a package couldn't be fetched, check your connection and run scripts/setup.sh again." \
    "Otherwise open an issue at https://github.com/pinto-notes/pinto-notes/issues with the errors."
fi
APP=$ROOT/build/ddqa/Build/Products/Debug/Pane.app
ok "Built in $(( SECONDS - b )) s: $APP"

took=$(( SECONDS - START )); (( took < 90 )) && took="$took s" || took="$(( (took + 30) / 60 )) min"
print -- "\nDone in $took. Open your app:\n  open \"$APP\""
if (( LOCAL )); then
  print -- "Your notes stay on this Mac. To sync with your own backend later: docs/MAKE-IT-YOURS.md, step 4."
else
  print -- "First run: press Get started, type any email address, press Continue and make a password of 12"
  print -- "characters or more. Nothing is really emailed: if the app asks for a code, it's in the local mail"
  print -- "viewer, http://127.0.0.1:56424. (Sign in with Apple and Google aren't set up in your build.)"
fi
print -- "Next: docs/MAKE-IT-YOURS.md (your own name and icon, your iPhone, your own backend, changing the app)."
(( OPEN )) && open "$APP"
exit 0
