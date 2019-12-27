$config = Get-Content -Path config.json | ConvertFrom-Json
Write-Host $config.S3BucketName

Get-ChildItem "./src" | 
Foreach-Object {
    Write-Host $_.FullName

    Write-S3Object -BucketName "dflo.rocks"  -File $_.FullName -ProfileName DalyasGame -PublicReadOnly
    
}