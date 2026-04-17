@echo off
REM KN-Logistics Vercel Environment Setup Script
REM Sets up all required environment variables in Vercel
REM Works on Windows

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  KN-Logistics Vercel Environment Setup                        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
    if errorlevel 1 (
        echo ❌ Failed to install Vercel CLI
        exit /b 1
    )
)

REM Check if logged in to Vercel
echo 🔐 Checking Vercel authentication...
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo 📝 Please log in to Vercel:
    vercel login
    if errorlevel 1 (
        echo ❌ Failed to authenticate with Vercel
        exit /b 1
    )
)

echo.
echo 📋 This script will set environment variables for your Vercel project.
echo.

REM Firebase Configuration
echo Enter your Firebase credentials:
echo (You can find these in Firebase Console ^> Project Settings ^> Service Accounts)
echo.

set /p FIREBASE_API_KEY="Firebase API Key: "
set /p FIREBASE_AUTH_DOMAIN="Firebase Auth Domain (e.g., project.firebaseapp.com): "
set /p FIREBASE_PROJECT_ID="Firebase Project ID: "
set /p FIREBASE_STORAGE_BUCKET="Firebase Storage Bucket (e.g., project.appspot.com): "
set /p FIREBASE_MESSAGING_SENDER_ID="Firebase Messaging Sender ID (can be empty): "
set /p FIREBASE_APP_ID="Firebase App ID (can be empty): "

REM Admin Configuration
echo.
set /p ADMIN_PASSWORD="Admin Password: "

REM Confirm before setting
echo.
echo 📝 Will set the following environment variables:
echo    * VITE_FIREBASE_API_KEY
echo    * VITE_FIREBASE_AUTH_DOMAIN
echo    * VITE_FIREBASE_PROJECT_ID
echo    * VITE_FIREBASE_STORAGE_BUCKET
echo    * VITE_FIREBASE_MESSAGING_SENDER_ID
echo    * VITE_FIREBASE_APP_ID
echo    * VITE_ADMIN_PASSWORD
echo.

set /p CONFIRM="Continue? (Y/N): "
if /i not "%CONFIRM%"=="y" (
    echo ❌ Cancelled.
    exit /b 1
)

REM Set environment variables
echo.
echo 🚀 Setting environment variables in Vercel...
echo.

REM Create temporary file for input
for /f "delims=" %%A in ('echo %FIREBASE_API_KEY%') do (
    vercel env add VITE_FIREBASE_API_KEY
    if errorlevel 1 goto error
    echo ✅ VITE_FIREBASE_API_KEY
)

for /f "delims=" %%A in ('echo %FIREBASE_AUTH_DOMAIN%') do (
    vercel env add VITE_FIREBASE_AUTH_DOMAIN
    if errorlevel 1 goto error
    echo ✅ VITE_FIREBASE_AUTH_DOMAIN
)

for /f "delims=" %%A in ('echo %FIREBASE_PROJECT_ID%') do (
    vercel env add VITE_FIREBASE_PROJECT_ID
    if errorlevel 1 goto error
    echo ✅ VITE_FIREBASE_PROJECT_ID
)

for /f "delims=" %%A in ('echo %FIREBASE_STORAGE_BUCKET%') do (
    vercel env add VITE_FIREBASE_STORAGE_BUCKET
    if errorlevel 1 goto error
    echo ✅ VITE_FIREBASE_STORAGE_BUCKET
)

for /f "delims=" %%A in ('echo %FIREBASE_MESSAGING_SENDER_ID%') do (
    vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
    if errorlevel 1 goto error
    echo ✅ VITE_FIREBASE_MESSAGING_SENDER_ID
)

for /f "delims=" %%A in ('echo %FIREBASE_APP_ID%') do (
    vercel env add VITE_FIREBASE_APP_ID
    if errorlevel 1 goto error
    echo ✅ VITE_FIREBASE_APP_ID
)

for /f "delims=" %%A in ('echo %ADMIN_PASSWORD%') do (
    vercel env add VITE_ADMIN_PASSWORD
    if errorlevel 1 goto error
    echo ✅ VITE_ADMIN_PASSWORD
)

echo.
echo ✅ Environment variables set successfully!
echo.
echo 🔄 Redeploying to apply changes...
call vercel --prod
if errorlevel 1 goto error

goto success

:error
echo.
echo ❌ Error setting environment variables. Check the output above.
exit /b 1

:success
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  ✅ Setup Complete!                                           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Your app is now live with environment variables configured.
echo.
echo 📊 View your project: vercel dashboard
echo 🌐 Open your app: (check Vercel output above)
echo.
pause
