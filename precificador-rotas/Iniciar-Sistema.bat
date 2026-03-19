@echo off
setlocal

REM Vai para a pasta deste arquivo
cd /d "%~dp0"

echo ========================================
echo Iniciando Sistema de Precificacao de Rotas
echo ========================================
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

echo Abrindo sistema em http://localhost:5173/
start "" "http://localhost:5173/"
echo.

echo Iniciando servidor...
call npm run dev

if errorlevel 1 (
  echo.
  echo Erro ao iniciar o sistema.
  pause
)
