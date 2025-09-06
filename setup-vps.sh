#!/bin/bash

# ========================================
# DEVSFIT VPS QUICK SETUP
# ========================================
# Run this first on your VPS to prepare the environment

set -e

echo "🔧 Setting up Devsfit VPS Environment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed. Please log out and log back in for group changes to take effect."
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
fi

# Install Git
if ! command -v git &> /dev/null; then
    echo "📁 Installing Git..."
    sudo apt install git -y
    echo "✅ Git installed"
fi

# Install curl
if ! command -v curl &> /dev/null; then
    echo "🌐 Installing curl..."
    sudo apt install curl -y
    echo "✅ curl installed"
fi

echo ""
echo "🎉 VPS setup completed!"
echo ""
echo "Next steps:"
echo "1. Log out and log back in (for Docker group changes)"
echo "2. Clone your repository: git clone <your-repo-url>"
echo "3. Run the deployment script: ./deploy-vps-complete.sh"
