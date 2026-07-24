# Автоматически сохраняет изменения проекта в подключённый GitHub-репозиторий.
# Запустите в отдельной консоли: powershell -ExecutionPolicy Bypass -File scripts\auto-commit.ps1
param([int]$IntervalSeconds = 30)

$projectPath = Split-Path -Parent $PSScriptRoot
Set-Location $projectPath

while ($true) {
    $changes = git status --porcelain

    if ($changes) {
        git add --all
        git commit -m "auto: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git push origin main
    }

    Start-Sleep -Seconds $IntervalSeconds
}
