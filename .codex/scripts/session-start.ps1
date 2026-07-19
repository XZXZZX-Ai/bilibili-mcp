$ErrorActionPreference = "SilentlyContinue"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$MemoryRoot = Join-Path $Root "docs\agent-memory"

function Write-Section {
    param([string]$Title)
    Write-Output ""
    Write-Output "## $Title"
}

function Write-Preview {
    param(
        [string]$Path,
        [string]$Title,
        [int]$MaxLines = 40
    )

    if (Test-Path -LiteralPath $Path) {
        Write-Section $Title
        Get-Content -LiteralPath $Path -Encoding UTF8 -TotalCount $MaxLines
    }
}

Write-Output "# bilibili-mcp hook context"
Write-Output "Repository: $Root"

$Branch = git -C $Root branch --show-current 2>$null
if ($Branch) {
    Write-Output "Branch: $Branch"
}

Write-Section "Git Status"
$Status = git -C $Root status --short 2>$null
if ($Status) {
    $Status | Select-Object -First 80
} else {
    Write-Output "Clean or git status unavailable."
}

Write-Section "Active Work"
$Tracker = Join-Path $Root ".codex\scripts\plan_tracker.py"
if (Test-Path -LiteralPath $Tracker) {
    python $Tracker 2>$null
} else {
    Write-Output "docs/agent-memory/active-work.md"
}

Write-Preview (Join-Path $MemoryRoot "README.md") "Memory README" 35
Write-Preview (Join-Path $MemoryRoot "project-facts.md") "Project Facts" 50
Write-Preview (Join-Path $MemoryRoot "decisions.md") "Decisions" 50
Write-Preview (Join-Path $MemoryRoot "lessons-learned.md") "Lessons Learned" 50
Write-Preview (Join-Path $MemoryRoot "context-budget-report.md") "Context Budget" 40
Write-Preview (Join-Path $MemoryRoot "pending-learning-proposals.md") "Pending Learning Proposals" 40

Write-Output ""
Write-Output "Hook note: runtime observations are candidates only. Do not promote them to docs/agent-memory without review."
