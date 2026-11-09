#!/bin/zsh
# The notebook film pilot: compiles the app's film code with a small driver and renders the demo notebook.
#   scripts/film/render.sh OUT.mp4 [seed] [days]
set -euo pipefail
cd "$(dirname "$0")/../.."
bin=${TMPDIR:-/tmp}/pinto-film-render
cd Pane/Model/NotebookFilm
xcrun swiftc -O -o $bin NotebookFilm.swift FilmRenderer.swift FilmScenes.swift FilmVideo.swift FilmDemo.swift ../../../scripts/film/main.swift
cd - >/dev/null
$bin "$@"
