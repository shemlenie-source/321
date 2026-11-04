#!/bin/bash

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  🖤 Эликса — Помощница Гильдмастера 🖤   ║"
echo "  ║     Суккуб-бухгалтер гильдии             ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# Проверяем есть ли папка dist
if [ ! -f "dist/index.html" ]; then
    echo "[!] Папка dist не найдена. Запускаю сборку..."
    echo ""
    
    # Проверяем есть ли node_modules
    if [ ! -d "node_modules" ]; then
        echo "[!] Устанавливаю зависимости..."
        npm install
        if [ $? -ne 0 ]; then
            echo ""
            echo "[ОШИБКА] Не удалось установить зависимости."
            echo "Убедитесь что Node.js установлен: https://nodejs.org/"
            exit 1
        fi
    fi
    
    echo "[!] Собираю проект..."
    npm run build
    if [ $? -ne 0 ]; then
        echo ""
        echo "[ОШИБКА] Не удалось собрать проект."
        exit 1
    fi
    echo ""
    echo "[✓] Сборка завершена!"
    echo ""
fi

echo "[✓] Открываю приложение в браузере..."
echo ""

# Открываем index.html в браузере по умолчанию
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "dist/index.html"
else
    # Linux
    xdg-open "dist/index.html"
fi

echo ""
echo "Приложение открыто в браузере."
echo "Не закрывайте это окно пока работаете с приложением."
echo ""
echo "Нажмите любую клавишу для остановки..."
read -n 1 -s

echo ""
echo "[✓] Эликса засыпает... Спокойной ночи, Гильдмастер! 🖤"
