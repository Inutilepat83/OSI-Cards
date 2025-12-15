#!/bin/bash

# Cursor Rules - Enterprise Backend Engineering Suite
# Installation Script for macOS/Linux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RULES_DIR="$SCRIPT_DIR"

# Get target project directory
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./install.sh /path/to/your/project${NC}"
    echo -e "${YELLOW}Or run from project root: ./install.sh .${NC}"
    exit 1
fi

TARGET_DIR="$1"
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${RED}Error: Target directory does not exist: $TARGET_DIR${NC}"
    exit 1
fi

TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
TARGET_CURSOR_DIR="$TARGET_DIR/.cursor"

echo -e "${GREEN}Installing Cursor Rules - Enterprise Backend Engineering Suite${NC}"
echo -e "Target directory: $TARGET_DIR"
echo ""

# Backup existing rules if they exist
if [ -d "$TARGET_CURSOR_DIR/rules" ]; then
    BACKUP_DIR="$TARGET_CURSOR_DIR/rules.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}Backing up existing rules to: $BACKUP_DIR${NC}"
    mv "$TARGET_CURSOR_DIR/rules" "$BACKUP_DIR"
fi

# Create .cursor directory if it doesn't exist
mkdir -p "$TARGET_CURSOR_DIR"

# Copy rules directory
echo -e "${GREEN}Copying rules...${NC}"
cp -r "$RULES_DIR/patterns" "$TARGET_CURSOR_DIR/rules/"
cp -r "$RULES_DIR/development" "$TARGET_CURSOR_DIR/rules/"
cp -r "$RULES_DIR/languages" "$TARGET_CURSOR_DIR/rules/"

# Remove install script from target (don't copy it)
rm -rf "$TARGET_CURSOR_DIR/rules/install.sh" 2>/dev/null || true

echo -e "${GREEN}✓ Rules installed successfully!${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Open your project in Cursor"
echo -e "2. The AI will automatically apply these rules"
echo -e "3. Start coding with enterprise-grade best practices!"
echo ""
echo -e "${YELLOW}Note: If you had existing rules, they were backed up.${NC}"













