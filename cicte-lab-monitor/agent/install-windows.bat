@echo off
:: ─────────────────────────────────────────────────────────────────────
:: CICTE Lab Monitor — Agent Installer (Windows)
:: Run this as Administrator on each lab PC
:: ─────────────────────────────────────────────────────────────────────

echo.
echo ╔══════════════════════════════════════════╗
echo ║  CICTE Lab Monitor — Agent Installer     ║
echo ╚══════════════════════════════════════════╝
echo.

:: ── Configuration (EDIT THESE) ──────────────────────────────────────
set SERVER_URL=http://192.168.1.100:3001
set LAB_ID=cl1
set AGENT_KEY=cicte-agent-2026

:: ── Create install directory ────────────────────────────────────────
set INSTALL_DIR=C:\CICTE
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: ── Copy agent script ───────────────────────────────────────────────
copy /Y "%~dp0agent.py" "%INSTALL_DIR%\agent.py"
echo [OK] Agent copied to %INSTALL_DIR%\agent.py

:: ── Create environment config ───────────────────────────────────────
(
echo set CICTE_SERVER_URL=%SERVER_URL%
echo set CICTE_LAB_ID=%LAB_ID%
echo set CICTE_AGENT_KEY=%AGENT_KEY%
echo python "%INSTALL_DIR%\agent.py"
) > "%INSTALL_DIR%\run-agent.bat"
echo [OK] Created run-agent.bat

:: ── Register Scheduled Task (runs at logon) ─────────────────────────
schtasks /create /tn "CICTE Lab Monitor Agent" ^
  /tr "\"%INSTALL_DIR%\run-agent.bat\"" ^
  /sc onlogon ^
  /rl highest ^
  /f
echo [OK] Scheduled task created (runs at logon)

:: ── Also register a startup task every 5 min in case it crashes ─────
schtasks /create /tn "CICTE Lab Monitor Agent (Watchdog)" ^
  /tr "\"%INSTALL_DIR%\run-agent.bat\"" ^
  /sc minute /mo 5 ^
  /rl highest ^
  /f
echo [OK] Watchdog task created (every 5 min)

echo.
echo ═══════════════════════════════════════════
echo   Installation complete!
echo   Agent will start at next logon.
echo   To start now: %INSTALL_DIR%\run-agent.bat
echo ═══════════════════════════════════════════
echo.

pause
