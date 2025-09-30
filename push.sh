#!/bin/bash

# Quick push script for budget app
# Usage: ./push.sh "Your commit message"
# Or: ./push.sh (will prompt for message)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Budget App - Quick Push${NC}"
echo "================================"

# Check if there are changes
if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}No changes to commit!${NC}"
    exit 0
fi

# Show status
echo -e "\n${YELLOW}Current changes:${NC}"
git status --short

# Get commit message
if [ -z "$1" ]; then
    echo -e "\n${YELLOW}Enter commit message:${NC}"
    read -r COMMIT_MSG
else
    COMMIT_MSG="$1"
fi

# Check if message is provided
if [ -z "$COMMIT_MSG" ]; then
    echo -e "${RED}Commit message cannot be empty!${NC}"
    exit 1
fi

# Add all changes
echo -e "\n${YELLOW}Adding all changes...${NC}"
git add .

# Create commit
echo -e "${YELLOW}Creating commit...${NC}"
git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push

echo -e "\n${GREEN}✓ Successfully pushed to GitHub!${NC}"