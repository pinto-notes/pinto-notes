#!/bin/sh
# Installs pinto, the Pinto Notes command-line tool, for the current user.
#
#   curl -fsSL https://pintonotes.com/install.sh | sh
#
# Downloads the binary for this machine, checks it against SHA256SUMS, and puts it in
# ~/.local/bin (no sudo), with amber (its old name) as a link to it unless another amber is there.
# Override with PINTO_INSTALL_DIR; PINTO_DOWNLOAD_BASE picks where the files come from (a release,
# or a local folder as file:///… for testing). The AMBER_ names of both still work.
set -eu

BASE="${PINTO_DOWNLOAD_BASE:-${AMBER_DOWNLOAD_BASE:-https://github.com/pinto-notes/pinto-notes/releases/latest/download}}"
DIR="${PINTO_INSTALL_DIR:-${AMBER_INSTALL_DIR:-$HOME/.local/bin}}"

fail() { printf 'pinto install: %s\n' "$1" >&2; exit 1; }

case "$(uname -s)" in
  Darwin) os=macos ;;
  Linux) os=linux ;;
  *) fail "no build for $(uname -s); pinto runs on macOS and Linux." ;;
esac
case "$(uname -m)" in
  arm64 | aarch64) arch=arm64 ;;
  x86_64 | amd64) arch=x64 ;;
  *) fail "no build for $(uname -m)." ;;
esac
name="pinto-$os-$arch.tar.gz"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
printf 'Downloading %s\n' "$name"
curl -fsSL "$BASE/$name" -o "$tmp/$name" || fail "couldn't download $BASE/$name"
curl -fsSL "$BASE/SHA256SUMS" -o "$tmp/SHA256SUMS" || fail "couldn't download $BASE/SHA256SUMS"

want=$(awk -v n="$name" '$2 == n { print $1 }' "$tmp/SHA256SUMS")
if command -v sha256sum >/dev/null 2>&1; then got=$(sha256sum "$tmp/$name" | awk '{ print $1 }')
else got=$(shasum -a 256 "$tmp/$name" | awk '{ print $1 }'); fi
[ -n "$want" ] || fail "SHA256SUMS has no line for $name."
[ "$want" = "$got" ] || fail "the download doesn't match its checksum. Nothing was installed."

tar -xzf "$tmp/$name" -C "$tmp" pinto || fail "couldn't unpack $name."
mkdir -p "$DIR"
chmod 755 "$tmp/pinto"
mv "$tmp/pinto" "$DIR/pinto"
printf 'Installed pinto %s to %s/pinto\n' "$("$DIR/pinto" --version)" "$DIR"

# The old name, as a link. An amber that isn't this tool (the Crystal web framework has one) stays.
if [ ! -e "$DIR/amber" ] || [ "$(readlink "$DIR/amber" 2>/dev/null)" = pinto ] || "$DIR/amber" help 2>/dev/null | grep -q 'Pinto Notes'; then
  ln -sf pinto "$DIR/amber"
fi

case ":$PATH:" in
  *":$DIR:"*) ;;
  *)
    shell_rc="$HOME/.profile"
    case "${SHELL:-}" in */zsh) shell_rc="$HOME/.zshrc" ;; */bash) shell_rc="$HOME/.bashrc" ;; esac
    printf '\n%s is not on your PATH. Add it with:\n\n  echo '\''export PATH="%s:$PATH"'\'' >> %s\n\n' "$DIR" "$DIR" "$shell_rc"
    ;;
esac
printf 'Next: pinto login\n'
