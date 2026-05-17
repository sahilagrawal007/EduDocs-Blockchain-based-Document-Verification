@echo off
echo ========================================================
echo EduDocs - Setup and Run Script
echo ========================================================

echo.
echo [1/4] Installing dependencies in the root directory...
call npm install

echo.
echo [2/4] Installing dependencies in the backend directory...
cd backend
call npm install
cd ..

echo.
echo [3/4] Installing dependencies in the verifier-ui directory...
cd verifier-ui
call npm install
cd ..

echo.
echo ========================================================
echo IMPORTANT: Please ensure you have created a `.env` file 
echo in the `backend/` directory with your Supabase credentials:
echo SUPABASE_URL=your_url
echo SUPABASE_SERVICE_ROLE_KEY=your_key
echo ========================================================
echo.

echo [4/4] Starting all services (Blockchain, Backend, UI)...
call npm run start-all

pause
