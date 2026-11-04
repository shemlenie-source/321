@echo off
title Elixa - Guildmaster Assistant
echo.
echo   Opening Elixa in browser...
echo.

if exist "dist\index.html" (
    start "" "dist\index.html"
    echo [OK] App opened!
) else (
    echo [ERROR] dist\index.html not found!
    echo Please download the project again from GitHub.
)

echo.
pause
