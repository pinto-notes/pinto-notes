#!/bin/zsh
# How busy the Mac is, once a minute (launchd, see install.sh), one CSV line in
# $PINTO_DEV_LOG/load.csv: the proof for "the Mac was the bottleneck", or against it.
#   epoch, 1-min load, cores, free memory %, swap used MB, free disk GB,
#   xcodebuild processes, swift-frontend processes, claude processes, booted simulators
dir=${PINTO_DEV_LOG:-$HOME/Library/Logs/pinto-dev}
mkdir -p "$dir"
f="$dir/load.csv"
[[ -s $f ]] || print "epoch,load1,cores,mem_free_pct,swap_mb,disk_free_gb,xcodebuild,swift_frontend,claude,simulators" > "$f"
count() { pgrep -x "$1" 2>/dev/null | wc -l | tr -d ' ' }
load=$(sysctl -n vm.loadavg | awk '{print $2}')
cores=$(sysctl -n hw.ncpu)
mem=$(memory_pressure -Q 2>/dev/null | awk -F': ' '/free percentage/ {gsub("%","",$2); print $2}')
swap=$(sysctl -n vm.swapusage | awk '{for (i=1;i<=NF;i++) if ($i=="used") {v=$(i+2); sub("M","",v); print int(v)}}')
disk=$(df -g / | awk 'NR==2 {print $4}')
sims=$(xcrun simctl list devices booted 2>/dev/null | grep -c Booted)
print "$(date +%s),$load,$cores,${mem:-},${swap:-},$disk,$(count xcodebuild),$(count swift-frontend),$(count claude),$sims" >> "$f"
