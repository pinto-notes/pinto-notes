#!/bin/zsh
# Runs the MCP server's end-to-end tests against the LOCAL Supabase stack.
#   scripts/mcp-e2e.sh            # the file tools (what production serves)
#   scripts/mcp-e2e.sh --filter session
# Needs `supabase start` (the local edge runtime serves supabase/functions/mcp). The classic tools'
# suites (e2e.test.ts, ai_editor.e2e.test.ts, locked.e2e.test.ts) need the stack serving
# AMBER_MCP_TOOLS=pages; name them to run them.
set -euo pipefail
cd "$(dirname "$0")/.."
eval "$(deno run -A scripts/dev-user.ts)"
cd supabase/functions/mcp
files=(notes.test.ts files.e2e.test.ts)
args=()
for a in "$@"; do
  if [[ $a == *.test.ts ]]; then files=($a ${files:#$a}); else args+=($a); fi
done
deno test -A --quiet ${files[@]} ${args[@]}
