#!/bin/zsh
# Sets your build's accent colour, the one every button, tick, link and hover follows
# (Palette.accent), and the colour the system's own controls use.
#
#   scripts/set-accent.sh 1E7A4C 5CC48A    light mode, then dark mode, as hex (a # in front is fine)
#   scripts/set-accent.sh amber            back to Pinto Notes' amber
#
# It changes no tracked file, so pulling from upstream never conflicts: the colours go in
# Config/Identity.local.xcconfig (PANE_ACCENT) and the gitignored AccentColorLocal asset.
# The light colour fills the primary buttons under a white label: keep it deep (3:1 against white
# or more). The dark one is the accent on black. PaneTests/AmberButtonTests checks both, and that the
# asset matches: scripts/qa-test.sh PaneTests/AmberButtonTests
set -euo pipefail
SELF=${0:A}
cd "$(dirname "$SELF")/.."
LOCAL=Config/Identity.local.xcconfig
ASSETS=Pane/Resources/Assets.xcassets
OWN=$ASSETS/AccentColorLocal.colorset

[[ -f $LOCAL ]] || { echo "Give the app its own name first: scripts/setup.sh (or scripts/make-it-yours.sh)." >&2; exit 1; }
if [[ ${1:-} == amber ]]; then
  light="" dark=""
elif (( $# == 2 )); then
  light=${${1#\#}:u} dark=${${2#\#}:u}
  for c in $light $dark; do
    [[ $c =~ '^[0-9A-F]{6}$' ]] || { echo "A colour is 6 hex digits, like 1E7A4C." >&2; exit 1; }
  done
else
  sed -n '2,12p' "$SELF" | sed 's/^# \{0,1\}//'; exit 1
fi

# Out with the old accent lines, then in with the new ones (none for amber).
grep -v -E '^(// The accent: set by scripts/set-accent.sh|PANE_ACCENT(_ASSET)? =)' $LOCAL > $LOCAL.tmp || true
mv $LOCAL.tmp $LOCAL
rm -rf $OWN
if [[ -z $light ]]; then
  echo "Accent: Pinto Notes' amber."
else
  printf '// The accent: set by scripts/set-accent.sh\nPANE_ACCENT = %s %s\nPANE_ACCENT_ASSET = AccentColorLocal\n' $light $dark >> $LOCAL
  mkdir -p $OWN
  # The upstream asset with your colours: the light one first, then the dark one.
  python3 - "$ASSETS/AccentColor.colorset/Contents.json" "$OWN/Contents.json" "$light" "$dark" <<'PY'
import re, sys
src, out, light, dark = sys.argv[1:]
hexes = iter([light, dark])
rgb = r'"blue" : "0x[0-9A-Fa-f]{2}", "green" : "0x[0-9A-Fa-f]{2}", "red" : "0x[0-9A-Fa-f]{2}"'
def swap(m):
    h = next(hexes)
    return f'"blue" : "0x{h[4:6]}", "green" : "0x{h[2:4]}", "red" : "0x{h[0:2]}"'
text, n = re.subn(rgb, swap, open(src).read())
if n != 2: sys.exit(f"Expected a light and a dark colour in {src}, found {n}.")
open(out, "w").write(text)
PY
  echo "Accent: #$light in light mode, #$dark in dark mode ($LOCAL and $OWN, both gitignored)."
fi
echo "Check it: scripts/qa-test.sh PaneTests/AmberButtonTests, then scripts/setup.sh to rebuild."
