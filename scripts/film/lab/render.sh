#!/bin/zsh
# Lab: compiles the film-look experiments with the app's film model and renders one.
#   scripts/film/lab/render.sh STYLE OUT.mp4 [seed] [light] [nofolders]
set -euo pipefail
cd "$(dirname "$0")/../../.."
bin=${TMPDIR:-/tmp}/pinto-film-lab
N=Pane/Model/NotebookFilm
xcrun swiftc -O -o $bin $N/NotebookFilm.swift $N/FilmDemo.swift scripts/film/lab/kit.swift scripts/film/lab/town.swift $(ls scripts/film/lab/*.swift | grep -v -E "kit|town|main") scripts/film/lab/main.swift 2>&1 | grep -E "error" -A6 || true
$bin "$@"
