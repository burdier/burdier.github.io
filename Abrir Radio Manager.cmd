@echo off
title Don 3B Radio Manager
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo No encontre Node.js en este equipo.
  echo Instala Node.js y vuelve a abrir este archivo.
  pause
  exit /b 1
)

node "_tools\radio-manager\server.js"
if errorlevel 1 (
  echo.
  echo El administrador se cerro con un error.
  pause
)
