#!/bin/bash

# Mobile Spo - Hackathon Presentation Deployment Script
# This script helps you quickly deploy your presentation to GitHub Pages

echo "🚀 Mobile Spo - Hackathon Presentation Deployment"
echo "=================================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run 'git init' first."
    exit 1
fi

# Check if presentation files exist
if [ ! -f "presentation/index.html" ]; then
    echo "❌ Error: presentation/index.html not found."
    exit 1
fi

echo "✅ Found presentation files"
echo ""

# Add all files
echo "📦 Adding files to git..."
git add .

# Commit with timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "Deploy enhanced hackathon presentation - $TIMESTAMP"

echo "✅ Files committed"
echo ""

# Push to main branch
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Pushed to GitHub"
echo ""

# Get repository info
REPO_URL=$(git config --get remote.origin.url)
if [[ $REPO_URL == *"github.com"* ]]; then
    # Extract username and repo name from GitHub URL
    if [[ $REPO_URL == *".git" ]]; then
        REPO_URL=${REPO_URL%.git}
    fi
    
    if [[ $REPO_URL == *"https://github.com/"* ]]; then
        REPO_PATH=${REPO_URL#https://github.com/}
    elif [[ $REPO_URL == *"git@github.com:"* ]]; then
        REPO_PATH=${REPO_URL#git@github.com:}
    fi
    
    USERNAME=$(echo $REPO_PATH | cut -d'/' -f1)
    REPO_NAME=$(echo $REPO_PATH | cut -d'/' -f2)
    
    PAGES_URL="https://$USERNAME.github.io/$REPO_NAME/presentation/"
    
    echo "🌐 GitHub Pages Setup Instructions:"
    echo "1. Go to: https://github.com/$REPO_PATH/settings/pages"
    echo "2. Under 'Source', select 'Deploy from a branch'"
    echo "3. Choose 'main' branch and '/ (root)' folder"
    echo "4. Click 'Save'"
    echo ""
    echo "📱 Your presentation will be live at:"
    echo "$PAGES_URL"
    echo ""
    echo "🎯 Share this URL with hackathon judges!"
else
    echo "⚠️  Could not detect GitHub repository. Please manually enable GitHub Pages."
fi

echo ""
echo "🏆 Deployment complete! Good luck with your hackathon presentation!"
echo "💡 Tip: Test your presentation at the GitHub Pages URL before presenting"
echo ""
