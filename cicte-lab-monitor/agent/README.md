# CICTE Lab Monitor — PC Agent

A lightweight Python agent that runs on each lab PC and automatically reports its status to the monitoring server.

## What It Does

Every 30 seconds, the agent sends a **heartbeat** containing:
- Hostname, IP address, MAC address
- OS name & build number
- CPU, RAM, storage info
- Currently logged-in user
- Timestamp

The server uses this to:
- **Auto-detect online/offline status** (no heartbeat for 90s → offline → `maintenance`)
- **Auto-populate hardware specs** (no manual entry needed)
- **Track which student is using which PC** in real-time
- **Update the dashboard automatically** via Socket.io

## Requirements

- **Python 3.8+** (pre-installed on most school PCs)
- No external packages needed (uses only stdlib)

## Quick Start

```bash
# Set environment variables
export CICTE_SERVER_URL=http://192.168.1.100:3001
export CICTE_LAB_ID=cl1
export CICTE_PC_NUM=5        # optional, auto-detected from hostname

# Run
python agent.py
```

## Windows Installation (Recommended)

1. Edit `install-windows.bat` — set your server IP and lab ID
2. Copy the `agent/` folder to a USB drive
3. On each lab PC, run `install-windows.bat` **as Administrator**
4. The agent will auto-start at every logon

### What the installer does:
- Copies `agent.py` to `C:\CICTE\`
- Creates a run script with your config
- Registers a Windows Scheduled Task (runs at logon)
- Creates a watchdog task (restarts every 5 min if crashed)

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CICTE_SERVER_URL` | `http://localhost:3001` | Monitoring server URL |
| `CICTE_LAB_ID` | `cl1` | Lab ID (cl1-cl5, nl1, sl1, sl2, emc) |
| `CICTE_PC_NUM` | *(auto)* | PC number; auto-detected from hostname |
| `CICTE_AGENT_KEY` | `cicte-agent-2026` | Shared auth key |
| `CICTE_INTERVAL` | `30` | Heartbeat interval in seconds |

## PC Number Auto-Detection

If `CICTE_PC_NUM` is not set, the agent extracts the number from the hostname:
- `CL1-PC05` → PC 5
- `LAB-PC12` → PC 12
- `DESKTOP-3` → PC 3

**Tip:** Rename each lab PC's hostname to match (e.g., `CL1-PC01` through `CL1-PC31`).

## Deployment Checklist

- [ ] Set each PC's hostname to `{LAB}-PC{NUM}` format
- [ ] Install Python 3.8+ on all PCs
- [ ] Edit `install-windows.bat` with your server IP
- [ ] Run installer on each PC as Administrator
- [ ] Verify PCs appear as "online" on the dashboard

## Troubleshooting

| Issue | Fix |
|---|---|
| "Server unreachable" | Check firewall allows outbound HTTP to server IP:3001 |
| Wrong PC number | Set `CICTE_PC_NUM` explicitly or rename hostname |
| Agent won't start | Check Python is on PATH: `python --version` |
| Duplicate PCs | Each PC must have a unique hostname within its lab |
