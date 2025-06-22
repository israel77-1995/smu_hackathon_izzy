# Mobile Spo - Hackathon Presentation Deployment Script (PowerShell)
# This script helps you quickly deploy your presentation to GitHub Pages

Write-Host "🚀 Mobile Spo - Hackathon Presentation Deployment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository. Please run 'git init' first." -ForegroundColor Red
    exit 1
}

# Check if presentation files exist
if (-not (Test-Path "presentation/index.html")) {
    Write-Host "❌ Error: presentation/index.html not found." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found presentation files" -ForegroundColor Green
Write-Host ""

# Add all files
Write-Host "📦 Adding files to git..." -ForegroundColor Yellow
git add .

# Commit with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Deploy enhanced hackathon presentation - $timestamp"

Write-Host "✅ Files committed" -ForegroundColor Green
Write-Host ""

# Push to main branch
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "✅ Pushed to GitHub" -ForegroundColor Green
Write-Host ""

# Get repository info
try {
    $repoUrl = git config --get remote.origin.url
    
    if ($repoUrl -like "*github.com*") {
        # Extract username and repo name from GitHub URL
        if ($repoUrl.EndsWith(".git")) {
            $repoUrl = $repoUrl.Substring(0, $repoUrl.Length - 4)
        }
        
        if ($repoUrl -like "https://github.com/*") {
            $repoPath = $repoUrl.Replace("https://github.com/", "")
        } elseif ($repoUrl -like "git@github.com:*") {
            $repoPath = $repoUrl.Replace("git@github.com:", "")
        }
        
        $parts = $repoPath.Split('/')
        $username = $parts[0]
        $repoName = $parts[1]
        
        $pagesUrl = "https://$username.github.io/$repoName/presentation/"
        
        Write-Host "🌐 GitHub Pages Setup Instructions:" -ForegroundColor Cyan
        Write-Host "1. Go to: https://github.com/$repoPath/settings/pages" -ForegroundColor White
        Write-Host "2. Under 'Source', select 'Deploy from a branch'" -ForegroundColor White
        Write-Host "3. Choose 'main' branch and '/ (root)' folder" -ForegroundColor White
        Write-Host "4. Click 'Save'" -ForegroundColor White
        Write-Host ""
        Write-Host "📱 Your presentation will be live at:" -ForegroundColor Cyan
        Write-Host "$pagesUrl" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🎯 Share this URL with hackathon judges!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not detect GitHub repository. Please manually enable GitHub Pages." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not get repository information. Please manually enable GitHub Pages." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🏆 Deployment complete! Good luck with your hackathon presentation!" -ForegroundColor Green
Write-Host "💡 Tip: Test your presentation at the GitHub Pages URL before presenting" -ForegroundColor Cyan
Write-Host ""

# Keep window open
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
