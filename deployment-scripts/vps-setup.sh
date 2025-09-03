#!/bin/bash

# 🚀 VPS Setup Script for Devsfit Microservices
# This script sets up a clean VPS for deployment

set -e

echo "🚀 DEVSFIT VPS SETUP SCRIPT"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Check if sudo is available
if ! command -v sudo &> /dev/null; then
    print_error "sudo is not available. Please install it first."
    exit 1
fi

print_status "Starting VPS setup for Devsfit microservices..."

# Step 1: Update system
print_status "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated successfully"

# Step 2: Install essential packages
print_status "Step 2: Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release nano htop
print_success "Essential packages installed"

# Step 3: Install Docker
print_status "Step 3: Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_success "Docker installed successfully"
else
    print_warning "Docker is already installed"
fi

# Step 4: Install Docker Compose
print_status "Step 4: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_warning "Docker Compose is already installed"
fi

# Step 5: Install Nginx
print_status "Step 5: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    print_success "Nginx installed and started"
else
    print_warning "Nginx is already installed"
fi

# Step 6: Install Certbot for SSL certificates
print_status "Step 6: Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
    print_success "Certbot installed successfully"
else
    print_warning "Certbot is already installed"
fi

# Step 7: Create application directory
print_status "Step 7: Creating application directory..."
sudo mkdir -p /opt/devsfit
sudo chown $USER:$USER /opt/devsfit
print_success "Application directory created: /opt/devsfit"

# Step 8: Create SSL directory
print_status "Step 8: Creating SSL directory..."
sudo mkdir -p /etc/nginx/ssl
sudo chown $USER:$USER /etc/nginx/ssl
print_success "SSL directory created: /etc/nginx/ssl"

# Step 9: Configure firewall
print_status "Step 9: Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
print_success "Firewall configured"

# Step 10: Create deployment user (optional)
print_status "Step 10: Setting up deployment user..."
if ! id "devsfit" &>/dev/null; then
    sudo useradd -m -s /bin/bash devsfit
    sudo usermod -aG docker devsfit
    print_success "Deployment user 'devsfit' created"
else
    print_warning "User 'devsfit' already exists"
fi

# Step 11: Set up log rotation
print_status "Step 11: Setting up log rotation..."
sudo tee /etc/logrotate.d/devsfit << EOF
/opt/devsfit/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 devsfit devsfit
}
EOF
print_success "Log rotation configured"

# Step 12: Create monitoring directory
print_status "Step 12: Creating monitoring directory..."
sudo mkdir -p /opt/devsfit/monitoring
sudo chown $USER:$USER /opt/devsfit/monitoring
print_success "Monitoring directory created"

# Step 13: Set up system limits
print_status "Step 13: Configuring system limits..."
sudo tee -a /etc/security/limits.conf << EOF
# Devsfit application limits
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF
print_success "System limits configured"

# Step 14: Configure Docker daemon
print_status "Step 14: Configuring Docker daemon..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}
EOF
print_success "Docker daemon configured"

# Step 15: Create backup directory
print_status "Step 15: Creating backup directory..."
sudo mkdir -p /opt/devsfit/backups
sudo chown $USER:$USER /opt/devsfit/backups
print_success "Backup directory created"

# Final verification
print_status "Final verification..."

# Check Docker
if docker --version &> /dev/null; then
    print_success "Docker: $(docker --version)"
else
    print_error "Docker verification failed"
fi

# Check Docker Compose
if docker-compose --version &> /dev/null; then
    print_success "Docker Compose: $(docker-compose --version)"
else
    print_error "Docker Compose verification failed"
fi

# Check Nginx
if nginx -v &> /dev/null; then
    print_success "Nginx: $(nginx -v 2>&1)"
else
    print_error "Nginx verification failed"
fi

# Check Certbot
if certbot --version &> /dev/null; then
    print_success "Certbot: $(certbot --version)"
else
    print_error "Certbot verification failed"
fi

echo ""
echo "🎉 VPS SETUP COMPLETED SUCCESSFULLY!"
echo "===================================="
echo ""
echo "📋 NEXT STEPS:"
echo "1. Clone your repository:"
echo "   cd /opt/devsfit"
echo "   git clone https://github.com/your-org/devsfit-backend.git ."
echo ""
echo "2. Configure SSL certificates:"
echo "   sudo certbot --nginx -d devsfit.com -d api.devsfit.com"
echo "   sudo certbot --nginx -d staging.devsfit.com -d api-staging.devsfit.com"
echo ""
echo "3. Copy SSL certificates:"
echo "   sudo cp /etc/letsencrypt/live/devsfit.com/fullchain.pem /etc/nginx/ssl/"
echo "   sudo cp /etc/letsencrypt/live/devsfit.com/privkey.pem /etc/nginx/ssl/"
echo "   sudo chown $USER:$USER /etc/nginx/ssl/*"
echo ""
echo "4. Configure environment variables:"
echo "   cd /opt/devsfit/deployment-scripts"
echo "   cp production.env .env.production"
echo "   nano .env.production"
echo ""
echo "5. Deploy your application:"
echo "   chmod +x deployment-scripts/deploy-staging.sh"
echo "   ./deployment-scripts/deploy-staging.sh"
echo ""
echo "📊 SYSTEM INFORMATION:"
echo "   - OS: $(lsb_release -d | cut -f2)"
echo "   - Kernel: $(uname -r)"
echo "   - CPU: $(nproc) cores"
echo "   - Memory: $(free -h | awk 'NR==2{printf "%.1f", $2}') GB"
echo "   - Disk: $(df -h / | awk 'NR==2{printf "%.1f", $2}') GB"
echo ""
echo "🔧 IMPORTANT NOTES:"
echo "   - Logout and login again for Docker group changes to take effect"
echo "   - Restart Docker service: sudo systemctl restart docker"
echo "   - Check firewall status: sudo ufw status"
echo ""
echo "📞 For support, check the VPS_DEPLOYMENT_GUIDE.md file"
echo ""
print_success "VPS is ready for Devsfit microservices deployment!"
