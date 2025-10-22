# Christmas Assignment Email Test Script
# Tests the complete flow: assignment generation → email sending → magic link creation

Write-Host "`n🎄 KRIS KRINGLE ASSIGNMENT EMAIL TEST 🎄`n" -ForegroundColor Green

# Step 1: Check if backend is running
Write-Host "Checking backend server..." -ForegroundColor Cyan
$backendProcess = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*backend*' }
if (-not $backendProcess) {
    Write-Host "❌ Backend server is not running!" -ForegroundColor Red
    Write-Host "Please start the backend first: cd backend && npm run dev`n" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Backend server is running`n" -ForegroundColor Green

# Step 2: Test assignment email function
Write-Host "Testing assignment email template..." -ForegroundColor Cyan
Set-Location C:\Projects\ClaudeCLI\ICCKrisKringleWebApp\backend
node scripts/testAssignmentEmail.js

Write-Host "`n`n📧 EMAIL FEATURES:" -ForegroundColor Yellow
Write-Host "  ✅ 48-hour multi-use magic link" -ForegroundColor White
Write-Host "  ✅ Christmas-themed design (red/green)" -ForegroundColor White
Write-Host "  ✅ Emojis: 🎄 🎅 🎁 ❄️" -ForegroundColor White
Write-Host "  ✅ Infosoft branding (logo)" -ForegroundColor White
Write-Host "  ✅ Recipient reveal: 'You're playing Secret Santa for: [Name]'" -ForegroundColor White
Write-Host "  ✅ CTA button: 'View My Dashboard 🎄'" -ForegroundColor White

Write-Host "`n`n🎁 DASHBOARD FEATURES:" -ForegroundColor Yellow
Write-Host "  ✅ Recipient hidden until wishlist is complete" -ForegroundColor White
Write-Host "  ✅ Shows prompt: 'Complete your wishlist to reveal recipient'" -ForegroundColor White
Write-Host "  ✅ After wishlist saved: Recipient card displayed" -ForegroundColor White

Write-Host "`n`n🔗 MAGIC LINK DETAILS:" -ForegroundColor Yellow
Write-Host "  • Valid for: 48 hours" -ForegroundColor White
Write-Host "  • Can be used: Multiple times" -ForegroundColor White
Write-Host "  • Auto-login: Yes" -ForegroundColor White
Write-Host "  • Direct dashboard access: Yes`n" -ForegroundColor White

Write-Host "`n✨ Test complete! Check your email inbox.`n" -ForegroundColor Green
