# Quick API Key Setup Script
Write-Host "🔑 OpenAI API Key Setup" -ForegroundColor Cyan
Write-Host ""

$apiKey = Read-Host "Enter your OpenAI API Key (starts with sk-)"

if ($apiKey -match "^sk-") {
    $envContent = Get-Content ".env" -Raw
    $newContent = $envContent -replace "OPENAI_API_KEY=.*", "OPENAI_API_KEY=$apiKey"
    Set-Content ".env" -Value $newContent

    Write-Host ""
    Write-Host "✅ API Key saved!" -ForegroundColor Green
    Write-Host "🔄 Restarting server..." -ForegroundColor Yellow

    # Stop any running node processes
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

    # Start server
    Start-Process -FilePath "C:\Program Files\nodejs\node.exe" -ArgumentList "server.js" -NoNewWindow

    Write-Host ""
    Write-Host "🎉 Server restarted with AI enabled!" -ForegroundColor Green
    Write-Host "🌐 Open: http://localhost:3001" -ForegroundColor White
    Write-Host "🤖 AI Helper should now work!" -ForegroundColor White

} else {
    Write-Host "❌ Invalid API key format. Should start with 'sk-'" -ForegroundColor Red
}

Read-Host "Press Enter to exit"