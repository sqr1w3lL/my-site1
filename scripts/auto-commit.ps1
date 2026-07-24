# Открыть PowerShell
# cd "C:\Program Files\NodeJs\my-site-4"
#  powershell -ExecutionPolicy Bypass -File scripts\auto-commit.ps1 -IntervalSeconds 60

param([int]$IntervalSeconds = 60)

$projectPath = Split-Path -Parent $PSScriptRoot
Set-Location $projectPath

$versionFile = "version.txt"

# Если файла нет — создаём с начальной версии
if (!(Test-Path $versionFile)) {
    "1.0.2" | Out-File $versionFile -Encoding utf8
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
        git commit -m "release: v$newVersion"
        git push origin main
    }

    Start-Sleep -Seconds $IntervalSeconds
}
