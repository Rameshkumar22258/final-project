# Deployment Guide - Disaster Relief AI

## 🌐 Production Deployment Options

### Option 1: Traditional Server Deployment

#### Prerequisites:
- Ubuntu/Debian Server
- Node.js 16+ installed
- Python 3.8+ installed
- MongoDB installed
- nginx installed

#### Steps:

1. **Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python
sudo apt install -y python3 python3-pip python3-venv

# Install MongoDB
sudo apt install -y mongodb

# Install nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

2. **Clone and Setup Project**
```bash
cd /var/www
git clone <your-repo-url> disaster-relief-ai
cd disaster-relief-ai

# Backend setup
cd backend
npm install --production
cp .env.example .env
# Edit .env with production values

# Frontend setup
cd ../frontend
npm install
npm run build

# Python setup
cd ..
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Start Services with PM2**
```bash
# Start backend
cd backend
pm2 start server.js --name disaster-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

4. **Configure nginx**
```bash
sudo nano /etc/nginx/sites-available/disaster-relief
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/disaster-relief-ai/frontend/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/disaster-relief /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Setup SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option 2: Docker Deployment

#### 1. Create Dockerfile for Backend
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

#### 2. Create Dockerfile for Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Create docker-compose.yml
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: disaster-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: disaster_relief_ai

  backend:
    build: ./backend
    container_name: disaster-backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/disaster_relief_ai
      - PORT=5000
    depends_on:
      - mongodb
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    container_name: disaster-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo-data:
```

#### 4. Deploy with Docker
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

### Option 3: Cloud Platform Deployment

#### Heroku Deployment

1. **Install Heroku CLI**
```bash
npm install -g heroku
```

2. **Create Heroku Apps**
```bash
# Backend
cd backend
heroku create disaster-relief-backend

# Add MongoDB addon
heroku addons:create mongolab

# Deploy
git push heroku main
```

3. **Frontend (Vercel/Netlify)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

#### AWS Deployment

1. **EC2 Instance Setup**
- Launch Ubuntu EC2 instance
- Configure security groups (ports 80, 443, 22)
- Follow traditional server deployment steps

2. **S3 + CloudFront for Frontend**
```bash
# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name

# Configure CloudFront distribution
```

3. **Elastic Beanstalk for Backend**
```bash
# Install EB CLI
pip install awsebcli

# Initialize
cd backend
eb init

# Deploy
eb create disaster-relief-prod
eb deploy
```

---

## 🔐 Security Checklist

- [ ] Change default MongoDB credentials
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable CORS for specific domains only
- [ ] Regular security updates
- [ ] Implement authentication/authorization
- [ ] Use helmet.js security headers
- [ ] Setup backup strategy

---

## 📊 Monitoring & Logging

### Setup PM2 Monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Application Performance Monitoring
Consider integrating:
- New Relic
- DataDog
- Sentry (for error tracking)

### Log Management
```bash
# View logs
pm2 logs disaster-backend

# Save logs to file
pm2 logs --lines 1000 > logs.txt
```

---

## 🔄 Continuous Integration/Deployment

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd backend && npm install
        cd ../frontend && npm install
    
    - name: Run tests
      run: |
        cd backend && npm test
        cd ../frontend && npm test
    
    - name: Build frontend
      run: cd frontend && npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/disaster-relief-ai
          git pull
          cd backend && npm install
          pm2 restart disaster-backend
```

---

## 🔧 Environment Variables for Production

```bash
# backend/.env (Production)
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://username:password@host:27017/disaster_relief_ai
JWT_SECRET=your-super-secure-jwt-secret
OPENWEATHER_API_KEY=your-api-key
CORS_ORIGIN=https://your-domain.com
```

---

## 📈 Scaling Strategies

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Multiple backend instances
- MongoDB replica set

### Vertical Scaling
- Upgrade server resources
- Optimize database queries
- Implement caching (Redis)

### Database Optimization
```bash
# Create indexes
db.disasters.createIndex({ "date": -1 })
db.predictions.createIndex({ "requestedAt": -1 })
```

---

## 💾 Backup Strategy

### Database Backup
```bash
# Daily MongoDB backup
mongodump --uri="mongodb://localhost:27017/disaster_relief_ai" --out=/backups/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://localhost:27017/disaster_relief_ai" /backups/20240101
```

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

---

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Database backed up
- [ ] SSL certificate installed
- [ ] DNS configured
- [ ] Monitoring setup
- [ ] Error tracking configured
- [ ] PM2 process manager running
- [ ] Nginx configured and tested
- [ ] Firewall rules set
- [ ] Backup strategy implemented
- [ ] CI/CD pipeline configured
- [ ] Performance testing completed
- [ ] Security audit completed

---

**Ready for Production! 🚀**














