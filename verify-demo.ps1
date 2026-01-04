#!/usr/bin/env powershell

Write-Host "=== Demo Transaction Verification ===" -ForegroundColor Green
Write-Host ""

# Test merchant credentials
$headers = @{
    "X-Api-Key" = "key_test_abc123"
    "X-Api-Secret" = "secret_test_xyz789"
    "Content-Type" = "application/json"
}

# Verify API is up
Write-Host "1. Checking API health..."
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get
    Write-Host "   OK - API is running"
    Write-Host "   Status: $($health.status), Database: $($health.database)"
} catch {
    Write-Host "   ERROR - API is not responding"
    exit 1
}

# Get test merchant
Write-Host ""
Write-Host "2. Checking test merchant..."
try {
    $merchant = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/test/merchant" -Method Get -Headers $headers
    Write-Host "   OK - Test merchant found"
    Write-Host "   Email: $($merchant.email)"
    Write-Host "   API Key: $($merchant.api_key)"
} catch {
    Write-Host "   ERROR - Failed to get test merchant"
}

# Get all orders
Write-Host ""
Write-Host "3. Checking demo orders..."
try {
    $orders = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders" -Method Get -Headers $headers
    if ($orders -and $orders.Count -gt 0) {
        Write-Host "   OK - Orders found: $($orders.Count)"
        foreach ($order in $orders | Where-Object { $_.id -like 'order_demo*' }) {
            Write-Host "   Demo Order ID: $($order.id)"
            Write-Host "   - Amount: $($order.amount / 100)"
            Write-Host "   - Currency: $($order.currency)"
            Write-Host "   - Status: $($order.status)"
            Write-Host "   - Created: $($order.created_at)"
        }
    } else {
        Write-Host "   ERROR - No orders found"
    }
} catch {
    Write-Host "   ERROR - Failed to get orders: $_"
}

Write-Host ""
Write-Host "=== Verification Complete ===" -ForegroundColor Green
