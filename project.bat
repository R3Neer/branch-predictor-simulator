@echo off
setlocal

cd /d "%~dp0"

if "%~1"=="" goto start
if /i "%~1"=="help" goto help
if /i "%~1"=="start" goto start
if /i "%~1"=="install" goto install
if /i "%~1"=="dev" goto dev
if /i "%~1"=="test" goto test
if /i "%~1"=="e2e" goto e2e
if /i "%~1"=="lint" goto lint
if /i "%~1"=="build" goto build
if /i "%~1"=="audit" goto audit
if /i "%~1"=="check" goto check
if /i "%~1"=="release" goto release
if /i "%~1"=="clean" goto clean

echo Unknown command: %~1
echo.
goto help

:help
echo Branch Predictor Simulator
echo.
echo Double-click this file or run `project.bat start` to build and open the app.
echo Keep the terminal open while using the local preview server.
echo.
echo Usage:
echo   project.bat start     Build, open the browser, and serve the app
echo   project.bat install   Install dependencies
echo   project.bat dev       Start the local Vite dev server
echo   project.bat test      Run unit and integration tests
echo   project.bat e2e       Run Playwright end-to-end tests
echo   project.bat lint      Run ESLint
echo   project.bat build     Build the production app
echo   project.bat audit     Run npm audit
echo   project.bat check     Run test, e2e, lint, build, and audit
echo   project.bat release   Run install and full release checks
echo   project.bat clean     Remove generated build and test artifacts
echo.
exit /b 0

:start
echo Building the production app...
call npm.cmd run build
if errorlevel 1 (
  echo.
  echo Build failed. Press any key to close this window.
  pause >nul
  exit /b 1
)
echo.
echo Opening http://127.0.0.1:4173
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:4173'"
echo.
echo Serving the built app. Keep this terminal open while using the simulator.
echo Press Ctrl+C to stop the server.
echo.
call npm.cmd run preview -- --host 127.0.0.1 --port 4173
exit /b %errorlevel%

:install
call npm.cmd install
exit /b %errorlevel%

:dev
call npm.cmd run dev
exit /b %errorlevel%

:test
call npm.cmd test
exit /b %errorlevel%

:e2e
call npm.cmd run test:e2e
exit /b %errorlevel%

:lint
call npm.cmd run lint
exit /b %errorlevel%

:build
call npm.cmd run build
exit /b %errorlevel%

:audit
call npm.cmd audit
exit /b %errorlevel%

:check
call npm.cmd test
if errorlevel 1 exit /b %errorlevel%
call npm.cmd run test:e2e
if errorlevel 1 exit /b %errorlevel%
call npm.cmd run lint
if errorlevel 1 exit /b %errorlevel%
call npm.cmd run build
if errorlevel 1 exit /b %errorlevel%
call npm.cmd audit
exit /b %errorlevel%

:release
call npm.cmd install
if errorlevel 1 exit /b %errorlevel%
call "%~f0" check
exit /b %errorlevel%

:clean
for %%D in (dist build coverage test-results playwright-report .vite tmp temp .tmp) do (
  if exist "%%D" rmdir /s /q "%%D"
)
del /q *.tsbuildinfo 2>nul
del /q *.log 2>nul
del /q npm-debug.log* 2>nul
del /q yarn-debug.log* 2>nul
del /q yarn-error.log* 2>nul
del /q pnpm-debug.log* 2>nul
echo Generated artifacts removed.
exit /b 0
