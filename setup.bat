@echo off
echo 🚀 CV Builder Setup Helper
echo.

echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔑 Checking OpenAI API Key...
if not exist .env (
    echo Creating .env file...
    copy .env.example .env >nul
)

findstr /C:"OPENAI_API_KEY=sk-" .env >nul
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  OpenAI API Key not configured!
    echo.
    echo To enable AI features:
    echo 1. Get your FREE API key from: https://platform.openai.com/api-keys
    echo 2. Edit the .env file and replace 'your_openai_api_key_here' with your actual key
    echo 3. Your key should start with 'sk-' and be about 50 characters long
    echo.
    echo The app will still work without AI, but AI features will be disabled.
    echo.
    pause
) else (
    echo ✅ OpenAI API Key configured
)

echo.
echo 🌐 Starting server...
echo Access the app at: http://localhost:3001
echo.
npm start