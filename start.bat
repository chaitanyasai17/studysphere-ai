@echo off
title StudySphere AI Starter
echo ===================================================
echo Starting StudySphere AI Platform...
echo ===================================================

:: Start Backend Server
echo [1/2] Launching Python Flask Backend Server...
start "StudySphere Backend API" cmd /k "cd backend && python run.py"

:: Start Frontend Client
echo [2/2] Launching React Vite Frontend Client...
start "StudySphere Frontend Client" cmd /k "cd frontend && npm run dev"

echo ===================================================
echo System started successfully!
echo.
echo - Web Client URL: http://localhost:5173
echo - Backend API URL: http://localhost:5000
echo ===================================================
pause
