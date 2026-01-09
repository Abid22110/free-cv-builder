# CV Builder Startup Script for Windows
# Run: .\start.ps1

Write-Host "🚀 Starting CV Builder Application..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodeVersion = $null
try {
    $nodeVersion = node --version 2>$null
} catch {}

if (-not $nodeVersion) {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Please install Node.js first:" -ForegroundColor Yellow
    Write-Host "   1. Visit: https://nodejs.org" -ForegroundColor White
    Write-Host "   2. Download the LTS version (recommended)" -ForegroundColor White
    Write-Host "   3. Run the installer" -ForegroundColor White
    Write-Host "   4. Restart PowerShell after installation" -ForegroundColor White
    Write-Host "   5. Run this script again: .\start.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Set port
$PORT = if ($env:PORT) { $env:PORT } else { "3001" }
$env:PORT = $PORT

Write-Host ""
Write-Host "🌐 Starting server on port $PORT..." -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ CV Builder will be available at:" -ForegroundColor Green
Write-Host "   http://localhost:$PORT" -ForegroundColor White
Write-Host ""
Write-Host "📝 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Start the server
npm start
