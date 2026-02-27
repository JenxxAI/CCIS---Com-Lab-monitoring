#!/usr/bin/env python3
"""
CICTE Lab Monitor — PC Agent
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Lightweight agent that runs on each lab PC and reports its status
to the monitoring server automatically.

Install:
  1. Copy this file to each PC (e.g. C:\CICTE\agent.py)
  2. Edit SERVER_URL and LAB_ID below
  3. Run: python agent.py
  4. Or set up as a Windows Scheduled Task (see README)

Requirements: Python 3.8+ (no external packages needed)
"""

import json
import os
import platform
import socket
import subprocess
import sys
import time
import urllib.request
import urllib.error
import uuid
import logging
from datetime import datetime

# ─── Configuration ────────────────────────────────────────────────────────────

SERVER_URL = os.environ.get("CICTE_SERVER_URL", "http://localhost:3001")
LAB_ID     = os.environ.get("CICTE_LAB_ID", "cl1")       # Which lab this PC belongs to
PC_NUMBER  = os.environ.get("CICTE_PC_NUM", "")           # PC number (auto-detected from hostname if empty)
AGENT_KEY  = os.environ.get("CICTE_AGENT_KEY", "cicte-agent-2026")  # Shared secret for agent auth
INTERVAL   = int(os.environ.get("CICTE_INTERVAL", "30"))  # Heartbeat interval in seconds

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("cicte-agent")

# ─── System Info Collectors ───────────────────────────────────────────────────

def get_hostname():
    return socket.gethostname()

def get_ip_address():
    """Get the primary local IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def get_mac_address():
    """Get the primary MAC address."""
    mac = uuid.getnode()
    return ":".join(f"{(mac >> (8 * i)) & 0xFF:02X}" for i in reversed(range(6)))

def get_os_info():
    """Get OS name and build."""
    return {
        "os": f"{platform.system()} {platform.release()}",
        "osBuild": platform.version(),
    }

def get_cpu_info():
    """Get CPU name."""
    if platform.system() == "Windows":
        try:
            out = subprocess.check_output(
                ["wmic", "cpu", "get", "Name", "/format:list"],
                text=True, timeout=5, creationflags=0x08000000  # CREATE_NO_WINDOW
            )
            for line in out.strip().split("\n"):
                if line.startswith("Name="):
                    return line.split("=", 1)[1].strip()
        except Exception:
            pass
    try:
        with open("/proc/cpuinfo") as f:
            for line in f:
                if line.startswith("model name"):
                    return line.split(":")[1].strip()
    except Exception:
        pass
    return platform.processor() or "Unknown"

def get_ram_info():
    """Get total RAM in human-readable format."""
    if platform.system() == "Windows":
        try:
            out = subprocess.check_output(
                ["wmic", "computersystem", "get", "TotalPhysicalMemory", "/format:list"],
                text=True, timeout=5, creationflags=0x08000000
            )
            for line in out.strip().split("\n"):
                if line.startswith("TotalPhysicalMemory="):
                    total = int(line.split("=")[1].strip())
                    gb = round(total / (1024 ** 3))
                    return f"{gb} GB"
        except Exception:
            pass
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemTotal"):
                    kb = int(line.split()[1])
                    gb = round(kb / (1024 ** 2))
                    return f"{gb} GB"
    except Exception:
        pass
    return "Unknown"

def get_storage_info():
    """Get primary disk size."""
    if platform.system() == "Windows":
        try:
            out = subprocess.check_output(
                ["wmic", "diskdrive", "get", "Size", "/format:list"],
                text=True, timeout=5, creationflags=0x08000000
            )
            for line in out.strip().split("\n"):
                if line.startswith("Size="):
                    total = int(line.split("=")[1].strip())
                    gb = round(total / (1024 ** 3))
                    return f"{gb} GB"
        except Exception:
            pass
    try:
        stat = os.statvfs("/")
        total = stat.f_blocks * stat.f_frsize
        gb = round(total / (1024 ** 3))
        return f"{gb} GB"
    except Exception:
        pass
    return "Unknown"

def get_logged_in_user():
    """Get the currently logged-in user."""
    if platform.system() == "Windows":
        try:
            out = subprocess.check_output(
                ["query", "user"],
                text=True, timeout=5, creationflags=0x08000000
            )
            lines = [l for l in out.strip().split("\n") if "Active" in l]
            if lines:
                return lines[0].split()[0].strip(">")
        except Exception:
            pass
    try:
        return os.getlogin()
    except Exception:
        return os.environ.get("USER", os.environ.get("USERNAME", "Unknown"))

def get_pc_number():
    """Extract PC number from hostname or env var."""
    if PC_NUMBER:
        try:
            return int(PC_NUMBER)
        except ValueError:
            pass
    # Try to extract number from hostname (e.g., CL1-PC05 → 5)
    hostname = get_hostname()
    import re
    match = re.search(r"(\d+)\s*$", hostname)
    if match:
        return int(match.group(1))
    # Fallback — hash hostname to a number
    return (hash(hostname) % 50) + 1

# ─── Heartbeat Payload ───────────────────────────────────────────────────────

def build_heartbeat():
    """Build the full heartbeat payload."""
    os_info = get_os_info()
    return {
        "labId":     LAB_ID,
        "pcNum":     get_pc_number(),
        "hostname":  get_hostname(),
        "ipAddress": get_ip_address(),
        "macAddress": get_mac_address(),
        "os":        os_info["os"],
        "osBuild":   os_info["osBuild"],
        "cpu":       get_cpu_info(),
        "ram":       get_ram_info(),
        "storage":   get_storage_info(),
        "loggedInUser": get_logged_in_user(),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "agentVersion": "1.0.0",
    }

# ─── HTTP Client ──────────────────────────────────────────────────────────────

def send_heartbeat(payload):
    """Send the heartbeat to the server."""
    url = f"{SERVER_URL}/api/agent/heartbeat"
    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-Agent-Key", AGENT_KEY)

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read())
            return resp.status, body
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.reason}
    except urllib.error.URLError as e:
        return 0, {"error": str(e.reason)}
    except Exception as e:
        return 0, {"error": str(e)}

# ─── Main Loop ────────────────────────────────────────────────────────────────

def main():
    log.info("╔══════════════════════════════════════════╗")
    log.info("║   CICTE Lab Monitor — PC Agent v1.0.0   ║")
    log.info("╚══════════════════════════════════════════╝")
    log.info(f"Server:   {SERVER_URL}")
    log.info(f"Lab:      {LAB_ID}")
    log.info(f"PC #:     {get_pc_number()}")
    log.info(f"Hostname: {get_hostname()}")
    log.info(f"IP:       {get_ip_address()}")
    log.info(f"Interval: {INTERVAL}s")
    log.info("─" * 44)

    consecutive_failures = 0

    while True:
        try:
            payload = build_heartbeat()
            status, body = send_heartbeat(payload)

            if status == 200:
                consecutive_failures = 0
                pc_id = body.get("pcId", "?")
                log.info(f"✓ Heartbeat OK → {pc_id} (status={body.get('status','?')})")
            else:
                consecutive_failures += 1
                log.warning(f"✗ Heartbeat failed ({status}): {body.get('error','unknown')}")

        except Exception as e:
            consecutive_failures += 1
            log.error(f"✗ Error: {e}")

        # Back off if server is down
        wait = INTERVAL if consecutive_failures < 5 else min(INTERVAL * 4, 120)
        if consecutive_failures >= 5 and consecutive_failures % 5 == 0:
            log.warning(f"Server unreachable ({consecutive_failures} failures). Retrying every {wait}s...")

        time.sleep(wait)

if __name__ == "__main__":
    main()
