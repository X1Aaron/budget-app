@echo off
REM Quick push script for budget app (Windows)
REM Usage: push.bat "Your commit message"

echo Budget App - Quick Push
echo ================================

REM Check if there are changes
git diff-index --quiet HEAD
if %ERRORLEVEL% EQU 0 (
    echo No changes to commit!
    exit /b 0
)

REM Show status
echo.
echo Current changes:
git status --short

REM Get commit message
if "%~1"=="" (
    echo.
    set /p COMMIT_MSG="Enter commit message: "
) else (
    set COMMIT_MSG=%~1
)

REM Check if message is provided
if "%COMMIT_MSG%"=="" (
    echo Commit message cannot be empty!
    exit /b 1
)

REM Add all changes
echo.
echo Adding all changes...
git add .

REM Create commit
echo Creating commit...
git commit -m "%COMMIT_MSG%

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

REM Push to GitHub
echo Pushing to GitHub...
git push

echo.
echo Successfully pushed to GitHub!
pause