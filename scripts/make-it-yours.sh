#!/bin/zsh
# Makes this checkout build as your own app: your bundle id, name, URL scheme and Apple team.
#
#   scripts/make-it-yours.sh --name "Kim's Notes" --bundle-id com.kim.notes             # no Apple account
#   scripts/make-it-yours.sh --name "Kim's Notes" --bundle-id com.kim.notes --personal-team ABCDE12345
#   scripts/make-it-yours.sh --name "Kim's Notes" --bundle-id com.kim.notes --team ABCDE12345
#   scripts/make-it-yours.sh --site https://notes.kim.dev     later: change one thing, keep the rest
#   scripts/make-it-yours.sh --no-team    stop signing the iPhone app with a team
#   scripts/make-it-yours.sh --project-id kimnotes   the local backend's own database (another checkout
#                                         keeps its own); the one tracked file it changes, supabase/config.toml
#   scripts/make-it-yours.sh --show       what this checkout builds as
#   scripts/make-it-yours.sh --reset      back to upstream's identity
#
# --personal-team: a free Apple account's team. The iPhone app then signs without Sign in with
#   Apple, push and associated domains (Pane/Resources/Pane-ios-personal.entitlements), and an
#   install lasts 7 days.
# --team: a paid Apple Developer Program team. Everything the iPhone app has, as upstream.
# Neither: the Mac app and the iPhone Simulator, which need no account.
# --site: your own website (web/), whose /open/… links the app should open. Leave it out until you
#   have one.
# The Mac app is always ad-hoc signed ("sign to run locally"), so it builds and runs with no account.
# Your team id is in Xcode → Settings → Accounts, or at developer.apple.com/account (Membership).
#
# It writes Config/Identity.local.xcconfig (gitignored, overrides Config/Identity.xcconfig) and
# regenerates the Xcode project. Run again, it changes only what you pass and keeps the rest.
# Nothing tracked changes (but --project-id's one line), so pulling from upstream doesn't conflict.
# docs/MAKE-IT-YOURS.md has the rest.
set -euo pipefail
SELF=${0:A}
cd "$(dirname "$SELF")/.."
OUT=Config/Identity.local.xcconfig

usage() { sed -n '2,27p' "$SELF" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

name="" bundle="" scheme="" team="" site="" project="" personal="" noteam=0 show=0 reset=0
while (( $# )); do
  case $1 in
    --name) name=${2:?--name needs a value}; shift 2 ;;
    --bundle-id) bundle=${2:?--bundle-id needs a value}; shift 2 ;;
    --url-scheme) scheme=${2:?--url-scheme needs a value}; shift 2 ;;
    --team) team=${2:?--team needs a team id}; personal=0; shift 2 ;;
    --no-team) noteam=1; shift ;;
    --project-id) project=${2:?--project-id needs a name, like kimnotes}; shift 2
      [[ $project =~ '^[a-z0-9_-]+$' ]] || { echo "A project id is lowercase letters, digits, - and _: --project-id kimnotes" >&2; exit 1; }
      sed -i '' "s/^project_id = \".*\"/project_id = \"$project\"/" supabase/config.toml
      echo "The local backend is now project \"$project\": its own database. Start it with scripts/setup.sh."
      (( $# )) || exit 0 ;;
    --personal-team) team=${2:?--personal-team needs a team id}; personal=1; shift 2 ;;
    --site) site=${2:?--site needs an address, like https://notes.kim.dev}; shift 2
      [[ $site =~ '^https://[A-Za-z0-9.-]+/?$' ]] || { echo "A site is an https address with no path, like https://notes.kim.dev" >&2; exit 1; }
      site=${${site#https://}%/} ;;
    --show) show=1; shift ;;
    --reset) reset=1; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1" >&2; usage 1 ;;
  esac
done

regenerate() {
  if command -v xcodegen >/dev/null; then xcodegen generate --quiet && echo "Regenerated Pane.xcodeproj."
  else echo "Install XcodeGen (brew install xcodegen), then run: xcodegen generate"; fi
}

if (( show )); then
  if [[ -f $OUT ]]; then echo "$OUT:"; grep -v '^//' "$OUT"; else echo "Upstream's identity (no $OUT)."; fi
  exit 0
fi
if (( reset )); then
  rm -f "$OUT"; echo "Removed $OUT: this checkout builds as upstream's app again."; regenerate; exit 0
fi

# What's set already: a flag left out keeps it.
was() { [[ -f $OUT ]] && sed -n "s/^$1 = \{0,1\}//p" "$OUT" | tail -1; return 0; }
old_bundle=$(was PANE_BUNDLE_ID)
[[ -n $bundle ]] || bundle=$old_bundle
[[ -n $name ]] || name=$(was PANE_DISPLAY_NAME)
# A new bundle id gets its own URL scheme, unless one is passed.
[[ -n $scheme || $bundle != "$old_bundle" ]] || scheme=$(was PANE_URL_SCHEME)
if (( noteam )); then team="" personal=0
elif [[ -z $team ]]; then team=$(was PANE_IOS_TEAM)
  [[ -n $personal ]] || { [[ $(was PANE_IOS_ENTITLEMENTS) == Pane-ios-personal.entitlements ]] && personal=1 || personal=0; }
fi
[[ -n $personal ]] || personal=0
host=${site:-$(was PANE_APPLINKS_HOST)}
# Kept as they are: the accent scripts/set-accent.sh wrote.
accent=$( [[ -f $OUT ]] && grep -E '^(// The accent: set by scripts/set-accent.sh|PANE_ACCENT(_ASSET)? =)' "$OUT" || true )

[[ -n $bundle ]] || { echo "Say which bundle id: --bundle-id com.you.notes" >&2; usage 1; }
[[ $bundle =~ '^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$' ]] || { echo "A bundle id looks like com.you.notes (letters, digits, hyphens and dots)." >&2; exit 1; }
[[ $bundle != dev.emilwagman.* ]] || { echo "That's upstream's bundle id. Pick one of your own, such as com.you.notes." >&2; exit 1; }
[[ -z $team || $team =~ '^[A-Z0-9]{10}$' ]] || { echo "A team id is 10 letters and digits, like ABCDE12345." >&2; exit 1; }
[[ -n $name ]] || name="Pinto Notes"
# The URL scheme the sign-in links and the AI connect page open: by default the bundle id's last two
# parts, so com.kim.notes opens kimnotes:// (a word like notes:// is likely taken by another app).
if [[ -z $scheme ]]; then scheme=${(j::)${(@s:.:)bundle}[-2,-1]}; scheme=${${scheme:l}//[^a-z0-9]/}; fi
# The same rule as the site's (web/lib/app-scheme.ts), which falls back to Pinto Notes' scheme otherwise.
[[ $scheme =~ '^[a-z][a-z0-9-]*$' ]] || { echo "A URL scheme is a lowercase letter, then lowercase letters, digits or hyphens: --url-scheme mynotes" >&2; exit 1; }

{
  echo "// Written by scripts/make-it-yours.sh on $(date +%Y-%m-%d). Gitignored; overrides Config/Identity.xcconfig."
  echo "PANE_BUNDLE_ID = $bundle"
  echo "PANE_DISPLAY_NAME = $name"
  echo "PANE_URL_SCHEME = $scheme"
  echo "PANE_APP_GROUP = group.$bundle"
  echo "PANE_IOS_TEAM = $team"
  echo "// Links to your own site only, and no updates from Pinto Notes' feed: your build never"
  echo "// replaces itself with Pinto Notes."
  echo "PANE_APPLINKS_HOST = $host"
  echo "PANE_APPLINKS_ALIAS = $host"
  echo "PANE_UPDATE_FEED ="
  if (( personal )); then
    echo "// A free Apple account: no Sign in with Apple, push or associated domains on the iPhone."
    echo "PANE_IOS_ENTITLEMENTS = Pane-ios-personal.entitlements"
  fi
  if [[ -n $accent ]]; then print -r -- "$accent"; fi
} > "$OUT"

echo "Wrote $OUT: $name ($bundle), URL scheme $scheme://"
if [[ -z $team ]]; then
  echo "No Apple team: build the Mac app, or the iPhone app for the Simulator."
elif (( personal )); then
  echo "Personal team $team: the iPhone app signs without Sign in with Apple, push and associated domains."
else
  echo "Team $team signs the iPhone app."
fi
regenerate
