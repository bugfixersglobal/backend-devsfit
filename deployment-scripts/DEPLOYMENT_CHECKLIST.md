# 🚀 **VPS DEPLOYMENT CHECKLIST**

## **📋 PRE-DEPLOYMENT CHECKLIST**

### **✅ VPS Requirements**
- [ ] Ubuntu 22.04 LTS or later
- [ ] Minimum 4GB RAM
- [ ] Minimum 2 CPU cores
- [ ] Minimum 50GB storage
- [ ] Root access or sudo privileges

### **✅ Domain Configuration**
- [ ] devsfit.com points to VPS IP
- [ ] api.devsfit.com points to VPS IP
- [ ] staging.devsfit.com points to VPS IP
- [ ] api-staging.devsfit.com points to VPS IP

### **✅ DNS Records (A Records)**
```
devsfit.com          → VPS_IP_ADDRESS
api.devsfit.com      → VPS_IP_ADDRESS
staging.devsfit.com  → VPS_IP_ADDRESS
api-staging.devsfit.com → VPS_IP_ADDRESS
```

---

## **🔧 DEPLOYMENT STEPS**

### **Step 1: VPS Setup**
```bash
# Upload setup script to VPS
scp deployment-scripts/vps-setup.sh user@your-vps-ip:~/

# SSH into VPS and run setup
ssh user@your-vps-ip
chmod +x vps-setup.sh
./vps-setup.sh
```

### **Step 2: Clone Repository**
```bash
cd /opt/devsfit
git clone https://github.com/your-org/devsfit-backend.git .
```

### **Step 3: SSL Certificates**
```bash
# Production domains
sudo certbot --nginx -d devsfit.com -d api.devsfit.com

# Staging domains
sudo certbot --nginx -d staging.devsfit.com -d api-staging.devsfit.com

# Copy certificates
sudo cp /etc/letsencrypt/live/devsfit.com/fullchain.pem /etc/nginx/ssl/
sudo cp /etc/letsencrypt/live/devsfit.com/privkey.pem /etc/nginx/ssl/
sudo chown $USER:$USER /etc/nginx/ssl/*
```

### **Step 4: Environment Configuration**
```bash
cd /opt/devsfit/deployment-scripts
cp production.env .env.production
nano .env.production
```

**CRITICAL VALUES TO UPDATE:**
- [ ] POSTGRES_PASSWORD (32+ chars)
- [ ] REDIS_PASSWORD (32+ chars)
- [ ] JWT_SECRET (64+ chars)
- [ ] JWT_REFRESH_SECRET (64+ chars)
- [ ] EMAIL_PASS (SendGrid API key)
- [ ] AWS_ACCESS_KEY_ID
- [ ] AWS_SECRET_ACCESS_KEY
- [ ] SLACK_WEBHOOK_URL

### **Step 5: Deploy Staging**
```bash
cd /opt/devsfit
chmod +x deployment-scripts/deploy-staging.sh
./deployment-scripts/deploy-staging.sh
```

### **Step 6: Deploy Production**
```bash
chmod +x deployment-scripts/deploy-production.sh
./deployment-scripts/deploy-production.sh
```

---

## **🔍 VERIFICATION CHECKLIST**

### **✅ Service Health Checks**
- [ ] API Gateway: https://api.devsfit.com/health
- [ ] Auth Service: https://api.devsfit.com/api/v1/auth/health
- [ ] Staging API: https://api-staging.devsfit.com/health
- [ ] Frontend: https://devsfit.com
- [ ] Staging Frontend: https://staging.devsfit.com

### **✅ Monitoring Dashboards**
- [ ] Grafana: https://devsfit.com:3013 (admin/admin)
- [ ] Prometheus: https://devsfit.com:9090
- [ ] Jaeger: https://devsfit.com:16686

### **✅ Database Connections**
- [ ] PostgreSQL primary: Connected
- [ ] Redis cluster: Connected
- [ ] RabbitMQ cluster: Connected

### **✅ SSL Certificates**
- [ ] devsfit.com: Valid
- [ ] api.devsfit.com: Valid
- [ ] staging.devsfit.com: Valid
- [ ] api-staging.devsfit.com: Valid

### **✅ Security**
- [ ] Firewall enabled (UFW)
- [ ] Only necessary ports open (22, 80, 443)
- [ ] SSL certificates auto-renewal configured
- [ ] Regular backups scheduled

---

## **🚨 TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **1. Docker Permission Issues**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

#### **2. Port Already in Use**
```bash
sudo netstat -tulpn | grep :80
sudo systemctl stop nginx  # If needed
```

#### **3. SSL Certificate Issues**
```bash
sudo certbot --nginx -d devsfit.com -d api.devsfit.com --force-renewal
```

#### **4. Database Connection Issues**
```bash
docker-compose -f deployment-scripts/docker-compose.production.yml logs postgres-primary
```

#### **5. Service Not Starting**
```bash
# Check logs
docker-compose -f deployment-scripts/docker-compose.production.yml logs [service-name]

# Check environment variables
docker-compose -f deployment-scripts/docker-compose.production.yml config
```

---

## **📊 POST-DEPLOYMENT MONITORING**

### **Daily Checks**
- [ ] Service health status
- [ ] Disk space usage
- [ ] Memory usage
- [ ] CPU usage
- [ ] Error logs

### **Weekly Checks**
- [ ] SSL certificate expiration
- [ ] Backup verification
- [ ] Security updates
- [ ] Performance metrics

### **Monthly Checks**
- [ ] Full system backup
- [ ] Log rotation
- [ ] Certificate renewal
- [ ] Performance optimization

---

## **📞 SUPPORT CONTACTS**

- **Documentation**: VPS_DEPLOYMENT_GUIDE.md
- **Logs Location**: /opt/devsfit/logs/
- **Backup Location**: /opt/devsfit/backups/
- **Configuration**: /opt/devsfit/deployment-scripts/

---

## **🎉 DEPLOYMENT COMPLETE**

Once all items are checked, your Devsfit microservices application is successfully deployed and ready for production use!

**Production URLs:**
- Frontend: https://devsfit.com
- API: https://api.devsfit.com
- Monitoring: https://devsfit.com:3013

**Staging URLs:**
- Frontend: https://staging.devsfit.com
- API: https://api-staging.devsfit.com
- Monitoring: https://staging.devsfit.com:3013
