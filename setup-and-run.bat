@echo off
echo ========================================================
echo  EduDocs - Setup and Run
echo ========================================================

:: ── Step 1: Root (hardhat) deps ───────────────────────────
echo.
echo [1/4] Root dependencies (Hardhat + blockchain tools)...
if not exist "node_modules\hardhat" (
    echo  Installing root dependencies...
    call npm install
    if errorlevel 1 (
        echo  ERROR: Root npm install failed. Please retry.
        pause
        exit /b 1
    )
) else (
    echo  [SKIP] Root node_modules already present.
)

:: ── Step 2: Backend deps ──────────────────────────────────
echo.
echo [2/4] Backend dependencies...
if not exist "backend\node_modules\express" (
    echo  Installing backend dependencies...
    cd backend
    call npm install
    if errorlevel 1 (
        echo  ERROR: Backend npm install failed. Please retry.
        cd ..
        pause
        exit /b 1
    )
    cd ..
) else (
    echo  [SKIP] Backend node_modules already present.
)

:: ── Step 3: Verifier-UI deps ──────────────────────────────
echo.
echo [3/4] Verifier-UI dependencies (React + Tailwind)...
if not exist "verifier-ui\node_modules\react" (
    echo  Installing UI dependencies...
    cd verifier-ui
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo  ERROR: UI npm install failed. Please retry.
        cd ..
        pause
        exit /b 1
    )
    cd ..
) else (
    echo  [SKIP] Verifier-UI node_modules already present.
)

:: ── Info banner ───────────────────────────────────────────
echo.
echo ========================================================
echo  REMINDER: Make sure backend\.env exists with:
echo    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
echo    CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
echo    CLOUDINARY_API_SECRET, SMTP_USER, SMTP_PASS
echo ========================================================
echo.

:: ── Step 4: Start everything ─────────────────────────────
echo [4/4] Starting all services (Blockchain + Backend + UI)...
echo.
echo   Blockchain  -^>  http://127.0.0.1:8545
echo   Backend     -^>  http://localhost:3000
echo   UI          -^>  http://localhost:5173
echo.
call npm run start-all

pause
