# TradeSense Deployment Guide

## Free Deployment: Render (Backend) + Vercel (Frontend)

---

## Step 1: Create Free Accounts

1. **Render**: https://render.com (Sign up with GitHub)
2. **Vercel**: https://vercel.com (Sign up with GitHub)
3. **Upstash** (Free Redis): https://upstash.com
4. **Neon** (Optional - Better free PostgreSQL): https://neon.tech

---

## Step 2: Push Code to GitHub

```bash
# If not already on GitHub
git init
git add .
git commit -m "Prepare for deployment"
git remote add origin https://github.com/YOUR_USERNAME/tradesense.git
git push -u origin main
```

---

## Step 3: Set Up Free Redis (Upstash)

1. Go to https://console.upstash.com
2. Create a new Redis database (Free tier)
3. Select region closest to you
4. Copy the **Redis URL** (looks like: `redis://default:xxx@xxx.upstash.io:6379`)

---

## Step 4: Deploy Backend on Render

### Option A: One-Click Deploy (Recommended)
1. Go to https://render.com/deploy
2. Connect your GitHub repository
3. Select the `backend` folder as root directory

### Option B: Manual Setup
1. Go to https://dashboard.render.com
2. Click **New +** > **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `tradesense-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT app:app`

### Environment Variables (Add in Render Dashboard)
```
FLASK_ENV=production
SECRET_KEY=<click Generate>
JWT_SECRET_KEY=<click Generate>
DATABASE_URL=<Render will auto-fill if using Render PostgreSQL>
REDIS_URL=<your Upstash Redis URL>
CORS_ORIGINS=https://your-app.vercel.app
GEMINI_API_KEY=<your Gemini API key>
STRIPE_SECRET_KEY=<your Stripe secret key>
STRIPE_PUBLISHABLE_KEY=<your Stripe publishable key>
PAYPAL_CLIENT_ID=<your PayPal client ID>
PAYPAL_CLIENT_SECRET=<your PayPal secret>
SENDGRID_API_KEY=<your SendGrid API key>
```

### Add PostgreSQL Database
1. In Render Dashboard, click **New +** > **PostgreSQL**
2. Name: `tradesense-db`
3. Plan: **Free**
4. Copy the **Internal Database URL**
5. Add it as `DATABASE_URL` in your web service environment variables

---

## Step 5: Deploy Frontend on Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Environment Variables (Add in Vercel Dashboard)
```
VITE_API_URL=https://tradesense-api.onrender.com/api
```
(Replace with your actual Render backend URL)

4. Click **Deploy**

---

## Step 6: Update CORS

After getting your Vercel URL (e.g., `https://tradesense.vercel.app`):

1. Go to Render Dashboard > Your Web Service > Environment
2. Update `CORS_ORIGINS` to your Vercel URL
3. Click **Save Changes** (will auto-redeploy)

---

## Step 7: Initialize Database

After first deployment, run database migrations:

1. In Render Dashboard, go to your Web Service
2. Click **Shell** tab
3. Run:
```bash
flask db upgrade
```

---

## Your Live URLs

After deployment:
- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://tradesense-api.onrender.com/api`

---

## Troubleshooting

### Backend not starting?
- Check Render logs for errors
- Verify all environment variables are set
- Make sure `gunicorn` is in requirements.txt

### Database connection issues?
- Verify DATABASE_URL is correct
- Run `flask db upgrade` in Render Shell

### CORS errors?
- Make sure CORS_ORIGINS matches your Vercel URL exactly
- Include `https://` prefix

### Redis connection issues?
- Verify Upstash Redis URL is correct
- Check Upstash dashboard for connection limits

---

## Free Tier Limits

| Service | Limit |
|---------|-------|
| Render Web Service | 750 hrs/month, sleeps after 15min inactivity |
| Render PostgreSQL | 1GB storage, 90 days then deleted |
| Vercel | Unlimited deployments, 100GB bandwidth |
| Upstash Redis | 10K commands/day |

---

## Upgrading for Production

For a production app with more traffic:
1. **Render**: Upgrade to Starter ($7/month) - no sleep
2. **Neon**: Better PostgreSQL free tier (0.5GB, no 90-day limit)
3. **Upstash**: Pro plan for more Redis commands
