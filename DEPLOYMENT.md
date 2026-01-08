# 🚀 SmartChef - Deployment Guide

## Quick Deployment Checklist

### ✅ Pre-Deployment
- [ ] All features tested locally
- [ ] Backend running on port 8001
- [ ] Frontend running on port 3000
- [ ] MongoDB Atlas connected
- [ ] Environment variables configured
- [ ] Dependencies installed

---

## 🔧 Environment Setup

### Backend (.env)
```env
# MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smartchef_db?retryWrites=true&w=majority

# Optional
PORT=8001
DEBUG=False
```

### Frontend (No .env needed)
API endpoint is hardcoded to `http://localhost:8001` for development.  
For production, update all `fetch()` calls to production URL.

---

## 📦 Local Development

### Start Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

**Backend URL:** `http://localhost:8001`  
**API Docs:** `http://localhost:8001/docs`

### Start Frontend
```bash
cd frontend
npm install
npm start
```

**Frontend URL:** `http://localhost:3000`

---

## 🌐 Production Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend)

#### Deploy Frontend to Vercel
```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

**Steps:**
1. Link to GitHub repository
2. Select `frontend` folder as root
3. Build command: `npm run build`
4. Output directory: `build`
5. Environment variables: None needed (update API URLs in code)

**Update API URLs:**
```javascript
// Replace all instances of
const res = await fetch(`http://localhost:8001/...`)

// With
const res = await fetch(`https://your-backend.onrender.com/...`)
```

#### Deploy Backend to Render
1. Go to [render.com](https://render.com)
2. Create New → Web Service
3. Connect GitHub repo
4. Root directory: `backend`
5. Build command: `pip install -r requirements.txt`
6. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Add environment variable: `MONGO_URI`

**CORS Update:**
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.vercel.app"],  # Update this
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Option 2: Heroku (Both)

#### Deploy Backend to Heroku
```bash
cd backend

# Create Procfile
echo "web: uvicorn app.main:app --host 0.0.0.0 --port $PORT" > Procfile

# Create runtime.txt
echo "python-3.13.0" > runtime.txt

# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create Heroku app
heroku create smartchef-backend

# Set environment variable
heroku config:set MONGO_URI="your_mongodb_uri"

# Deploy
git push heroku main
```

#### Deploy Frontend to Heroku
```bash
cd frontend

# Add serve to package.json
npm install -g serve

# Create Procfile
echo "web: npx serve -s build -l $PORT" > Procfile

# Build production
npm run build

# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create Heroku app
heroku create smartchef-frontend

# Deploy
git push heroku main
```

---

### Option 3: Docker (Containerized)

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

RUN npm install -g serve

CMD ["serve", "-s", "build", "-l", "3000"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URI=${MONGO_URI}
    
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

**Run:**
```bash
docker-compose up -d
```

---

### Option 4: AWS (Advanced)

#### EC2 + S3 + CloudFront
1. **Backend:** Deploy to EC2 instance
2. **Frontend:** Build and upload to S3
3. **CDN:** CloudFront distribution
4. **Database:** MongoDB Atlas (already cloud)

**Steps:**
1. Launch EC2 Ubuntu instance
2. Install Python 3.13
3. Clone repo and install backend
4. Setup nginx reverse proxy
5. Build frontend: `npm run build`
6. Upload `build/` to S3 bucket
7. Create CloudFront distribution pointing to S3

---

## 🔒 Security Checklist

### Backend
- [ ] Environment variables in .env (not in code)
- [ ] CORS restricted to specific origins
- [ ] MongoDB connection string secured
- [ ] No sensitive data in logs
- [ ] HTTPS enabled in production
- [ ] Rate limiting on API endpoints (future)

### Frontend
- [ ] API URLs updated to production
- [ ] No console.log in production
- [ ] Build minified and optimized
- [ ] Assets served over HTTPS
- [ ] localStorage sanitized

---

## 📊 Post-Deployment Testing

### Backend Health Check
```bash
curl https://your-backend.com/
# Expected: {"message": "Welcome to SmartChef API"}
```

### Frontend Smoke Tests
1. [ ] Open homepage → Loads correctly
2. [ ] Register → Creates account
3. [ ] Login → Authenticates
4. [ ] Upload image → Analyzes
5. [ ] View history → Shows analyses
6. [ ] Toggle dark mode → Persists
7. [ ] Export PDF → Downloads
8. [ ] Mobile view → Responsive

### Database Verification
```bash
# Run check_database.py
python backend/check_database.py
```

---

## 🐛 Common Deployment Issues

### Issue 1: CORS Error
**Symptom:** `Access-Control-Allow-Origin` error in browser console

**Solution:**
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 2: MongoDB Connection Timeout
**Symptom:** `pymongo.errors.ServerSelectionTimeoutError`

**Solution:**
1. Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for all IPs)
2. Verify MONGO_URI format
3. Check network/firewall settings

### Issue 3: Build Fails
**Symptom:** `npm run build` fails with errors

**Solution:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue 4: 404 on Refresh
**Symptom:** Page refreshes return 404 on React Router paths

**Solution:**
```javascript
// Add to package.json for serve
"homepage": ".",

// Or configure nginx
location / {
  try_files $uri /index.html;
}
```

---

## 📈 Monitoring & Analytics

### Recommended Tools
- **Backend:** Sentry (error tracking)
- **Frontend:** Google Analytics (user analytics)
- **Uptime:** UptimeRobot (availability monitoring)
- **Logs:** Papertrail or Loggly

### Setup Sentry (Optional)
```bash
npm install @sentry/react
```

```javascript
// frontend/src/index.js
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production"
});
```

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy SmartChef

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
  
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## 📝 Environment Variables Reference

### Backend Required
```env
MONGO_URI=mongodb+srv://...        # MongoDB connection string
PORT=8001                          # Server port (optional)
```

### Backend Optional
```env
DEBUG=False                        # Debug mode
LOG_LEVEL=INFO                     # Logging level
MAX_UPLOAD_SIZE=5242880           # Max file size (5MB)
```

### Frontend (Update in code)
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
```

---

## 🎯 Performance Optimization

### Backend
- [ ] Enable gzip compression
- [ ] Add Redis caching (future)
- [ ] Optimize MongoDB queries
- [ ] CDN for static assets

### Frontend
- [ ] Code splitting with React.lazy
- [ ] Image optimization
- [ ] Service Worker for caching
- [ ] Minify CSS/JS

---

## 📞 Support & Maintenance

### Regular Tasks
- [ ] Monitor error logs weekly
- [ ] Update dependencies monthly
- [ ] Backup MongoDB weekly
- [ ] Check uptime daily
- [ ] Review performance metrics

### Emergency Contacts
- **MongoDB Atlas:** [support@mongodb.com](mailto:support@mongodb.com)
- **Vercel:** [support@vercel.com](mailto:support@vercel.com)
- **Render:** [support@render.com](mailto:support@render.com)

---

## 🚀 Launch Checklist

### Pre-Launch
- [ ] All features working
- [ ] Mobile responsive tested
- [ ] Dark mode working
- [ ] PDF export functional
- [ ] Charts rendering
- [ ] Database backups enabled
- [ ] Error tracking setup
- [ ] Analytics configured

### Launch Day
- [ ] Deploy backend first
- [ ] Test backend endpoints
- [ ] Deploy frontend
- [ ] Update DNS (if custom domain)
- [ ] Test production site
- [ ] Announce launch

### Post-Launch
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Fix critical bugs ASAP
- [ ] Plan v2.1 features

---

**🎉 Ready to Deploy SmartChef v2.0! 🎉**

For questions: [support@smartchef.ro](mailto:support@smartchef.ro)
