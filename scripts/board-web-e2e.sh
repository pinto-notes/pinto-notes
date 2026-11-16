#!/bin/zsh
# A whiteboard edited at once in the app and in a browser, on the LOCAL stack only (never staging or
# production): the app's own code (PaneTests/Collab/BoardWebLiveTests.swift) and headless Chromium on
# the site's /s/<id> page (scripts/board-web-e2e.ts) edit one board, see each other's pointers and
# comment, and converge.
#
#   scripts/board-web-e2e.sh        needs `supabase start`; serves the key function and the site itself
#
# What it starts (the key function, the site) it stops again, by PID. Both accounts are deleted after.
# Pictures: build/repro/board-web/.
set -euo pipefail
cd "$(dirname "$0")/.."
root=$PWD
eval "$(supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY|MAILPIT_URL)=')"
[[ "$API_URL" == http://127.0.0.1:* && "$MAILPIT_URL" == http://127.0.0.1:* ]] || { echo "Not a local stack: $API_URL" >&2; exit 1; }
export API_URL MAILPIT_URL

run=$(uuidgen | tr 'A-Z' 'a-z' | cut -c1-8)
work=$(mktemp -d "${TMPDIR:-/tmp}/board-web-e2e.XXXXXX")
chmod 700 "$work"
owner="board-web-$run-emil@example.com" browser="board-web-$run-sara@example.com"
password=$(uuidgen)$(uuidgen)
admin=(-H "authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY" -H 'content-type: application/json')
pids=() ids=() served=0

cleanup() {
  set +e
  for pid in ${(Oa)pids}; do kill -INT $pid 2>/dev/null; done
  for pid in $pids; do for i in {1..50}; do kill -0 $pid 2>/dev/null || break; sleep 0.2; done; kill -0 $pid 2>/dev/null && kill $pid; done
  # The serve's container, which it can leave running when it's stopped.
  [[ -n ${edge:-} && $served == 1 ]] && docker rm -f $edge >/dev/null 2>&1
  # The browser's account was made by its sign-in: found by its address.
  local found
  found=$(curl -sf "$API_URL/auth/v1/admin/users?per_page=1000" "${admin[@]}" | python3 -c 'import json,sys; print("\n".join(u["id"] for u in json.load(sys.stdin)["users"] if u.get("email") == sys.argv[1]))' "$browser")
  for id in $ids ${(f)found}; do [[ -n $id ]] && curl -sf -X DELETE "$API_URL/auth/v1/admin/users/$id" "${admin[@]}" >/dev/null; done
  curl -sf -X DELETE "$API_URL/rest/v1/signup_allowlist?email=like.board-web-$run-*" "${admin[@]}" >/dev/null
  rm -rf "$work"
}
trap cleanup EXIT INT TERM HUP

# Both addresses may sign up (the local stack lets in only listed ones). The app's person, Emil, is
# made confirmed with a password; the browser's person signs in with the site's email code and
# names herself there. Both accounts have the ids Emil and Sara have in every picture the tests
# take (PaneTests TestPeople), so each has one colour in all of them, as on every device (round 14:
# Sara was purple in the Mac's pictures and teal in the browser's). Left over from a run that
# stopped half way, they go first.
emil_id=e0000000-0000-4000-8000-000000000001 sara_id=5a000000-0000-4000-8000-000000000002
for id in $emil_id $sara_id; do curl -s -o /dev/null -X DELETE "$API_URL/auth/v1/admin/users/$id" "${admin[@]}"; done
for email in $owner $browser; do
  curl -sf -X POST "$API_URL/rest/v1/signup_allowlist" "${admin[@]}" -H 'prefer: resolution=ignore-duplicates' -d "{\"email\":\"$email\"}" >/dev/null
done
ids+=("$(curl -sf -X POST "$API_URL/auth/v1/admin/users" "${admin[@]}" \
  -d "{\"id\":\"$emil_id\",\"email\":\"$owner\",\"password\":\"$password\",\"email_confirm\":true,\"user_metadata\":{\"board_web_test\":true}}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')")
# Hers has no name or keys yet: the site asks her name, and makes her keys as she joins.
ids+=("$(curl -sf -X POST "$API_URL/auth/v1/admin/users" "${admin[@]}" \
  -d "{\"id\":\"$sara_id\",\"email\":\"$browser\",\"email_confirm\":true,\"user_metadata\":{\"board_web_test\":true}}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')")
[[ ${ids[1]} == $emil_id && ${ids[2]} == $sara_id ]] || { echo "The test accounts weren't made with their ids: $ids" >&2; exit 1; }
# His name, as the app's sign-up sets it: the browser's person mentions him by it.
curl -sf -X POST "$API_URL/rest/v1/profiles?on_conflict=user_id" "${admin[@]}" -H 'prefer: resolution=merge-duplicates' -d "{\"user_id\":\"${ids[1]}\",\"display_name\":\"Emil Wagman\"}" >/dev/null
curl -sf -X POST "$API_URL/rest/v1/email_unsubscribes" "${admin[@]}" -H 'prefer: resolution=ignore-duplicates' -d "{\"user_id\":\"${ids[1]}\",\"source\":\"link\"}" >/dev/null
data_key=$(openssl rand -base64 32)
python3 -c 'import json,sys; json.dump({"url": sys.argv[1], "anon_key": sys.argv[2], "owner": {"email": sys.argv[3], "password": sys.argv[4], "data_key": sys.argv[5]}, "dir": sys.argv[6]}, open(sys.argv[7], "w"))' \
  "$API_URL" "$ANON_KEY" "$owner" "$password" "$data_key" "$work" "$work/config.json"
chmod 600 "$work/config.json"

# The key function, with the server's copy of the key on (a new web account makes its key through it).
# Its notice emails are only logged. Someone else's `functions serve` is left alone.
edge=supabase_edge_runtime_pane
[[ -z $(docker ps -q --filter "name=^${edge}$") ]] || { echo "Edge functions are already being served on the local stack; stop that serve first." >&2; exit 1; }
print -r -- "KEY_COPY=on
KEY_COPY_SECRET_1=$(openssl rand -base64 32)
KEY_NOTICE_SEND=log" > "$work/functions.env"
served=1
supabase functions serve --no-verify-jwt --env-file "$work/functions.env" > "$work/functions.log" 2>&1 &
pids+=($!)

# The site, built and started as it runs live, on a port nothing else uses.
port=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])')
site="http://127.0.0.1:$port"
(cd web && SUPABASE_URL=$API_URL SUPABASE_ANON_KEY=$ANON_KEY pnpm -s build > "$work/build.log" 2>&1) || { tail -30 "$work/build.log"; exit 1; }
(cd web && exec env SUPABASE_URL=$API_URL SUPABASE_ANON_KEY=$ANON_KEY node node_modules/next/dist/bin/next start -H 127.0.0.1 -p $port > "$work/site.log" 2>&1) &
pids+=($!)
for i in {1..150}; do
  curl -s -o /dev/null -w '%{http_code}' "$API_URL/functions/v1/key" -X OPTIONS 2>/dev/null | grep -qE '^(200|204)$' \
    && curl -sf -o /dev/null "$site/board/canvas.html" && break
  sleep 0.4
done
curl -sf -o /dev/null "$site/board/canvas.html" || { echo "The site didn't start" >&2; tail -20 "$work/site.log"; exit 1; }

# The browser and the app, at once.
deno run -A scripts/board-web-e2e.ts "$site" "$work" "$browser" > "$work/browser.log" 2>&1 &
web=$!
pids+=($web)
set +e
TEST_RUNNER_BOARD_WEB_LIVE="$work/config.json" LIMIT=${LIMIT:-600} scripts/qa-test.sh PaneTests/BoardWebLiveTests | tee "$work/app.log"
app=$pipestatus[1]
# The suite runs only with its config: a run that skipped it hasn't tested anything.
grep -qE "Test run with 1 test.* passed" "$work/app.log" && [[ -f $work/done.txt ]] || app=1
[[ $app -eq 0 ]] || { echo "the app's side failed or didn't run" >&2; app=1; }
for i in {1..300}; do kill -0 $web 2>/dev/null || break; sleep 0.5; done
wait $web; browser_status=$?
pids=(${pids:#$web})
cat "$work/browser.log"
if [[ $app -ne 0 || $browser_status -ne 0 ]]; then
  echo "✗ app $app, browser $browser_status" >&2
  grep -iE "error|warn" "$work/functions.log" | tail -10 >&2
  exit 1
fi
echo "✓ the app and the browser converged; pictures in $root/build/repro/board-web/"
