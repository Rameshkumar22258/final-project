# PowerShell script to start the backend server
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Starting SwasthyaSetu Backend Server" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
Set-Location -Path "$PSScriptRoot\backend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Start the server
Write-Host "Starting server..." -ForegroundColor Green
Write-Host "IMPORTANT: Keep this window open!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

npm start

