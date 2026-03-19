@echo off
setlocal

REM Vai para a pasta deste arquivo
cd /d "%~dp0"

echo ==============================================
echo Iniciando em nova janela - Precificador Rotas
echo ==============================================
echo.

REM Instala dependencias apenas se node_modules nao existir
if not exist "node_modules" (
  echo Instalando dependencias ^(primeira execucao^)...
  call npm install --legacy-peer-deps
  if errorlevel 1 (
    echo.
    echo Erro ao instalar dependencias.
    pause
    exit /b 1
  )
)

echo Abrindo navegador em http://localhost:5173/
start "" "http://localhost:5173/"
echo.

echo Abrindo servidor em nova janela...
start "Precificador - Dev Server" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%~dp0'; npm run dev"

echo Pronto. Pode fechar esta janela.
