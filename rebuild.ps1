# 🔄 **COMPLETE REBUILD SCRIPT**

Write-Host "Stopping any running processes..." -ForegroundColor Yellow

# Kill any Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Waiting for processes to close..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Removing build artifacts..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "Reinstalling dependencies..." -ForegroundColor Cyan
npm install

Write-Host "`nRebuild complete! Now run: npm run dev" -ForegroundColor Green
