@echo off
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
    echo Node.js nao encontrado. Instale em https://nodejs.org e tente de novo.
    goto fim
)

if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if errorlevel 1 goto erro
)

rem Abre o navegador alguns segundos depois, quando o servidor ja estiver de pe.
start "" /b cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:3000"
call npm run dev
goto fim

:erro
echo.
echo Falha ao instalar as dependencias. Veja a mensagem acima.

:fim
pause
