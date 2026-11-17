#!/bin/zsh
# Start measuring dev time on this Mac: a load sample every minute and a report every morning.
#   scripts/dev-time/install.sh            install or update (copies the scripts, loads two launch agents)
#   scripts/dev-time/install.sh --remove   stop and remove both
# prepush.sh and qa-test.sh log their own runs whether or not this is installed.
set -euo pipefail
src=${0:A:h}
dest=$HOME/.local/share/pinto-dev-time
agents=$HOME/Library/LaunchAgents
log=${PINTO_DEV_LOG:-$HOME/Library/Logs/pinto-dev}
for name in sample daily; do
  launchctl bootout gui/$UID "$agents/se.norditech.pinto-dev-time-$name.plist" 2>/dev/null || true
  rm -f "$agents/se.norditech.pinto-dev-time-$name.plist"
done
[[ ${1:-} == --remove ]] && { print "Removed. The logs stay in $log."; exit 0; }
mkdir -p "$dest" "$log" "$agents"
cp "$src/sample.sh" "$src/daily.sh" "$src/dev-time.py" "$dest/"
plist() {  # name, schedule xml
  cat > "$agents/se.norditech.pinto-dev-time-$1.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>se.norditech.pinto-dev-time-$1</string>
  <key>ProgramArguments</key><array><string>/bin/zsh</string><string>$dest/$1.sh</string></array>
  $2
  <key>Nice</key><integer>15</integer>
  <key>LowPriorityIO</key><true/>
  <key>StandardOutPath</key><string>$log/$1.out</string>
  <key>StandardErrorPath</key><string>$log/$1.out</string>
</dict>
</plist>
PLIST
  launchctl bootstrap gui/$UID "$agents/se.norditech.pinto-dev-time-$1.plist"
}
plist sample "<key>StartInterval</key><integer>60</integer><key>RunAtLoad</key><true/>"
plist daily "<key>StartCalendarInterval</key><dict><key>Hour</key><integer>6</integer><key>Minute</key><integer>30</integer></dict>"
print "Measuring: $log/load.csv every minute, a report at 06:30 in \$PINTO_INTERNAL/evidence/dev-time and a line in $log/trend.csv."
