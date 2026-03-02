# Ralph Agent Loop Script for GitHub Copilot CLI (PowerShell)
# Continuously runs Copilot CLI on a task until completion criteria is met
# Usage: .\ralph-loop.ps1 <job-name>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$JobName
)

# Configuration (can be overridden via environment variables)
$MaxIterations = if ($env:MAX_ITERATIONS) { [int]$env:MAX_ITERATIONS } else { 100 }
$ModelName = if ($env:MODEL_NAME) { $env:MODEL_NAME } else { "claude-opus-4.5" }
$CopilotArgs = if ($env:COPILOT_ARGS) { $env:COPILOT_ARGS } else { "--yolo" }
$JobDir = if ($env:JOB_DIR) { $env:JOB_DIR } else { Join-Path "." "ralph-jobs" $JobName }

# Resolve to absolute path
$JobDir = [System.IO.Path]::GetFullPath($JobDir)

# Job-specific paths
$PromptFile = Join-Path $JobDir "prompt.md"
$StopHook = Join-Path $JobDir "stop-hook.ps1"
$SessionDir = Join-Path $JobDir "sessions"
$ChecklistFile = Join-Path $JobDir "checklist.json"

# Create job directory structure
New-Item -ItemType Directory -Path $JobDir -Force | Out-Null
New-Item -ItemType Directory -Path $SessionDir -Force | Out-Null

# Check if prompt file exists - do this FIRST before setting up loop
if (-not (Test-Path $PromptFile)) {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host " New Job: $JobName" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Job directory created at: $JobDir"
    Write-Host ""
    Write-Host "Let's create a plan for this job..."
    Write-Host ""

    # Run copilot in interactive mode to help create the job plan
    $setupPrompt = @"
I need to create a new Ralph agent job called '$JobName'. Please help me create:
1. A prompt.md file at $PromptFile with the task description
2. A stop-hook.ps1 file at $StopHook that checks completion criteria
3. Any other files needed in $JobDir
The job structure:
- $PromptFile`: Main task description/instructions for the agent
- $StopHook`: PowerShell script that exits 0 when complete, 1 when work remains
- $JobDir\`: Working directory for job-specific files
- $SessionDir\`: Session logs (auto-created)
What is this job supposed to do?
"@
    copilot -i $setupPrompt
    exit 0
}

# Check for existing sessions and resume from there
$ExistingSessions = (Get-ChildItem -Path $SessionDir -Filter "iteration-*.md" -ErrorAction SilentlyContinue | Measure-Object).Count
$iteration = $ExistingSessions
$maxIteration = $ExistingSessions + $MaxIterations

Write-Host "========================================" -ForegroundColor Green
Write-Host " Ralph Agent Loop for Copilot CLI" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Job name: $JobName"
Write-Host "Job directory: $JobDir"
Write-Host "Prompt file: $PromptFile"
Write-Host "Max iterations: $MaxIterations (additional)"
Write-Host "Stop hook: $StopHook"
Write-Host "Copilot args: $CopilotArgs"
Write-Host "Model: $ModelName"
Write-Host "Session directory: $SessionDir"

if ($iteration -gt 0) {
    Write-Host "Resuming from iteration $($iteration + 1) (found $iteration existing sessions)" -ForegroundColor Yellow
    Write-Host "Will run up to iteration $maxIteration" -ForegroundColor Yellow
} else {
    Write-Host "Starting new job" -ForegroundColor Yellow
}
Write-Host ""

# Save original location
$OriginalLocation = Get-Location

while ($iteration -lt $maxIteration) {
    $iteration++

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " Iteration $iteration / $maxIteration" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Session file path
    $SessionFile = Join-Path $SessionDir ("iteration-{0:D3}.md" -f $iteration)

    Write-Host "Session will be saved to: $SessionFile" -ForegroundColor Yellow

    # Change to job directory for execution
    Set-Location $JobDir

    # Read prompt content
    $PromptContent = Get-Content $PromptFile -Raw

    # Build copilot command arguments
    $copilotCommand = "copilot -p `"$PromptContent`" $CopilotArgs --model `"$ModelName`" --share `"$SessionFile`""
    
    # Run Copilot CLI
    try {
        Invoke-Expression $copilotCommand
        $CopilotExit = $LASTEXITCODE
    } catch {
        Write-Host "Error running Copilot: $_" -ForegroundColor Red
        $CopilotExit = 1
    }

    # Return to original directory
    Set-Location $OriginalLocation

    if ($CopilotExit -ne 0) {
        Write-Host "Warning: Copilot exited with code $CopilotExit" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Checking completion criteria..." -ForegroundColor Yellow

    # Check if stop hook exists
    if (Test-Path $StopHook) {
        # Run the stop hook to check if task is complete (from job directory)
        Set-Location $JobDir
        try {
            & $StopHook
            $StopHookExit = $LASTEXITCODE
        } catch {
            $StopHookExit = 1
        }
        Set-Location $OriginalLocation

        if ($StopHookExit -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host " ✓ Task completed successfully!" -ForegroundColor Green
            Write-Host " Completed in $iteration iteration(s)" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "Task not yet complete, continuing loop..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Warning: No stop hook found at $StopHook" -ForegroundColor Yellow
        Write-Host "Add a stop hook to define completion criteria" -ForegroundColor Yellow
        Write-Host "Continuing to next iteration..." -ForegroundColor Yellow
    }

    Write-Host ""
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host " Max iterations reached" -ForegroundColor Red
Write-Host " Task incomplete after $maxIteration iterations" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
exit 1