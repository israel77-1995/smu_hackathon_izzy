# Mobile Spo - Quick Setup Script for Windows
# This script sets up the entire Mobile Spo development environment

Write-Host "🏥 Mobile Spo - AI Health Assistant Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if MongoDB is running
Write-Host "🗄️ Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoCheck = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
    if ($mongoCheck.TcpTestSucceeded) {
        Write-Host "✅ MongoDB is running on localhost:27017" -ForegroundColor Green
    } else {
        Write-Host "⚠️ MongoDB not detected. Please start MongoDB or install from https://www.mongodb.com/" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not check MongoDB status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Setting up backend..." -ForegroundColor Yellow
Set-Location backend

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
npm install

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    Write-Host "💡 You can edit backend/.env to customize configuration" -ForegroundColor Blue
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

Set-Location ..

Write-Host ""
Write-Host "📱 Setting up mobile app..." -ForegroundColor Yellow
Set-Location MobileSpoApp

# Install frontend dependencies
Write-Host "📦 Installing mobile app dependencies..." -ForegroundColor Cyan
npm install

Set-Location ..

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To start the application:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "2. In a new terminal, start the mobile app:" -ForegroundColor White
Write-Host "   cd MobileSpoApp" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "📍 URLs:" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:3001" -ForegroundColor Gray
Write-Host "   Mobile App:  http://localhost:8081" -ForegroundColor Gray
Write-Host "   Health Check: http://localhost:3001/health" -ForegroundColor Gray
Write-Host ""
Write-Host "🧪 Test the AI:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:8081" -ForegroundColor Gray
Write-Host "   2. Click 'Continue' → 'Ask AI'" -ForegroundColor Gray
Write-Host "   3. Type: 'I have a headache'" -ForegroundColor Gray
Write-Host "   4. Test emergency: 'I want to hurt myself'" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   README.md - Complete setup guide" -ForegroundColor Gray
Write-Host "   backend/README.md - Backend documentation" -ForegroundColor Gray
Write-Host "   docs/ - Technical documentation" -ForegroundColor Gray
Write-Host ""
Write-Host "🎪 Demo Presentation:" -ForegroundColor Cyan
Write-Host "   Open mobile-spo-presentation.html in your browser" -ForegroundColor Gray
Write-Host ""
Write-Host "🆘 Need help? Check the README.md or open an issue on GitHub" -ForegroundColor Blue
Write-Host ""
Write-Host "Built with ❤️ for South Africa 🇿🇦" -ForegroundColor Magenta
