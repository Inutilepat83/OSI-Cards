#!/bin/bash

# OSI Cards - Quick Start Script
# Simple wrapper for the most common development scenarios

case "${1:-help}" in
    "safe")
        echo "🔧 Running safe start (lint + timeout)..."
        npm run start:safe
        ;;
    "quick")
        echo "⚡ Running quick start (15s timeout)..."
        npm run start:timeout:short
        ;;
    "normal")
        echo "🚀 Running normal start (30s timeout)..."
        npm run start:timeout
        ;;
    "long")
        echo "⏰ Running extended start (60s timeout)..."
        npm run start:timeout:long
        ;;
    "clean")
        echo "🧹 Cleaning and starting fresh..."
        npm run clean
        npm install
        npm run start:timeout
        ;;
    "help"|*)
        echo "🎯 OSI Cards Development Helper"
        echo ""
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  safe    - Lint first, then start with timeout (recommended)"
        echo "  quick   - Start with 15-second timeout"
        echo "  normal  - Start with 30-second timeout"
        echo "  long    - Start with 60-second timeout"
        echo "  clean   - Clean build artifacts and restart"
        echo "  help    - Show this help message"
        echo ""
        echo "All commands include automatic timeout and cleanup on failure."
        ;;
esac
