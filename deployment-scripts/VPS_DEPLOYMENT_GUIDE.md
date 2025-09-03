# 🚀 **VPS DEPLOYMENT GUIDE - DEVSFIT MICROSERVICES**

## **📋 PREREQUISITES**
- Clean VPS with Ubuntu 22.04 LTS or later
- Minimum 4GB RAM, 2 CPU cores, 50GB storage
- Root access or sudo privileges
- Domain names configured (devsfit.com, api.devsfit.com, staging.devsfit.com, api-staging.devsfit.com)

---

## **🔧 STEP 1: VPS INITIAL SETUP**

### **1.1 Update System**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### **1.2 Install Docker & Docker Compose**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### **1.3 Install Nginx**
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### **1.4 Install SSL Certificates (Let's Encrypt)**
```bash
sudo apt install -y certbot python3-certbot-nginx

# For production domains
sudo certbot --nginx -d devsfit.com -d api.devsfit.com

# For staging domains
sudo certbot --nginx -d staging.devsfit.com -d api-staging.devsfit.com
```

---

## **📁 STEP 2: APPLICATION SETUP**

### **2.1 Create Application Directory**
```bash
sudo mkdir -p /opt/devsfit
sudo chown $USER:$USER /opt/devsfit
cd /opt/devsfit
```

### **2.2 Clone Repository**
```bash
git clone https://github.com/your-org/devsfit-backend.git .
```

### **2.3 Create SSL Directory**
```bash
sudo mkdir -p /etc/nginx/ssl
sudo chown $USER:$USER /etc/nginx/ssl
```

### **2.4 Copy SSL Certificates**
```bash
# Copy Let's Encrypt certificates
sudo cp /etc/letsencrypt/live/devsfit.com/fullchain.pem /etc/nginx/ssl/
sudo cp /etc/letsencrypt/live/devsfit.com/privkey.pem /etc/nginx/ssl/
sudo chown $USER:$USER /etc/nginx/ssl/*
```

---

## **⚙️ STEP 3: ENVIRONMENT CONFIGURATION**

### **3.1 Configure Production Environment**
```bash
cd /opt/devsfit/deployment-scripts
cp production.env .env.production
nano .env.production
```

**Update these critical values:**
```env
# Database Configuration
POSTGRES_PASSWORD=your-ultra-secure-production-password-min-32-chars

# Redis Configuration
REDIS_PASSWORD=your-ultra-secure-redis-password-min-32-chars

# JWT Configuration
JWT_SECRET=your-ultra-secure-jwt-secret-for-production-minimum-64-characters-long
JWT_REFRESH_SECRET=your-ultra-secure-refresh-secret-for-production-minimum-64-characters-long

# Email Configuration
EMAIL_PASS=your-sendgrid-api-key

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
```

### **3.2 Configure Staging Environment**
```bash
cp staging.env .env.staging
nano .env.staging
```

---

## **🚀 STEP 4: DEPLOYMENT**

### **4.1 Deploy to Staging First**
```bash
cd /opt/devsfit
chmod +x deployment-scripts/deploy-staging.sh
./deployment-scripts/deploy-staging.sh
```

### **4.2 Deploy to Production**
```bash
chmod +x deployment-scripts/deploy-production.sh
./deployment-scripts/deploy-production.sh
```

---

## **🔍 STEP 5: VERIFICATION**

### **5.1 Check Service Status**
```bash
# Check all containers
docker ps

# Check specific services
docker-compose -f deployment-scripts/docker-compose.production.yml ps

# Health checks
./deployment-scripts/health-check.sh
```

### **5.2 Test Endpoints**
```bash
# Production API
curl -k https://api.devsfit.com/health

# Staging API
curl -k https://api-staging.devsfit.com/health

# Production Frontend
curl -k https://devsfit.com

# Staging Frontend
curl -k https://staging.devsfit.com
```

### **5.3 Check Logs**
```bash
# View all logs
docker-compose -f deployment-scripts/docker-compose.production.yml logs

# View specific service logs
docker-compose -f deployment-scripts/docker-compose.production.yml logs api-gateway
```

---

## **📊 STEP 6: MONITORING SETUP**

### **6.1 Access Monitoring Dashboards**
- **Grafana**: https://devsfit.com:3013 (admin/admin)
- **Prometheus**: https://devsfit.com:9090
- **Jaeger**: https://devsfit.com:16686

### **6.2 Set Up Alerts**
```bash
# Configure Slack webhooks in environment files
# Update AlertManager configuration
nano deployment-scripts/monitoring/alertmanager.yml
```

---

## **🛡️ STEP 7: SECURITY HARDENING**

### **7.1 Firewall Configuration**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### **7.2 Regular Backups**
```bash
# Set up automated backups
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /opt/devsfit/deployment-scripts/backup.sh
```

---

## **🔧 STEP 8: MAINTENANCE**

### **8.1 Update Application**
```bash
cd /opt/devsfit
git pull origin main
docker-compose -f deployment-scripts/docker-compose.production.yml down
docker-compose -f deployment-scripts/docker-compose.production.yml up -d
```

### **8.2 SSL Certificate Renewal**
```bash
# Set up automatic renewal
sudo crontab -e

# Add this line for SSL renewal
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## **🚨 TROUBLESHOOTING**

### **Common Issues:**

1. **Port Already in Use**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo systemctl stop nginx  # If needed
   ```

2. **Docker Permission Issues**
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **SSL Certificate Issues**
   ```bash
   sudo certbot --nginx -d devsfit.com -d api.devsfit.com --force-renewal
   ```

4. **Database Connection Issues**
   ```bash
   docker-compose -f deployment-scripts/docker-compose.production.yml logs postgres-primary
   ```

---

## **📞 SUPPORT**

If you encounter issues:
1. Check logs: `docker-compose logs [service-name]`
2. Verify environment variables
3. Check network connectivity
4. Review SSL certificate status

**Your Devsfit microservices application is now ready for production!** 🎉
