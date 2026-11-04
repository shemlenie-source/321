@echo off
chcp 65001 >nul
title Эликса — Помощница Гильдмастера
echo.
echo   ╔══════════════════════════════════════════╗
echo   ║  🖤 Эликса — Помощница Гильдмастера 🖤   ║
echo   ║     Суккуб-бухгалтер гильдии             ║
echo   ╚══════════════════════════════════════════╝
echo.

REM Проверяем есть ли папка dist
if not exist "dist\index.html" (
    echo [!] Папка dist не найдена. Запускаю сборку...
    echo.
    
    REM Проверяем есть ли node_modules
    if not exist "node_modules" (
        echo [!] Устанавливаю зависимости...
        call npm install
        if errorlevel 1 (
            echo.
            echo [ОШИБКА] Не удалось установить зависимости.
            echo Убедитесь что Node.js установлен: https://nodejs.org/
            pause
            exit /b 1
        )
    )
    
    echo [!] Собираю проект...
    call npm run build
    if errorlevel 1 (
        echo.
        echo [ОШИБКА] Не удалось собрать проект.
        pause
        exit /b 1
    )
    echo.
    echo [✓] Сборка завершена!
    echo.
)

echo [✓] Открываю приложение в браузере...
echo.

REM Открываем index.html в браузере по умолчанию
start "" "dist\index.html"

echo.
echo Приложение открыто в браузере.
echo Не закрывайте это окно пока работаете с приложением.
echo.
echo Нажмите любую клавишу для остановки...
pause >nul

echo [✓] Эликса засыпает... Спокойной ночи, Гильдмастер! 🖤
