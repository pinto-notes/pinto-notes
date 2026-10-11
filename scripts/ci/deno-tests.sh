#!/usr/bin/env bash
# The server's Deno tests, as CI runs them: scripts/ci/deno-tests.sh <test files>
#
# deno test --parallel runs the files as workers of one process, and the environment belongs to
# the process: a file that sets or deletes a variable changes it under every file running beside
# it (card.test.ts saw AMBER_MCP_TOOLS flip between two reads while instructions.test.ts ran).
# So the files that never write the environment run together, and each file that does
# (Deno.env.set or Deno.env.delete anywhere in it) runs in a process of its own, one at a time.
# Nothing to keep in step by hand: a file that starts writing the environment moves itself.
set -euo pipefail
together=() alone=()
for f in "$@"; do
  if grep -qE 'Deno\.env\.(set|delete)' "$f"; then alone+=("$f"); else together+=("$f"); fi
done
echo "${#together[@]} files side by side, ${#alone[@]} on their own (they write the environment)"
if [ ${#together[@]} -gt 0 ]; then deno test --allow-all --parallel "${together[@]}"; fi
if [ ${#alone[@]} -gt 0 ]; then
  for f in "${alone[@]}"; do deno test --allow-all "$f"; done
fi
