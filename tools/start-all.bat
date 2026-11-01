@echo off
setlocal EnableExtensions

rem ============================================================
rem start-all.bat - dev launcher for Quest Board RPG
rem
rem Assumes this file lives in <project>\tools\.
rem Root is auto-detected as parent of this folder (%~dp0..),
rem so it works after cloning to any path.
rem
rem Opens:
rem   1) Docker Compose (db + api)
rem   2) Frontend Dev    (optional until Vite is scaffolded)
rem   3) Project Console
rem ============================================================

rem --- Resolve project root (parent of tools\) ---
for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"
cd /d "%PROJECT_ROOT%"
echo [Root] %PROJECT_ROOT%

rem --- 1. Ensure Docker Desktop is running ---
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I "Docker Desktop.exe" >NUL
if not errorlevel 1 (
    echo [Docker] Docker Desktop is already running.
    goto wait_docker
)

echo [Docker] Docker Desktop is not running. Searching...
set "DOCKER_EXE="
set "DOCKER_LNK="

if exist "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe" set "DOCKER_EXE=%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
if not defined DOCKER_EXE if exist "%LOCALAPPDATA%\Docker\Docker Desktop.exe" set "DOCKER_EXE=%LOCALAPPDATA%\Docker\Docker Desktop.exe"
if not defined DOCKER_EXE if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" set "DOCKER_EXE=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
if not defined DOCKER_EXE if exist "%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe" set "DOCKER_EXE=%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe"

if not defined DOCKER_EXE if exist "%USERPROFILE%\Desktop\Docker Desktop.lnk" set "DOCKER_LNK=%USERPROFILE%\Desktop\Docker Desktop.lnk"
if not defined DOCKER_EXE if not defined DOCKER_LNK if exist "%USERPROFILE%\OneDrive\Desktop\Docker Desktop.lnk" set "DOCKER_LNK=%USERPROFILE%\OneDrive\Desktop\Docker Desktop.lnk"
if not defined DOCKER_EXE if not defined DOCKER_LNK if exist "%PUBLIC%\Desktop\Docker Desktop.lnk" set "DOCKER_LNK=%PUBLIC%\Desktop\Docker Desktop.lnk"

if defined DOCKER_EXE (
    echo [Docker] Found: "%DOCKER_EXE%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%DOCKER_EXE%' -Verb RunAs"
) else if defined DOCKER_LNK (
    echo [Docker] Found shortcut: "%DOCKER_LNK%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%DOCKER_LNK%' -Verb RunAs"
) else (
    echo [Docker] Docker Desktop.exe not found.
    echo [Docker] Start Docker Desktop manually, then press any key...
    pause >nul
)

:wait_docker
echo [Docker] Waiting for Docker to be ready...
set /a DOCKER_WAIT=0

:wait_docker_loop
docker info >nul 2>&1
if not errorlevel 1 goto docker_ready

set /a DOCKER_WAIT+=1
if %DOCKER_WAIT% GEQ 60 (
    echo [Docker] Not ready after 120 seconds. Continuing anyway...
    goto docker_ready
)

timeout /t 2 /nobreak >nul
goto wait_docker_loop

:docker_ready
echo [Docker] Ready.

rem --- 2. Backend + DB (inherits CWD = project root) ---
if not exist "%PROJECT_ROOT%\docker-compose.yml" (
    echo [Compose] docker-compose.yml not found at project root. Aborting.
    pause
    endlocal
    exit /b 1
)
start "Docker Compose (backend+db)" cmd /k "docker compose up"

rem --- 3. Frontend (optional) ---
if not exist "%PROJECT_ROOT%\frontend\package.json" (
    echo [Frontend] frontend\package.json not found - skipping.
    echo [Frontend] When ready, run in project root:
    echo            npm create vite@latest frontend -- --template react-ts
    goto after_frontend
)
if not exist "%PROJECT_ROOT%\frontend\node_modules" (
    echo [Frontend] node_modules missing - running npm install first.
    start "Frontend (install + dev)" cmd /k "cd frontend && npm install && npm run dev"
) else (
    start "Frontend Dev" cmd /k "cd frontend && npm run dev"
)

:after_frontend

rem --- 4. Project console ---
start "Project Console" cmd /k

endlocal
