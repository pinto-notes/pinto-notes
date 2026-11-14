# DRAFT, not published. A formula for a tap of our own (pinto-notes/homebrew-tap):
#
#   brew install pinto-notes/tap/pinto-notes
#
# Installs pinto. Not the old name amber: homebrew-core's "amber" (the Crystal web framework) also
# installs a binary called amber. The URLs point at GitHub release assets that don't exist yet; fill
# the checksums from cli/dist/SHA256SUMS after `deno task compile` for the release.
class PintoNotes < Formula
  desc "Your Pinto Notes from the terminal"
  homepage "https://pintonotes.com"
  version "0.3.0"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/pinto-notes/pinto-notes/releases/download/cli-v0.3.0/pinto-macos-arm64.tar.gz"
      sha256 "FILL_FROM_SHA256SUMS"
    end
    on_intel do
      url "https://github.com/pinto-notes/pinto-notes/releases/download/cli-v0.3.0/pinto-macos-x64.tar.gz"
      sha256 "FILL_FROM_SHA256SUMS"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/pinto-notes/pinto-notes/releases/download/cli-v0.3.0/pinto-linux-arm64.tar.gz"
      sha256 "FILL_FROM_SHA256SUMS"
    end
    on_intel do
      url "https://github.com/pinto-notes/pinto-notes/releases/download/cli-v0.3.0/pinto-linux-x64.tar.gz"
      sha256 "FILL_FROM_SHA256SUMS"
    end
  end

  def install
    bin.install "pinto"
  end

  test do
    assert_equal version.to_s, shell_output("#{bin}/pinto --version").strip
    assert_match "pinto search", shell_output("#{bin}/pinto help")
  end
end
