@echo off
chcp 65001 >nul
title Elixa - Guildmaster Assistant
echo.
echo   Elixa - Guildmaster Assistant
echo   =============================
echo.

REM Check if dist folder exists
if not exist "dist\index.html" (
    echo [!] dist folder not found. Starting build...
    echo.
    
    REM Check if node is installed
    where node >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Node.js is not installed!
        echo.
        echo Please download and install Node.js from:
        echo https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
    
    REM Install dependencies
    if not exist "node_modules" (
        echo [!] Installing dependencies...
        call npm install
        if errorlevel 1 (
            echo [ERROR] Failed to install dependencies.
            pause
            exit /b 1
        )
    )
    
    echo [!] Building project...
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Failed to build project.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Build complete!
    echo.
)

echo [OK] Opening app in browser...
echo.

REM Open index.html in default browser
start "" "%~dp0dist\index.html"

echo.
echo App opened in browser.
echo Press any key to close this window...
pause >nul
