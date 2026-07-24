param([int]$IntervalSeconds = 3600)

$projectPath = Split-Path -Parent $PSScriptRoot
Set-Location $projectPath

$versionFile = "version.txt"

# Если файла нет — создаём с начальной версии
if (!(Test-Path $versionFile)) {
    "2.0.1" | Out-File $versionFile -Encoding utf8
}

function Increment-Version($version) {
    $parts = $version.Split(".")
    $parts[2] = [int]$parts[2] + 1
    return "$($parts[0]).$($parts[1]).$($parts[2])"
}

while ($true) {
    $changes = git status --porcelain

    if ($changes) {
        $currentVersion = Get-Content $versionFile
        $newVersion = Increment-Version $currentVersion

        $newVersion | Out-File $versionFile -Encoding utf8

        git add --all
        git commit -m "autorelease: v$newVersion"
        git push origin main
    }

    Start-Sleep -Seconds $IntervalSeconds
}