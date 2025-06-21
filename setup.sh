#!/bin/bash

# Mobile Spo - Quick Setup Script for Linux/Mac
# This script sets up the entire Mobile Spo development environment

echo "🏥 Mobile Spo - AI Health Assistant Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/${NC}"
    exit 1
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm found: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found. Please install npm${NC}"
    exit 1
fi

# Check if MongoDB is running
echo -e "${YELLOW}🗄️ Checking MongoDB...${NC}"
if nc -z localhost 27017 2>/dev/null; then
    echo -e "${GREEN}✅ MongoDB is running on localhost:27017${NC}"
else
    echo -e "${YELLOW}⚠️ MongoDB not detected. Please start MongoDB or install from https://www.mongodb.com/${NC}"
fi

echo ""
echo -e "${YELLOW}🔧 Setting up backend...${NC}"
cd backend

# Install backend dependencies
echo -e "${CYAN}📦 Installing backend dependencies...${NC}"
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${CYAN}📝 Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file from template${NC}"
    echo -e "${BLUE}💡 You can edit backend/.env to customize configuration${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

cd ..

echo ""
echo -e "${YELLOW}📱 Setting up mobile app...${NC}"
cd MobileSpoApp

# Install frontend dependencies
echo -e "${CYAN}📦 Installing mobile app dependencies...${NC}"
npm install

cd ..

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo -e "${GREEN}==================${NC}"
echo ""
echo -e "${CYAN}🚀 To start the application:${NC}"
echo ""
echo -e "${NC}1. Start the backend server:${NC}"
echo -e "   ${NC}cd backend${NC}"
echo -e "   ${NC}npm start${NC}"
echo ""
echo -e "${NC}2. In a new terminal, start the mobile app:${NC}"
echo -e "   ${NC}cd MobileSpoApp${NC}"
echo -e "   ${NC}npm start${NC}"
echo ""
echo -e "${CYAN}📍 URLs:${NC}"
echo -e "   ${NC}Backend API: http://localhost:3001${NC}"
echo -e "   ${NC}Mobile App:  http://localhost:8081${NC}"
echo -e "   ${NC}Health Check: http://localhost:3001/health${NC}"
echo ""
echo -e "${CYAN}🧪 Test the AI:${NC}"
echo -e "   ${NC}1. Open http://localhost:8081${NC}"
echo -e "   ${NC}2. Click 'Continue' → 'Ask AI'${NC}"
echo -e "   ${NC}3. Type: 'I have a headache'${NC}"
echo -e "   ${NC}4. Test emergency: 'I want to hurt myself'${NC}"
echo ""
echo -e "${CYAN}📖 Documentation:${NC}"
echo -e "   ${NC}README.md - Complete setup guide${NC}"
echo -e "   ${NC}backend/README.md - Backend documentation${NC}"
echo -e "   ${NC}docs/ - Technical documentation${NC}"
echo ""
echo -e "${CYAN}🎪 Demo Presentation:${NC}"
echo -e "   ${NC}Open mobile-spo-presentation.html in your browser${NC}"
echo ""
echo -e "${BLUE}🆘 Need help? Check the README.md or open an issue on GitHub${NC}"
echo ""
echo -e "${MAGENTA}Built with ❤️ for South Africa 🇿🇦${NC}"
