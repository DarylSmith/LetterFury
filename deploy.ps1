$config = Get-Content -Path config.json | ConvertFrom-Json


Get-ChildItem  -Path "./src" -Recurse -Attributes !Directory | 
Foreach-Object {

    $key = [regex]::Match($_.FullName, "src\\(.*)").Groups[1].Value;
    Write-Host $key

    Write-S3Object -BucketName $config.S3BucketName  -File $_.FullName -Key $key -ProfileName DalyasGame -PublicReadOnly
    
}