#!/bin/zsh
# Lab: compiles the film-look experiments with the app's film model and renders one.
#   scripts/film/lab/render.sh STYLE OUT.mp4 [seed] [light] [nofolders]
set -euo pipefail
cd "$(dirname "$0")/../../.."
bin=${TMPDIR:-/tmp}/pinto-film-lab
N=Pane/Model/NotebookFilm
rm -f $bin
xcrun swiftc -O -o $bin $N/NotebookFilm.swift $N/FilmDemo.swift $N/FilmRenderer.swift $N/FilmScenes.swift $N/FilmHolo.swift $N/FilmGalaxy.swift $N/FilmSlides.swift $N/FilmSound.swift $N/FilmVideo.swift scripts/film/lab/*.swift 2>&1 | grep -E "error" -A6 || true
$bin "$@"
# With "sound": the film with its sound, as OUT-sound.mp4.
if [[ " $* " == *" sound "* && -f "$2.wav" ]]; then
  ffmpeg -y -loglevel error -i "$2" -i "$2.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "${2%.mp4}-sound.mp4"
fi
