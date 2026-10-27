@echo off
setlocal
title KJK Online - Kiralynok Utvesztoje
chcp 65001 >nul
if not exist "%~dp0scripts\start-windows.ps1" (
  echo Eloszor csomagold ki a TELJES ZIP-et egy mappaba.
  echo Utana a kicsomagolt INDITAS.cmd fajlra kattints duplan.
  pause
  exit /b 1
)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-windows.ps1"
set "KJK_EXIT_CODE=%ERRORLEVEL%"
if not "%KJK_EXIT_CODE%"=="0" (
  echo.
  echo Az inditas nem sikerult. A fenti hiba szoveget kuldd el a segitseghez.
  pause
)
exit /b %KJK_EXIT_CODE%
