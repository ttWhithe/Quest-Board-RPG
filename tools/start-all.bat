@echo off
setlocal EnableExtensions
cd /d "%~dp0..\"

rem === 1. Start Docker Desktop as administrator if not already running ===
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

if defined DOCKER_EXE (
    echo [Docker] Found: "%DOCKER_EXE%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%DOCKER_EXE%' -Verb RunAs"
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

start "Docker Compose (Quest)" cmd /k "docker compose up"
start "Frontend Dev (Quest)"  cmd /k "cd frontend && npm run dev"
start "Project Console" cmd /k

endlocal
