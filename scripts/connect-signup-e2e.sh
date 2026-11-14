#!/bin/zsh
# Signing up on the web connect page, end to end, on a local stack only:
#   1. scripts/connect-signup-e2e.ts after: a brand-new person signs up on /connect in headless
#      Chromium (an Android phone, an iPhone), allows ChatGPT, and ChatGPT's tokens write a note and
#      read it back over MCP.
#   2. PaneTests/ConnectSignupLiveTests: the app's own key code signs in as that account (its first
#      sign-in in the app), gets the key the page made, and opens the note.
#
#   STACK_DIR=build/stack scripts/connect-signup-e2e.sh [site url, default http://127.0.0.1:5292]
#
# Needs, all local: a stack with every migration (`supabase start`), `supabase functions serve
# --no-verify-jwt` with KEY_COPY=on, a KEY_COPY_SECRET_1, CONNECT_IN_BROWSER=on, KEY_NOTICE_SEND=log
# and CONNECT_PAGE_URL=<site>/connect, and the site (`next start`) with SUPABASE_URL and
# SUPABASE_ANON_KEY of that stack. Captures go to build/repro/after/.
#
# The email account has no password (the page signs in by code). Here it gets one through the admin
# API, which is what "Forgot password" in the app gives it, so the app can sign in as it does.
set -euo pipefail
cd "$(dirname "$0")/.."
site=${1:-http://127.0.0.1:5292}
eval "$(cd "${STACK_DIR:-.}" && supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY|MAILPIT_URL)=')"
[[ "$API_URL" == http://127.0.0.1:* && "$site" == http://127.0.0.1:* ]] || { echo "Not a local stack: $API_URL $site"; exit 1; }
export API_URL ANON_KEY SERVICE_ROLE_KEY MAILPIT_URL
result=$(deno run -A scripts/connect-signup-e2e.ts after "$site" | tail -1)
print -r -- "$result"
field() { print -r -- "$result" | python3 -c "import json,sys; print(json.load(sys.stdin)['email'][sys.argv[1]])" "$1"; }
uid=$(field user_id); email=$(field email); words=$(field words)
admin=(-H "authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY" -H 'content-type: application/json')
cleanup() { curl -sf -X DELETE "$API_URL/auth/v1/admin/users/$uid" "${admin[@]}" >/dev/null || true; }
trap cleanup EXIT INT TERM HUP
password="signup-e2e-$(uuidgen)"
curl -sf -X PUT "$API_URL/auth/v1/admin/users/$uid" "${admin[@]}" -d "{\"password\":\"$password\"}" >/dev/null
export TEST_RUNNER_PANE_SIGNUP_API="$API_URL" TEST_RUNNER_PANE_SIGNUP_ANON="$ANON_KEY" TEST_RUNNER_PANE_SIGNUP_EMAIL="$email"
export TEST_RUNNER_PANE_SIGNUP_PASSWORD="$password" TEST_RUNNER_PANE_SIGNUP_WORDS="$words"
scripts/qa-test.sh PaneTests/ConnectSignupLiveTests
