#!/usr/bin/env python3
"""Load for the board benchmark's loaded run (scripts/board-perf.sh): one kind per process, each
started and stopped by the script by its exact PID.

  load.py memory <fraction>   holds that share of the Mac's free memory, incompressible, touched
                              every few seconds so it stays in memory
  load.py disk <folder>       writes and reads a 1 GB file there without the file cache, over and
                              over; the file goes when it stops
"""
import os, signal, sys, time, fcntl

def memory(fraction):
    page = os.sysconf("SC_PAGE_SIZE")
    out = os.popen("vm_stat").read()
    def count(name):
        for line in out.splitlines():
            if line.startswith(name):
                return int(line.split(":")[1].strip().rstrip("."))
        return 0
    free = (count("Pages free") + count("Pages inactive") + count("Pages purgeable") + count("Pages speculative")) * page
    size = int(free * fraction)
    block = os.urandom(64 << 20)
    chunks = [bytearray(block) for _ in range(max(1, size // len(block)))]
    print(f"memory: holding {sum(len(c) for c in chunks) / 1e9:.1f} GB of {free / 1e9:.1f} GB free", flush=True)
    while True:
        for c in chunks:
            for i in range(0, len(c), page * 64):
                c[i] = (c[i] + 1) & 255
        time.sleep(2)

def disk(folder):
    path = os.path.join(folder, "load-io.bin")
    stop = lambda *_: (os.path.exists(path) and os.remove(path), sys.exit(0))
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    block = os.urandom(8 << 20)
    while True:
        with open(path, "wb") as f:
            fcntl.fcntl(f, fcntl.F_NOCACHE, 1)
            for _ in range(128):
                f.write(block)
            f.flush()
            os.fsync(f.fileno())
        with open(path, "rb") as f:
            fcntl.fcntl(f, fcntl.F_NOCACHE, 1)
            while f.read(8 << 20):
                pass

if __name__ == "__main__":
    if sys.argv[1] == "memory":
        memory(float(sys.argv[2]))
    elif sys.argv[1] == "disk":
        disk(sys.argv[2])
