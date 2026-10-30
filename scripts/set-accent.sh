#!/bin/zsh
# Sets the app's accent colour: Palette.accent (Pane/Editor/Palette.swift), which every button, tick,
# link and hover follows, and the AccentColor asset the system's own controls use, together.
#
#   scripts/set-accent.sh 1E7A4C 5CC48A    light mode, then dark mode, as hex (a # in front is fine)
#   scripts/set-accent.sh amber            back to Pinto Notes' amber
#
# The light colour fills the primary buttons under a white label: keep it deep (3:1 against white
# or more). The dark one is the accent on black. PaneTests/AmberButtonTests checks both, and that the
# asset matches: scripts/qa-test.sh PaneTests/AmberButtonTests
set -euo pipefail
SELF=${0:A}
cd "$(dirname "$SELF")/.."
PALETTE=Pane/Editor/Palette.swift
ASSET=Pane/Resources/Assets.xcassets/AccentColor.colorset/Contents.json

if [[ ${1:-} == amber ]]; then
  light=D96A06 dark=F4AD33 code="Accent.amber"
elif (( $# == 2 )); then
  light=${${1#\#}:u} dark=${${2#\#}:u}
  for c in $light $dark; do
    [[ $c =~ '^[0-9A-F]{6}$' ]] || { echo "A colour is 6 hex digits, like 1E7A4C." >&2; exit 1; }
  done
  code="Accent(light: 0x$light, dark: 0x$dark)"
else
  sed -n '2,10p' "$SELF" | sed 's/^# \{0,1\}//'; exit 1
fi

grep -q '^    static let accent = ' $PALETTE || { echo "Couldn't find 'static let accent =' in $PALETTE." >&2; exit 1; }
sed -i '' "s/^    static let accent = .*/    static let accent = $code/" $PALETTE
# The asset as Xcode writes it: the light colour first, then the dark one.
python3 - "$ASSET" "$light" "$dark" <<'PY'
import re, sys
path, light, dark = sys.argv[1:]
text, hexes = open(path).read(), iter([light, dark])
rgb = r'"blue" : "0x[0-9A-Fa-f]{2}", "green" : "0x[0-9A-Fa-f]{2}", "red" : "0x[0-9A-Fa-f]{2}"'
def swap(m):
    h = next(hexes)
    return f'"blue" : "0x{h[4:6]}", "green" : "0x{h[2:4]}", "red" : "0x{h[0:2]}"'
text, n = re.subn(rgb, swap, text)
if n != 2: sys.exit(f"Expected a light and a dark colour in {path}, found {n}.")
open(path, "w").write(text)
PY
echo "Accent: #$light in light mode, #$dark in dark mode ($PALETTE and the AccentColor asset)."
echo "Check it: scripts/qa-test.sh PaneTests/AmberButtonTests, then scripts/setup.sh to rebuild."
