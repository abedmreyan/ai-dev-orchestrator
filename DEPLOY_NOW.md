# 🚀 Deploy Now - Step-by-Step Commands

## ✅ Step 1: Azure SQL Schema - COMPLETE

Schema successfully deployed with:
- 8 Aether agents
- 1 demo project (Aether CRM)
- 1 admin user (Abed@aethersystems.co)

---

## 📦 Step 2: Push to GitHub

### Create Repository
1. Go to https://github.com/new
2. Repository name: `ai-dev-orchestrator`
3. Description: "AI-powered development orchestrator with Google Tasks sync"
4. Visibility: **Private** (recommended)
5. Do NOT initialize with README, .gitignore, or license
6. Click "Create repository"

### Push Code
```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ai-dev-orchestrator.git

# Push to GitHub
git push -u origin main
```

**Expected Output**: 
```
Enumerating objects: 162 files
Writing objects: 100%
Branch 'main' set up to track remote branch 'main'
```

---

## 🌐 Step 3: Deploy Frontend to Netlify

### Option A: Netlify CLI (Fastest)

```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator
netlify deploy --prod --dir=dist/client

# Follow prompts:
# - Create & configure a new site
# - Choose a site name (e.g., aether-orchestrator)
# - Confirm deployment
```

### Option B: Netlify Dashboard (Manual)

1. **Go to** https://app.netlify.com
2. **Click** "Add new site" → "Import an existing project"
3. **Connect** to GitHub
4. **Select** `ai-dev-orchestrator` repository
5. **Configure build**:
   - Build command: `npm run build`
   - Publish directory: `dist/client`
   - Base directory: (leave empty)
6. **Add environment variable**:
   - Key: `VITE_API_URL`
   - Value: `https://aether-orchestrator-api.azurewebsites.net`
7. **Click** "Deploy site"
8. **Wait** for deployment (2-3 minutes)

**Save your Netlify URL**: `https://your-site-name.netlify.app`

---

## ☁️ Step 4: Deploy Backend to Azure App Service

### 4.1: Login to Azure

```bash
# Login to Azure
az login

# Verify subscription
az account show
```

### 4.2: Create Resource Group (if not exists)

```bash
# Check if exists
az group show --name ai-orchestrator-rg

# Create if needed
az group create \
  --name ai-orchestrator-rg \
  --location eastus2
```

### 4.3: Create App Service Plan

```bash
az appservice plan create \
  --name aether-orchestrator-plan \
  --resource-group ai-orchestrator-rg \
  --sku B1 \
  --is-linux
```

### 4.4: Create Web App

```bash
az webapp create \
  --name aether-orchestrator-api \
  --resource-group ai-orchestrator-rg \
  --plan aether-orchestrator-plan \
  --runtime "NODE:20-lts"
```

### 4.5: Configure Environment Variables

```bash
az webapp config appsettings set \
  --name aether-orchestrator-api \
  --resource-group ai-orchestrator-rg \
  --settings \
    DATABASE_URL="Server=tcp:aether-orch-897256.database.windows.net,1433;Initial Catalog=orchestrator-db;Persist Security Info=False;User ID=orchestrator_admin;Password=AetherOrch#2025!Secure$Pass;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;" \
    AETHER_PROJECT_PATH=/home/site/wwwroot \
    MCP_SERVER_PATH=/home/site/mcp \
    DEEPSEEK_API_KEY=your-deepseek-api-key \
    PERPLEXITY_API_KEY=your-perplexity-api-key \
    GOOGLE_TASKS_SYNC_INTERVAL=15 \
    GOOGLE_TASKS_AUTO_SYNC=false \
    PORT=8080 \
    NODE_ENV=production
```

**Note**: GOOGLE_TASKS_AUTO_SYNC set to false until we configure it

### 4.6: Enable HTTPS Only

```bash
az webapp update \
  --name aether-orchestrator-api \
  --resource-group ai-orchestrator-rg \
  --https-only true
```

### 4.7: Configure CORS

```bash
# Replace with your Netlify URL from Step 3
az webapp cors add \
  --name aether-orchestrator-api \
  --resource-group ai-orchestrator-rg \
  --allowed-origins https://your-site-name.netlify.app
```

### 4.8: Create Deployment Zip

```bash
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator

# Create zip excluding unnecessary files
zip -r dist.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "*.md" \
  -x ".env*" \
  -x "dist.zip"
```

### 4.9: Deploy to Azure

```bash
az webapp deployment source config-zip \
  --name aether-orchestrator-api \
  --resource-group ai-orchestrator-rg \
  --src dist.zip
```

**Wait** for deployment (5-10 minutes)

### 4.10: Verify Backend

```bash
# Check if backend is running
curl https://aether-orchestrator-api.azurewebsites.net/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## 🔄 Step 5: Update Frontend with Backend URL

### Update Netlify Environment Variable

```bash
# Using Netlify CLI
netlify env:set VITE_API_URL https://aether-orchestrator-api.azurewebsites.net

# Trigger rebuild
netlify deploy --prod --dir=dist/client
```

**Or via Netlify Dashboard:**
1. Go to Site settings → Environment variables
2. Update `VITE_API_URL` to `https://aether-orchestrator-api.azurewebsites.net`
3. Trigger new deployment

---

## 🎯 Step 6: Configure Google Tasks

### Option A: Via Azure Portal SSH

1. Go to Azure Portal
2. Navigate to App Service → aether-orchestrator-api
3. Click "SSH" in left menu
4. Run:
```bash
cd /home/site/wwwroot
npm run setup:google-tasks
```

### Option B: Via Azure CLI

```bash
# SSH into the app
az webapp ssh --name aether-orchestrator-api --resource-group ai-orchestrator-rg

# Run setup
cd /home/site/wwwroot
npm run setup:google-tasks
```

Follow prompts to select your Google Tasks list.

After setup, enable auto-sync:

```bash
az webapp config appsettings set \
  --name aether-orchestrator-api \
  --resource-group ai-orchestrator-rg \
  --settings GOOGLE_TASKS_AUTO_SYNC=true
```

---

## ✅ Step 7: Verify Deployment

### Check Frontend
```bash
# Open frontend
open https://your-site-name.netlify.app

# Expected: Dashboard loads, shows login
```

### Check Backend
```bash
# Health check
curl https://aether-orchestrator-api.azurewebsites.net/api/health

# List agents
curl https://aether-orchestrator-api.azurewebsites.net/api/trpc/agents.list
```

### Check Database Connection
```bash
# From local machine with DATABASE_URL configured
cd /Users/abedmreyan/Desktop/aether_-foundation/ai_dev_orchestrator
npm run verify:schema
```

### Test Complete Flow
1. Open frontend URL
2. Navigate to Projects
3. Create a new project
4. Navigate to Tasks
5. Create a task
6. Verify task appears in Google Tasks

---

## 📊 Deployment URLs

After completing all steps, save these URLs:

```
Frontend:  https://your-site-name.netlify.app
Backend:   https://aether-orchestrator-api.azurewebsites.net
Database:  aether-orch-897256.database.windows.net
GitHub:    https://github.com/YOUR_USERNAME/ai-dev-orchestrator
```

---

## 🐛 Troubleshooting

### Frontend not loading
- Check Netlify build logs
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors

### Backend not responding
- Check Azure App Service logs: `az webapp log tail --name aether-orchestrator-api --resource-group ai-orchestrator-rg`
- Verify all environment variables are set
- Check DATABASE_URL is correct

### Database connection fails
- Verify firewall rules in Azure SQL
- Check connection string
- Ensure database schema is deployed

### Google Tasks not syncing
- Verify MCP server is accessible
- Check GOOGLE_TASKS_LIST_ID is set
- Run test: `npm run test:google-tasks`

---

## 💰 Monthly Costs

- Azure SQL Database: ~$5
- Azure App Service: ~$13
- Netlify: $0
- **Total: ~$18/month**

---

## 🎉 Success!

Once all steps are complete, you have:
- ✅ Frontend deployed on Netlify
- ✅ Backend deployed on Azure
- ✅ Database on Azure SQL
- ✅ Google Tasks syncing
- ✅ Code on GitHub

**Your AI Dev Orchestrator is now live!** 🚀

---

**Need Help?** Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed troubleshooting.

