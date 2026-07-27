# PowerShell에서 scripts/update-from-template.sh를 실행하기 위한 래퍼입니다.
# 실제 로직은 전부 update-from-template.sh에 있고, 여기서는 Git for Windows와
# 함께 설치되는 bash.exe를 찾아 그대로 위임 실행합니다.
#
# 사용법:
#   scripts/update-from-template.ps1
#   scripts/update-from-template.ps1 -TemplateUrl https://github.com/baenong/gov-guide-kit.git -TemplateBranch main

param(
    [string]$TemplateUrl = "https://github.com/baenong/gov-guide-kit.git",
    [string]$TemplateBranch = "main"
)

$ErrorActionPreference = "Stop"

# 주의: PATH에 있는 bash.exe를 그냥 찾으면 Git Bash가 아니라
# C:\Windows\System32\bash.exe (WSL 실행기)가 먼저 잡히는 경우가 흔하다.
# WSL이 설정되어 있지 않으면 이 스크립트는 그 bash에서 바로 실패한다.
# 그래서 git.exe 설치 위치를 기준으로 Git Bash를 먼저 찾는다.
$bashPath = $null

$gitCommand = Get-Command git.exe -ErrorAction SilentlyContinue
if ($gitCommand) {
    # git.exe는 보통 <Git 설치 루트>\cmd\git.exe 에 있고, bash.exe는
    # 같은 루트의 \bin\bash.exe 에 있다.
    $gitRoot = Split-Path -Parent (Split-Path -Parent $gitCommand.Source)
    $candidate = Join-Path $gitRoot "bin\bash.exe"
    if (Test-Path $candidate) {
        $bashPath = $candidate
    }
}

if (-not $bashPath) {
    foreach ($candidate in @(
            (Join-Path $env:ProgramFiles "Git\bin\bash.exe"),
            (Join-Path ${env:ProgramFiles(x86)} "Git\bin\bash.exe"),
            (Join-Path $env:LocalAppData "Programs\Git\bin\bash.exe")
        )) {
        if ($candidate -and (Test-Path $candidate)) {
            $bashPath = $candidate
            break
        }
    }
}

if (-not $bashPath) {
    Write-Error "Git Bash(bash.exe)를 찾을 수 없습니다. Git for Windows가 설치되어 있는지 확인해주세요. (https://git-scm.com/download/win)"
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$shScript = Join-Path $scriptDir "update-from-template.sh"

if (-not (Test-Path $shScript)) {
    Write-Error "update-from-template.sh를 찾을 수 없습니다: $shScript"
    exit 1
}

& $bashPath $shScript $TemplateUrl $TemplateBranch
exit $LASTEXITCODE
