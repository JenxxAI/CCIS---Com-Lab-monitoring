#!/usr/bin/env python3
"""
CICTE Lab Monitor — Quick Test Agent
─────────────────────────────────────
Run this on a Windows laptop to test real-time display in the dashboard.

  python test-agent.py

No setup needed — just Python 3.8+ (built-in libraries only).
The laptop will appear as CL1 → PC-99 in the dashboard.
"""

import json
import os
import platform
import socket
import subprocess
import time
import urllib.request
import urllib.error
import uuid
import logging
from datetime import datetime

# ─── Configuration ────────────────────────────────────────────────────────────
# These are pre-filled for immediate testing. Do not share the AGENT_KEY.

SERVER_URL = "https://jubilant-carnival-9p45wvr5965hrwv-3001.app.github.dev"
LAB_ID     = "cl1"     # The laptop will appear under CL 1
PC_NUMBER  = 60        # Slot 60 — real CL1 only has PCs 1–31, so this is safe
AGENT_KEY  = "b20252104d43a0067a3bf1e5889354df636a694e2570f92c1ee0fa2fd309e234"
INTERVAL   = 10        # Send heartbeat every 10 seconds so you see updates fast

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger()

# ─── System Info ──────────────────────────────────────────────────────────────

def get_hostname():
    return socket.gethostname()

def get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def get_mac():
    mac = uuid.getnode()
    return ":".join(f"{(mac >> (8 * i)) & 0xFF:02X}" for i in reversed(range(6)))

def get_cpu():
    try:
        out = subprocess.check_output(
            ["wmic", "cpu", "get", "Name", "/format:list"],
            text=True, timeout=5, creationflags=0x08000000
        )
        for line in out.strip().split("\n"):
            if line.startswith("Name="):
                return line.split("=", 1)[1].strip()
    except Exception:
        pass
    return platform.processor() or "Unknown"

def get_ram():
    try:
        out = subprocess.check_output(
            ["wmic", "computersystem", "get", "TotalPhysicalMemory", "/format:list"],
            text=True, timeout=5, creationflags=0x08000000
        )
        for line in out.strip().split("\n"):
            if line.startswith("TotalPhysicalMemory="):
                total = int(line.split("=")[1].strip())
                return f"{round(total / (1024 ** 3))} GB"
    except Exception:
        pass
    return "Unknown"

def get_storage():
    try:
        out = subprocess.check_output(
            ["wmic", "diskdrive", "get", "Size", "/format:list"],
            text=True, timeout=5, creationflags=0x08000000
        )
        for line in out.strip().split("\n"):
            if line.startswith("Size="):
                val = line.split("=")[1].strip()
                if val:
                    return f"{round(int(val) / (1024 ** 3))} GB"
    except Exception:
        pass
    return "Unknown"

def get_user():
    try:
        out = subprocess.check_output(
            ["query", "user"], text=True, timeout=5, creationflags=0x08000000
        )
        lines = [l for l in out.strip().split("\n") if "Active" in l]
        if lines:
            return lines[0].split()[0].strip(">")
    except Exception:
        pass
    return os.environ.get("USERNAME", "Unknown")

# ─── Heartbeat ────────────────────────────────────────────────────────────────

def build_heartbeat():
    return {
        "labId":        LAB_ID,
        "pcNum":        PC_NUMBER,
        "hostname":     get_hostname(),
        "ipAddress":    get_ip(),
        "macAddress":   get_mac(),
        "os":           f"{platform.system()} {platform.release()}",
        "osBuild":      platform.version(),
        "cpu":          get_cpu(),
        "ram":          get_ram(),
        "storage":      get_storage(),
        "loggedInUser": get_user(),
        "timestamp":    datetime.utcnow().isoformat() + "Z",
        "agentVersion": "test-1.0",
    }

def send(payload):
    url  = f"{SERVER_URL}/api/agent/heartbeat"
    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-Agent-Key", AGENT_KEY)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.reason}
    except urllib.error.URLError as e:
        return 0, {"error": str(e.reason)}
    except Exception as e:
        return 0, {"error": str(e)}

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print()
    print("╔══════════════════════════════════════════════╗")
    print("║   CICTE Lab Monitor — Test Agent             ║")
    print("╠══════════════════════════════════════════════╣")
    print(f"║  Server:  {SERVER_URL[:42]}")
    print(f"║  Lab:     {LAB_ID}  →  PC-{PC_NUMBER:02d}")
    print(f"║  Host:    {get_hostname()}")
    print(f"║  IP:      {get_ip()}")
    print("╚══════════════════════════════════════════════╝")
    print()
    print("Open the dashboard, go to Computer Lab 1,")
    print("and watch PC-60 appear and update in real time.")
    print(f"Sending heartbeat every {INTERVAL}s.  Press Ctrl+C to stop.")
    print()

    beat = 0
    while True:
        beat += 1
        payload = build_heartbeat()
        status, body = send(payload)
        ts = datetime.now().strftime("%H:%M:%S")
        if status == 200:
            log.info(f"✓  Beat #{beat:03d} → PC id={body.get('pcId','?')}  status={body.get('status','?')}  condition={body.get('condition','?')}")
        else:
            log.warning(f"✗  Beat #{beat:03d} failed  HTTP {status}: {body.get('error','?')}")
        time.sleep(INTERVAL)

if __name__ == "__main__":
    main()
