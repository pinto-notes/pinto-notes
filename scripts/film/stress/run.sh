#!/bin/zsh
# The film's stress lab: hundreds of notebooks through the film, checked frame by frame.
#   scripts/film/stress/run.sh OUT [jobs] [random-count]
# Writes OUT/report.txt (a line per notebook and its faults) and stills of each fault.
set -euo pipefail
cd "$(dirname "$0")/../../.."
out=${1:-stress-out}; jobs=${2:-4}; count=${3:-200}
bin=${TMPDIR:-/tmp}/pinto-film-stress
N=Pane/Model/NotebookFilm
xcrun swiftc -O -o $bin $N/NotebookFilm.swift $N/FilmDemo.swift $N/FilmRenderer.swift $N/FilmScenes.swift $N/FilmHolo.swift $N/FilmGalaxy.swift $N/FilmSlides.swift $N/FilmSound.swift $N/FilmVideo.swift scripts/film/stress/*.swift
mkdir -p $out
pids=()
for ((s = 0; s < jobs; s++)); do $bin $out $s $jobs $count > $out/log-$s.txt 2>&1 & pids+=($!); done
for p in $pids; do wait $p; done
cat $out/r-*.txt > $out/report.txt
print -- "$(grep -c '| ok$' $out/report.txt) of $(grep -c '^[0-9]' $out/report.txt) without a fault; report: $out/report.txt"
