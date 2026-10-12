#!/bin/zsh
# The server's copy of the key with the app's own code on both sides (PaneTests/Network/
# KeyCopyLiveTests.swift): two throwaway accounts, several sessions of each as their devices.
#
#   scripts/key-copy-e2e.sh            against the local stack (`supabase start`, every migration,
#                                      `supabase functions serve` with KEY_COPY=on and a KEY_COPY_SECRET_1)
#   scripts/key-copy-e2e.sh staging    against the staging project (.secrets/staging.env). Never production.
#
# The accounts are deleted afterwards. Wait a minute between runs against staging: the function
# takes 30 requests a minute from one address.
set -euo pipefail
cd "$(dirname "$0")/.."
PROD_REF=rodegaeruhyybqilrnpn
if [[ ${1:-} == staging ]]; then
  source "$(cd "$(git rev-parse --git-common-dir)/.." && pwd)/.secrets/staging.env"
  REF=${STAGING_REF:?no staging project}
  [[ $REF != "$PROD_REF" ]] || { echo "That's the production project. Refusing." >&2; exit 1; }
  API_URL="https://$REF.supabase.co"
  # No real email from a test: the key function must write its notice to the log instead.
  supabase secrets list --project-ref "$REF" 2>/dev/null | grep -q KEY_NOTICE_SEND || { echo "KEY_NOTICE_SEND is not set on staging: no real email may go out. Set it to log first." >&2; exit 1; }
  keys=$(supabase projects api-keys --project-ref "$REF" -o json 2>/dev/null)
  key() { print -r -- "$keys" | python3 -c "import sys,json;k=json.JSONDecoder().raw_decode(sys.stdin.read())[0];print(next(x['api_key'] for x in k if x.get('name')==sys.argv[1]))" "$1"; }
  ANON_KEY=$(key anon); SERVICE_ROLE_KEY=$(key service_role)
  # Resend's own sink address: the notice email a fetch sends goes nowhere and bounces nothing.
  at() { print -r -- "delivered+key-copy-$1-$run@resend.dev"; }
else
  eval "$(cd "${STACK_DIR:-.}" && supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
  [[ "$API_URL" == http://127.0.0.1:* ]] || { echo "Not a local stack: $API_URL"; exit 1; }
  at() { print -r -- "key-copy-$1-$run@pane.local"; }
fi
run=$(uuidgen | tr 'A-Z' 'a-z')
password="key-copy-e2e-$run"
admin=(-H "authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY" -H 'content-type: application/json')
ids=()
for who in new old; do
  email=$(at $who)
  curl -sf -X POST "$API_URL/rest/v1/signup_allowlist" "${admin[@]}" -H 'prefer: resolution=ignore-duplicates' -d "{\"email\":\"$email\"}" >/dev/null || true
  ids+=("$(curl -sf -X POST "$API_URL/auth/v1/admin/users" "${admin[@]}" -d "{\"email\":\"$email\",\"password\":\"$password\",\"email_confirm\":true}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')")
done
cleanup() {
  for id in $ids; do curl -sf -X DELETE "$API_URL/auth/v1/admin/users/$id" "${admin[@]}" >/dev/null || true; done
  curl -sf -X DELETE "$API_URL/rest/v1/signup_allowlist?email=like.*key-copy-*-$run@*" "${admin[@]}" >/dev/null || true
}
trap cleanup EXIT INT TERM HUP
export TEST_RUNNER_PANE_KEYCOPY_API="$API_URL" TEST_RUNNER_PANE_KEYCOPY_ANON="$ANON_KEY" TEST_RUNNER_PANE_KEYCOPY_PASSWORD="$password"
export TEST_RUNNER_PANE_KEYCOPY_EMAIL="$(at new)" TEST_RUNNER_PANE_KEYCOPY_OLD_EMAIL="$(at old)"
scripts/qa-test.sh PaneTests/KeyCopyLiveTests
# Every notice email a fetch made was rendered and logged, and none was sent.
mails=$(curl -sf "$API_URL/rest/v1/key_copy_events?select=why&what=eq.mailed&user_id=in.($(IFS=,; print -r -- "${ids[*]}"))" "${admin[@]}")
print -r -- "notice emails: $mails"
python3 -c 'import json,sys; m=json.loads(sys.argv[1]); sys.exit(0 if m and all(r["why"] in ("logged", "off") for r in m) else 1)' "$mails" \
  || { echo "✗ a notice email was not logged (or none was made)"; exit 1; }
