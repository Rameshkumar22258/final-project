#!/bin/bash

# DisasterReliefAI - Quick Start Script
# This script sets up and starts the entire application

echo "=============================================="
echo "  DisasterReliefAI - Quick Start Script"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+ first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python is not installed. Please install Python 3.8+ first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python found: $(python3 --version)${NC}"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${YELLOW}⚠ MongoDB is not running. Attempting to start...${NC}"
    if command -v mongod &> /dev/null; then
        mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb-data
        sleep 2
        echo -e "${GREEN}✓ MongoDB started${NC}"
    else
        echo -e "${RED}❌ MongoDB is not installed. Please install MongoDB first.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ MongoDB is running${NC}"
fi

echo ""
echo "=============================================="
echo "  Installing Dependencies"
echo "=============================================="

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
fi

cd ..

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Create frontend .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    echo -e "${GREEN}✓ .env file created${NC}"
fi

cd ..

# Install Python dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null

if ! python3 -c "import pandas" &> /dev/null; then
    pip install -r requirements.txt
    echo -e "${GREEN}✓ Python dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Python dependencies already installed${NC}"
fi

# Download NLTK data
echo -e "${YELLOW}Downloading NLTK data...${NC}"
python3 -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True); nltk.download('wordnet', quiet=True); nltk.download('averaged_perceptron_tagger', quiet=True)"
echo -e "${GREEN}✓ NLTK data downloaded${NC}"

echo ""
echo "=============================================="
echo "  Starting Application"
echo "=============================================="

# Start backend in background
echo -e "${YELLOW}Starting backend server...${NC}"
cd backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3
echo -e "${GREEN}✓ Backend started on port 5000 (PID: $BACKEND_PID)${NC}"

# Start frontend in background
echo -e "${YELLOW}Starting frontend application...${NC}"
cd frontend
npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 5
echo -e "${GREEN}✓ Frontend started on port 3000 (PID: $FRONTEND_PID)${NC}"

echo ""
echo "=============================================="
echo "  🎉 DisasterReliefAI is Running!"
echo "=============================================="
echo ""
echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
echo -e "${GREEN}Backend API:${NC} http://localhost:5000/api"
echo -e "${GREEN}MongoDB:${NC} mongodb://localhost:27017"
echo ""
echo -e "${YELLOW}Process IDs:${NC}"
echo -e "  Backend: $BACKEND_PID"
echo -e "  Frontend: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend: tail -f /tmp/backend.log"
echo -e "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo -e "${YELLOW}To stop the application:${NC}"
echo -e "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo -e "${GREEN}Opening browser...${NC}"

# Open browser
sleep 3
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
fi

echo ""
echo "=============================================="
echo "  Press Ctrl+C to view cleanup options"
echo "=============================================="

# Trap Ctrl+C
trap cleanup INT

cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓ Services stopped${NC}"
    exit 0
}

# Keep script running
wait














