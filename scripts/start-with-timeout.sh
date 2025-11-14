#!/bin/bash

# OSI Cards - Start with Timeout Script
# This script starts the Angular dev server with a timeout mechanism
# If the build fails or hangs, it will automatically stop after the specified timeout

set -e

# Configuration
TIMEOUT_SECONDS=${1:-30}  # Default 30 seconds, can be overridden
LOG_FILE="start-$(date +%Y%m%d-%H%M%S).log"
PID_FILE=".npm-start.pid"
FAILURE_CHECK_INTERVAL=2  # Check for failures every 2 seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting OSI Cards with ${TIMEOUT_SECONDS}s timeout...${NC}"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping npm start process (PID: $PID)...${NC}"
            kill -TERM $PID 2>/dev/null || true
            sleep 2
            if ps -p $PID > /dev/null 2>&1; then
                echo -e "${RED}Force killing process...${NC}"
                kill -KILL $PID 2>/dev/null || true
            fi
        fi
        rm -f "$PID_FILE"
    fi
    
    # Kill any remaining Angular processes
    pkill -f "ng serve" 2>/dev/null || true
    pkill -f "webpack" 2>/dev/null || true
    
    echo -e "${GREEN}✨ Cleanup complete${NC}"
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Start npm in background and capture PID
echo -e "${YELLOW}📦 Starting npm start...${NC}"
npm start > "$LOG_FILE" 2>&1 &
NPM_PID=$!
echo $NPM_PID > "$PID_FILE"

echo -e "${YELLOW}📋 Process started with PID: $NPM_PID${NC}"
echo -e "${YELLOW}📄 Logs available in: $LOG_FILE${NC}"

# Monitor the process
START_TIME=$(date +%s)
SUCCESS=false
SERVER_READY=false

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    
    # Check if process is still running
    if ! ps -p $NPM_PID > /dev/null 2>&1; then
        echo -e "${RED}❌ npm start process ended unexpectedly${NC}"
        echo -e "${YELLOW}📄 Last 20 lines of log:${NC}"
        tail -20 "$LOG_FILE" 2>/dev/null || echo "No log file found"
        exit 1
    fi
    
    # Check for compilation success/failure in log
    if grep -q "Angular Live Development Server is listening" "$LOG_FILE" 2>/dev/null; then
        if ! $SERVER_READY; then
            echo -e "${GREEN}✅ Server is running and listening!${NC}"
            echo -e "${GREEN}🌐 Open http://localhost:4200 in your browser${NC}"
            SERVER_READY=true
        fi
        
        # Check if compilation succeeded after server start
        if grep -q "✔ Compiled successfully" "$LOG_FILE" 2>/dev/null; then
            if ! $SUCCESS; then
                echo -e "${GREEN}🎉 Compilation successful!${NC}"
                SUCCESS=true
            fi
        fi
    fi
    
    # Check for compilation failure (faster detection)
    if grep -q "✖ Failed to compile\|error TS\|Error:" "$LOG_FILE" 2>/dev/null; then
        echo -e "${RED}❌ Compilation failed! (detected in ${ELAPSED}s)${NC}"
        echo -e "${YELLOW}📄 Error details:${NC}"
        # Show more comprehensive error information
        grep -A 5 -B 2 "error TS\|Error:" "$LOG_FILE" | tail -20
        echo -e "${RED}🚫 Stopping due to compilation failure${NC}"
        exit 1
    fi
    
    # Check timeout
    if [ $ELAPSED -ge $TIMEOUT_SECONDS ]; then
        echo -e "${RED}⏰ Timeout reached (${TIMEOUT_SECONDS}s)${NC}"
        if $SERVER_READY && $SUCCESS; then
            echo -e "${GREEN}✅ Server is working correctly!${NC}"
            echo -e "${YELLOW}💡 If you want to keep the server running, use 'npm start' directly${NC}"
            exit 0
        elif $SERVER_READY; then
            echo -e "${YELLOW}Server was running but had compilation issues${NC}"
        else
            echo -e "${RED}Server never became ready${NC}"
        fi
        echo -e "${YELLOW}📄 Last 20 lines of log:${NC}"
        tail -20 "$LOG_FILE" 2>/dev/null || echo "No log file found"
        exit 1
    fi
    
    # Progress indicator (more frequent updates)
    if [ $((ELAPSED % 5)) -eq 0 ] && [ $ELAPSED -gt 0 ]; then
        REMAINING=$((TIMEOUT_SECONDS - ELAPSED))
        echo -e "${YELLOW}⏳ Checking... ${ELAPSED}s elapsed, ${REMAINING}s remaining${NC}"
    fi
    
    sleep $FAILURE_CHECK_INTERVAL
done
