#!/bin/zsh
# Puts this branch on your Mac and your iPhone to feel it, and serves the web editor live, so
# changes to web-editor/src show on both devices a moment after you save, without a new build.
#
#   scripts/try.sh            build and install this branch's last commit on the Mac and the
#                             iPhone, then serve the web editor live (Ctrl-C stops serving)
#   scripts/try.sh --serve    serve the web editor only (the builds are already installed)
#   scripts/try.sh --mac      the Mac only, and serve
#
# The installed apps load the web editor from this Mac (its Tailscale address, port 5199) when
# they can reach it, and the copy built into them when they can't. Turn it on in Settings ›
# Experimental › Web editor; a switch at the foot of each note picks Native, Web or Both.
set -euo pipefail
cd "$(dirname "$0")/.."
here=$PWD

host=$(tailscale ip -4 2>/dev/null || /Applications/Tailscale.app/Contents/MacOS/Tailscale ip -4 2>/dev/null || ipconfig getifaddr en0)
host=${host%%$'\n'*}
export PINTO_WEB_EDITOR_DEV_URL="http://$host:5199/"
echo "Live web editor: $PINTO_WEB_EDITOR_DEV_URL"

[[ -d web-editor/node_modules ]] || (cd web-editor && npm ci --silent)
(cd web-editor && node build.mjs)

if [[ ${1:-} != --serve ]]; then
  if [[ -n $(git status --porcelain -- Pane web-editor project.yml) ]]; then
    echo "Commit first: the Mac install builds this branch's last commit." >&2; exit 1
  fi
  # From the main checkout: it holds Config/Backend.local.xcconfig, which a worktree doesn't.
  main=$(cd "$(git rev-parse --path-format=absolute --git-common-dir)/.." && pwd)
  REF=$(git rev-parse HEAD) "$main/scripts/install-mac.sh"
  [[ ${1:-} == --mac ]] || scripts/install-phone.sh
fi

cd "$here/web-editor" && exec node build.mjs --serve
