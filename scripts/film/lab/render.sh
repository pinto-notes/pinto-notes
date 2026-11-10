#!/bin/zsh
# Lab: compiles the film-look experiments with the app's film model and renders one.
#   scripts/film/lab/render.sh STYLE OUT.mp4 [seed] [light] [nofolders]
set -euo pipefail
cd "$(dirname "$0")/../../.."
bin=${TMPDIR:-/tmp}/pinto-film-lab
N=Pane/Model/NotebookFilm
rm -f $bin
xcrun swiftc -O -o $bin $N/NotebookFilm.swift $N/FilmDemo.swift $N/FilmRenderer.swift $N/FilmScenes.swift $N/FilmHolo.swift $N/FilmVideo.swift scripts/film/lab/*.swift 2>&1 | grep -E "error" -A6 || true
$bin "$@"
