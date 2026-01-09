# CV Builder Setup Script for PowerShell
Write-Host "🚀 CV Builder Setup Helper" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🔑 Checking OpenAI API Key..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "OPENAI_API_KEY=sk-") {
    Write-Host ""
    Write-Host "⚠️  OpenAI API Key not configured!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To enable AI features:" -ForegroundColor White
    Write-Host "1. Get your FREE API key from: https://platform.openai.com/api-keys" -ForegroundColor White
    Write-Host "2. Edit the .env file and replace 'your_openai_api_key_here' with your actual key" -ForegroundColor White
    Write-Host "3. Your key should start with 'sk-' and be about 50 characters long" -ForegroundColor White
    Write-Host ""
    Write-Host "The app will still work without AI, but AI features will be disabled." -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to continue"
} else {
    Write-Host "✅ OpenAI API Key configured" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌐 Starting server..." -ForegroundColor Cyan
Write-Host "Access the app at: http://localhost:3001" -ForegroundColor White
Write-Host ""
npm start