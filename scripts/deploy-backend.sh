#!/bin/zsh
# Deploys Pinto Notes' backend to YOUR Supabase project and points your builds at it.
#
#   scripts/deploy-backend.sh <project-ref> [--site https://notes.example.com] [--dry-run]
#
# <project-ref> is the 20 letters in your project's address (https://<ref>.supabase.co).
# --site     where you deployed web/ (share links, and the page ChatGPT and Claude connect through).
#            Stored with your identity (scripts/make-it-yours.sh --site, the same value), so later runs
#            use it without the flag. Without a site, share links and ChatGPT or Claude connections
#            don't work; Claude Code and Codex connect with a token from the app and need no site.
# --dry-run  prints every step and changes nothing, here or on Supabase.
#
# Needs a personal access token for the account that owns the project, in .env
# (SUPABASE_ACCESS_TOKEN=sbp_…, from supabase.com/dashboard/account/tokens) or in the environment.
# Using the token keeps this machine's global `supabase login` untouched. Also needs deno (the
# sign-in emails are written by scripts/auth-emails.ts) and python3.
#
# What it does, in order:
#   1. links this folder to the project (asks for the database password)
#   2. applies every migration in supabase/migrations
#   3. deploys the functions the app uses: mcp, account, account-status, share-files, key
#   4. sets the functions' secrets. The ones it makes up are kept in .secrets/backend-<ref>.env
#      (gitignored): KEY_COPY_SECRET_1 seals every account's key copy, so it is made once and reused
#   5. checks that the clean-up jobs are scheduled (pg_cron, which the migrations turn on)
#   6. sets the auth settings: sign-in with an email and a password of 12 or more characters, your
#      app's URL scheme as a redirect, the account emails (password resets; a 6-digit code where the
#      app asks for one), and Sign in with Apple only with a paid team (make-it-yours --team)
#   7. writes Config/Backend.local.xcconfig (gitignored), so your builds sync with this project, and
#      prints the settings your site (web/) needs
# Running it again is safe: each step does the same thing again, and the secrets are kept.
set -euo pipefail
cd "$(dirname "$0")/.."

REF="" SITE="" DRY=0
while (( $# )); do
  case $1 in
    --site) SITE=${2:?--site needs an address}; SITE=${SITE%/}; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; exit 1 ;;
    *) REF=$1; shift ;;
  esac
done
[[ -n $REF ]] || { echo "usage: scripts/deploy-backend.sh <project-ref> [--site https://…] [--dry-run]" >&2; exit 1; }
[[ $REF =~ '^[a-z]{20}$' ]] || { echo "A project ref is 20 lowercase letters (the part before .supabase.co)." >&2; exit 1; }
[[ $REF != rodegaeruhyybqilrnpn ]] || { echo "That's Pinto Notes' own production project. Use a project of yours." >&2; exit 1; }
[[ -z $SITE || $SITE == https://* ]] || { echo "--site needs an https:// address." >&2; exit 1; }

if [[ -f .env ]]; then set -a; . ./.env; set +a; fi
if (( ! DRY )); then
  : "${SUPABASE_ACCESS_TOKEN:?put SUPABASE_ACCESS_TOKEN=sbp_… in .env (supabase.com/dashboard/account/tokens)}"
  export SUPABASE_ACCESS_TOKEN
  for tool in supabase deno python3 openssl curl; do
    command -v $tool >/dev/null || { echo "Needs $tool (brew install supabase/tap/supabase deno)." >&2; exit 1; }
  done
fi

URL="https://$REF.supabase.co"
MCP="$URL/functions/v1/mcp"
FUNCTIONS=(mcp account account-status share-files key)

# Who the app is, from Config/Identity.local.xcconfig (scripts/make-it-yours.sh) or upstream's.
identity() {  # a setting in the local file wins even when it's empty (no team)
  local f=Config/Identity.local.xcconfig
  [[ -f $f ]] && grep -q "^$1 =" $f || f=Config/Identity.xcconfig
  sed -n "s/^$1 = \{0,1\}//p" $f | tail -1
}
BUNDLE=$(identity PANE_BUNDLE_ID)
SCHEME=$(identity PANE_URL_SCHEME)
# Sign in with Apple needs a paid team's iPhone app; a free account's can't sign it (make-it-yours.sh).
APPLE=0
if [[ -n $(identity PANE_IOS_TEAM) && $(identity PANE_IOS_ENTITLEMENTS) != Pane-ios-personal.entitlements ]]; then APPLE=1; fi

step() { echo "→ $*"; }
run() { if (( DRY )); then echo "  would run: $*"; else "$@"; fi; }
# Stop with what to do next: what failed is printed above it by the command itself.
fail() { echo "\n✗ $1" >&2; shift; for l in "$@"; do echo "  $l" >&2; done; echo "  Running scripts/deploy-backend.sh $REF again is safe once it's fixed." >&2; exit 1; }
# Your site: one value, kept in Config/Identity.local.xcconfig as PANE_APPLINKS_HOST. --site stores it
# there (through make-it-yours.sh); without --site, the stored one is used. Upstream's is never used.
if [[ -n $SITE ]]; then
  if [[ -f Config/Identity.local.xcconfig ]] && (( ! DRY )); then
    scripts/make-it-yours.sh --site "$SITE" >/dev/null || fail "Couldn't store the site with scripts/make-it-yours.sh --site $SITE."
  fi
elif [[ -f Config/Identity.local.xcconfig ]]; then
  stored=$(sed -n 's/^PANE_APPLINKS_HOST = \{0,1\}//p' Config/Identity.local.xcconfig | tail -1)
  if [[ -n $stored ]]; then SITE=https://$stored; fi
fi
api() {  # api METHOD PATH JSON-FILE
  if (( DRY )); then echo "  would $1 https://api.supabase.com$2 with: $(python3 -c 'import json,sys;print(", ".join(sorted(json.load(open(sys.argv[1])))))' "$3")"; return; fi
  curl -sSf -X "$1" "https://api.supabase.com$2" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "content-type: application/json" --data-binary @"$3" >/dev/null
}
tmp=$(mktemp -d); trap "rm -rf '$tmp'" EXIT

(( DRY )) && echo "Dry run: nothing is changed."
echo "Project $URL, app $BUNDLE ($SCHEME://)${SITE:+, site $SITE}"

step "Linking $REF"
run supabase link --project-ref "$REF" || fail "Couldn't link $REF." \
  "A wrong database password: reset it in the dashboard (Project Settings → Database) and use the new one." \
  "Unauthorized: the token in .env is wrong or expired; make a new one at supabase.com/dashboard/account/tokens." \
  "Not found: check the ref, the 20 letters in https://<ref>.supabase.co."

step "Applying the migrations"
run supabase db push --linked --include-seed=false || fail "A migration didn't apply. The message above names the file." \
  "If the project already had tables of its own, use a new, empty project." \
  "Otherwise open an issue at https://github.com/pinto-notes/pinto-notes/issues with the message."

step "Deploying the functions: ${FUNCTIONS[*]}"
# --use-api: bundled by Supabase, so Docker doesn't have to be running.
for f in $FUNCTIONS; do
  run supabase functions deploy "$f" --project-ref "$REF" --use-api || fail "The $f function didn't deploy." \
    "Check your connection and that the project isn't paused (the dashboard says so), then run this again."
done

step "Setting the functions' secrets"
SECRETS=.secrets/backend-$REF.env
[[ -f $SECRETS ]] && source "$SECRETS"
keep() {  # keep NAME VALUE: made once, then read back from $SECRETS
  [[ -n ${(P)1:-} ]] && return
  typeset -g "$1=$2"
  (( DRY )) || { mkdir -p .secrets; (umask 077; print -r -- "$1='$2'" >> "$SECRETS"); }
}
keep BACKEND_KEY_COPY_SECRET "$(openssl rand -base64 32)"
keep BACKEND_STATUS_SALT "$(openssl rand -hex 32)"
# Your site's proxy vouches for a caller's address with this (set the same value on the site), and
# rate limits hash addresses with the other.
keep BACKEND_PROXY_SECRET "$(openssl rand -hex 32)"
keep BACKEND_RATE_HASH_SECRET "$(openssl rand -hex 32)"
(umask 077; cat > "$tmp/secrets.env" <<EOF
KEY_COPY=on
KEY_COPY_SECRET_1=$BACKEND_KEY_COPY_SECRET
ACCOUNT_STATUS_SALT=$BACKEND_STATUS_SALT
MCP_PROXY_SECRET=$BACKEND_PROXY_SECRET
RATE_HASH_SECRET=$BACKEND_RATE_HASH_SECRET
MCP_PUBLIC_URL=$MCP
MCP_ALIAS_URLS=$MCP
APNS_TOPIC=$BUNDLE
EOF
if [[ -n $SITE ]]; then printf 'CONNECT_PAGE_URL=%s/connect\nTEMPLATE_SITE_URL=%s\n' "$SITE" "$SITE" >> "$tmp/secrets.env"; fi)
if (( DRY )); then echo "  would set: $(cut -d= -f1 "$tmp/secrets.env" | tr '\n' ' ')"
else
  supabase secrets set --project-ref "$REF" --env-file "$tmp/secrets.env" >/dev/null || fail "The functions' secrets weren't set."
  echo "  set: $(cut -d= -f1 "$tmp/secrets.env" | tr '\n' ' ')"
fi

step "Checking the clean-up jobs"
# pg_cron clears expired sign-ins, rate-limit rows and Recently Deleted notes after 30 days. The
# migrations turn it on and schedule the jobs; this checks they did.
if (( DRY )); then echo "  would check: select count(*) from cron.job"
else
  print -r -- '{"query": "select count(*) as n from cron.job"}' > "$tmp/q.json"
  jobs=$(curl -sS -X POST "https://api.supabase.com/v1/projects/$REF/database/query" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "content-type: application/json" --data-binary @"$tmp/q.json" 2>/dev/null | python3 -c 'import json,sys;print(json.load(sys.stdin)[0]["n"])' 2>/dev/null) || jobs=""
  if [[ $jobs == <-> ]] && (( jobs >= 5 )); then echo "  ✓ $jobs jobs scheduled"
  else
    echo "  ! The clean-up jobs aren't scheduled${jobs:+ ($jobs found)}. Without them expired sign-ins, rate-limit rows and"
    echo "    Recently Deleted notes past 30 days are never cleared. Turn on pg_cron (Database → Extensions), then"
    echo "    run each cron.schedule(…) line in supabase/migrations in the SQL editor."
  fi
fi
echo "  The welcome and report emails stay off: they need the lifecycle function and two vault secrets"
echo "  (docs/Technical/lifecycle-emails.md). Nothing else depends on them."

step "Auth settings"
# The sign-in emails (a 6-digit code; Supabase's own template sends only a link, which the app can't
# use), then the settings around them. Sign-ups stay on: `disable_signup` would turn email sign-in off.
if command -v deno >/dev/null; then deno run -A scripts/auth-emails.ts patch > "$tmp/emails.json"; else echo '{}' > "$tmp/emails.json"; fi
python3 - "$tmp/emails.json" "$tmp/auth.json" "${SITE:-$URL}" "$SCHEME" "$BUNDLE" "$APPLE" <<'PY'
import json, sys
emails, out, site, scheme, bundle, apple = sys.argv[1:]
c = json.load(open(emails))
c.update({
    "site_url": site,
    "uri_allow_list": f"{scheme}://auth-callback,{site}/**",
    "disable_signup": False,
    "external_email_enabled": True,
    "mailer_autoconfirm": True,
    "mailer_otp_length": 6,
    "mailer_otp_exp": 3600,
    "password_min_length": 12,
})
if apple == "1":
    c.update({"external_apple_enabled": True, "external_apple_client_id": bundle})
json.dump(c, open(out, "w"))
PY
api PATCH "/v1/projects/$REF/config/auth" "$tmp/auth.json" || {
  echo "  The full settings were refused (custom email templates can need your own SMTP server)."
  python3 -c 'import json,sys;c=json.load(open(sys.argv[1]));json.dump({k:v for k,v in c.items() if not k.startswith(("mailer_templates_","mailer_subjects_"))},open(sys.argv[1],"w"))' "$tmp/auth.json"
  api PATCH "/v1/projects/$REF/config/auth" "$tmp/auth.json" || fail "The auth settings weren't accepted." \
    "Check that the token in .env belongs to the account that owns the project."
  echo "  Set without the emails. Put {{ .Token }} in Authentication → Emails → Magic link, or the app gets no code."
}

step "Writing Config/Backend.local.xcconfig"
if (( DRY )); then
  echo "  would write PANE_SUPABASE_URL=$URL, PANE_SUPABASE_KEY=<the project's anon key>, PANE_MCP_URL=$MCP${SITE:+, PANE_SHARE_URL=$SITE}"
else
  ANON=$(supabase projects api-keys --project-ref "$REF" -o json 2>/dev/null | python3 -c "import sys,json;k=json.JSONDecoder().raw_decode(sys.stdin.read().lstrip())[0];print(next(x['api_key'] for x in k if x.get('name') in ('anon','publishable')))" 2>/dev/null) || ANON=""
  [[ -n $ANON ]] || fail "Couldn't read the project's anon key." "Run: supabase projects api-keys --project-ref $REF"
  [[ -f Config/Backend.local.xcconfig ]] && cp Config/Backend.local.xcconfig "Config/Backend.local.xcconfig.before-$REF"
  (umask 077; {
    echo "// Written by scripts/deploy-backend.sh: your Supabase project. Gitignored."
    echo "PANE_SUPABASE_URL = https:/\$()/$REF.supabase.co"
    echo "PANE_SUPABASE_KEY = $ANON"
    echo "PANE_MCP_URL = ${MCP/https:\/\//https:/\$()/}"
    if [[ -n $SITE ]]; then echo "PANE_SHARE_URL = ${SITE/https:\/\//https:/\$()/}"; fi
  } > Config/Backend.local.xcconfig)
fi

echo "→ Done. Rebuild the app; it now syncs with $URL."
echo "  Sign up in the app with your email and a password of 12 or more characters. Emails (password"
echo "  resets, and a code where the app asks for one) come from Supabase's mailer, which only"
echo "  sends to your project's team members until you set up SMTP (Authentication → Emails → SMTP settings)."
echo "  AI server: $MCP"
echo "    Claude Code and Codex: Settings → Connect an AI in the app, and copy the command."
echo "    ChatGPT and Claude, once your site is up: add a connector with this address, $MCP"
echo "  Your site (web/, for share links and connecting ChatGPT or Claude): deploy it with these settings,"
echo "  then run this again with --site https://your-site (docs/MAKE-IT-YOURS.md, step 4):"
echo "    SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL  $URL"
echo "    SUPABASE_ANON_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY  the PANE_SUPABASE_KEY in Config/Backend.local.xcconfig"
echo "    MCP_PROXY_SECRET  the BACKEND_PROXY_SECRET in .secrets/backend-$REF.env"
echo "    NEXT_PUBLIC_APP_SCHEME  $SCHEME"
echo "    SITE_URL  ${SITE:-your site's address, https://…} (not needed on Vercel, which says it itself)"
echo "    APP_PAGES_ONLY=1  only the pages your app uses, kept out of search"
if (( ! DRY )); then
  echo ""
  echo "Back up this file now: $PWD/$SECRETS"
  echo "  It holds the secret that seals every account's key copy. Lose it and no new device can open the notes."
fi
