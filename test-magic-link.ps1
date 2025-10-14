$testEmail = "charles.daitol@infosoft.com.ph"
$body = @{ email = $testEmail } | ConvertTo-Json

Write-Host ""
Write-Host "=== Testing Magic Link Flow ===" -ForegroundColor Cyan
Write-Host "Test email: $testEmail" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/magic-link" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host ""
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Server message: $($errorObj.message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================="
Write-Host ""
