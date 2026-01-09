@echo off
echo 🔑 OpenAI API Key Setup
echo.

set /p apiKey="Enter your OpenAI API Key (starts with sk-): "

echo %apiKey% | findstr /r "^sk-" >nul
if %errorlevel% neq 0 (
    echo ❌ Invalid API key format. Should start with 'sk-'
    pause
    exit /b 1
)

powershell -Command "(Get-Content '.env') -replace 'OPENAI_API_KEY=.*', 'OPENAI_API_KEY=%apiKey%' | Set-Content '.env'"

echo.
echo ✅ API Key saved!
echo 🔄 Restarting server...

taskkill /f /im node.exe >nul 2>&1

start "" "C:\Program Files\nodejs\node.exe" server.js

echo.
echo 🎉 Server restarted with AI enabled!
echo 🌐 Open: http://localhost:3001
echo 🤖 AI Helper should now work!

pause