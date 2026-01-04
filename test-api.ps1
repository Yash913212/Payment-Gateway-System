# Test API error format
Write-Host "Testing API error response format..."

# Test 1: Missing auth headers
Write-Host "`n1. Testing missing auth headers:"
try {
    $response = [System.Net.HttpWebRequest]::Create("http://localhost:8080/api/v1/orders")
    $response.Method = "GET"
    $webResponse = $response.GetResponse()
    $reader = [System.IO.StreamReader]::new($webResponse.GetResponseStream())
    $content = $reader.ReadToEnd()
    Write-Host "SUCCESS: $content"
} catch {
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $content = $reader.ReadToEnd()
    Write-Host "ERROR RESPONSE: $content"
    $jsonResponse = $content | ConvertFrom-Json
    if ($jsonResponse.error) {
        Write-Host "✓ Error format is CORRECT: error object exists"
        Write-Host "  Code: $($jsonResponse.error.code)"
        Write-Host "  Description: $($jsonResponse.error.description)"
    } else {
        Write-Host "✗ Error format is WRONG: missing error wrapper"
    }
}

# Test 2: Invalid credentials
Write-Host "`n2. Testing invalid credentials:"
try {
    $request = [System.Net.HttpWebRequest]::Create("http://localhost:8080/api/v1/orders")
    $request.Method = "GET"
    $request.Headers.Add("X-Api-Key", "wrong_key")
    $request.Headers.Add("X-Api-Secret", "wrong_secret")
    $webResponse = $request.GetResponse()
    $reader = [System.IO.StreamReader]::new($webResponse.GetResponseStream())
    $content = $reader.ReadToEnd()
    Write-Host "SUCCESS: $content"
} catch {
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $content = $reader.ReadToEnd()
    Write-Host "ERROR RESPONSE: $content"
    $jsonResponse = $content | ConvertFrom-Json
    if ($jsonResponse.error) {
        Write-Host "✓ Error format is CORRECT: error object exists"
        Write-Host "  Code: $($jsonResponse.error.code)"
        Write-Host "  Description: $($jsonResponse.error.description)"
    } else {
        Write-Host "✗ Error format is WRONG: missing error wrapper"
    }
}

# Test 3: Valid credentials, non-existent endpoint
Write-Host "`n3. Testing non-existent endpoint:"
try {
    $request = [System.Net.HttpWebRequest]::Create("http://localhost:8080/api/v1/nonexistent")
    $request.Method = "GET"
    $request.Headers.Add("X-Api-Key", "key_test_abc123")
    $request.Headers.Add("X-Api-Secret", "secret_test_xyz789")
    $webResponse = $request.GetResponse()
    $reader = [System.IO.StreamReader]::new($webResponse.GetResponseStream())
    $content = $reader.ReadToEnd()
    Write-Host "SUCCESS: $content"
} catch {
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $content = $reader.ReadToEnd()
    Write-Host "ERROR RESPONSE: $content"
    $jsonResponse = $content | ConvertFrom-Json
    if ($jsonResponse.error) {
        Write-Host "✓ Error format is CORRECT: error object exists"
        Write-Host "  Code: $($jsonResponse.error.code)"
        Write-Host "  Description: $($jsonResponse.error.description)"
    } else {
        Write-Host "✗ Error format is WRONG: missing error wrapper"
    }
}

# Test 4: Health check endpoint
Write-Host "`n4. Testing health endpoint:"
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get
    Write-Host "✓ Health check passed:"
    $response | ConvertTo-Json | Write-Host
} catch {
    Write-Host "✗ Health check failed: $_"
}

Write-Host "`n`nTest completed."
