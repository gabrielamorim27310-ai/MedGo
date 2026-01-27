@echo off
echo ====================================
echo    MedGo - Sistema de Saude
echo ====================================
echo.

echo [1/5] Verificando Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker nao esta rodando!
    echo.
    echo Por favor, inicie o Docker Desktop primeiro:
    echo   1. Pressione a tecla Windows
    echo   2. Digite "Docker Desktop"
    echo   3. Aguarde o Docker iniciar completamente
    echo   4. Execute este script novamente
    echo.
    pause
    exit /b 1
)
echo ✅ Docker esta rodando

echo.
echo [2/5] Subindo containers (PostgreSQL + Redis)...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Erro ao subir containers
    pause
    exit /b 1
)
echo ✅ Containers iniciados

echo.
echo [3/5] Aguardando PostgreSQL ficar pronto...
timeout /t 10 /nobreak >nul
echo ✅ PostgreSQL pronto

echo.
echo [4/5] Executando migrations do banco...
call pnpm db:migrate
if %errorlevel% neq 0 (
    echo ❌ Erro nas migrations
    pause
    exit /b 1
)
echo ✅ Migrations concluidas

echo.
echo [5/5] MedGo esta pronto!
echo.
echo ====================================
echo    Proximos Passos
echo ====================================
echo.
echo Abra 3 terminais e execute:
echo.
echo Terminal 1 - API Gateway:
echo   pnpm dev:api
echo.
echo Terminal 2 - Web Dashboard:
echo   pnpm dev:web
echo.
echo Terminal 3 - Analytics:
echo   pnpm dev:analytics
echo.
echo ====================================
echo    URLs dos Servicos
echo ====================================
echo.
echo - Web Dashboard:  http://localhost:3000
echo - API Gateway:    http://localhost:3001
echo - Analytics:      http://localhost:3004
echo - Adminer (DB):   http://localhost:8080
echo.
pause
