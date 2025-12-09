# Deployment Guide

This guide covers deploying Service Dash to production using **Vercel** (frontend) and **Railway** (backend).

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │     │   Railway       │     │   DataSync API  │
│   (Frontend)    │────▶│   (Backend)     │────▶│   (AWS)         │
│   Next.js       │     │   Express.js    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │   (Railway)     │
                        └─────────────────┘
```

## Prerequisites

- GitHub account with repository access
- [Vercel account](https://vercel.com) (free tier works)
- [Railway account](https://railway.app) (free tier works)
- OIDC provider configured (Google, Auth0, Okta, etc.)
- DataSync API credentials

---

## Part 1: Backend Deployment (Railway)

### Step 1: Create Railway Project

1. Go to [Railway](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will detect it's a Node.js app

### Step 2: Configure Root Directory

In Railway project settings:
- Set **Root Directory** to `backend`

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will automatically set `DATABASE_URL` environment variable

### Step 4: Set Environment Variables

In Railway → **Variables** tab, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `PORT` | `3001` | Server port (Railway sets this automatically) |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL |
| `OIDC_ISSUER_URL` | `https://accounts.google.com` | Your OIDC provider |
| `DATASYNC_URL` | `https://datasync.nextreasonservices.com` | DataSync API URL |
| `DATASYNC_API_KEY` | `your-api-key` | DataSync API key |

> Note: `DATABASE_URL` is automatically set by Railway when you add PostgreSQL

### Step 5: Deploy

Railway will automatically deploy when you push to `main` branch.

### Step 6: Get Backend URL

After deployment, Railway provides a URL like:
```
https://service-dash-backend-production.up.railway.app
```

Save this URL for the frontend configuration.

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Create Vercel Project

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Set **Root Directory** to `frontend`
5. Framework will be auto-detected as Next.js

### Step 2: Set Environment Variables

In Vercel → **Settings** → **Environment Variables**, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel URL |
| `NEXTAUTH_SECRET` | `<random-string>` | Generate with `openssl rand -base64 32` |
| `OIDC_ISSUER_URL` | `https://accounts.google.com` | Your OIDC provider |
| `OIDC_CLIENT_ID` | `your-client-id` | From your OIDC provider |
| `OIDC_CLIENT_SECRET` | `your-client-secret` | From your OIDC provider |
| `NEXT_PUBLIC_OIDC_ISSUER_URL` | `https://accounts.google.com` | Same as OIDC_ISSUER_URL |
| `NEXT_PUBLIC_OIDC_CLIENT_ID` | `your-client-id` | Same as OIDC_CLIENT_ID |
| `NEXT_PUBLIC_API_URL` | `https://your-backend.railway.app` | Railway backend URL |

### Step 3: Deploy

Click **"Deploy"** - Vercel will build and deploy automatically.

### Step 4: Update OIDC Provider

Add your Vercel URL to your OIDC provider's allowed redirect URIs:
```
https://your-app.vercel.app/api/auth/callback/oidc
```

---

## Part 3: GitHub Actions (Automatic Deployments)

### Required Secrets

Add these secrets in GitHub → **Settings** → **Secrets and variables** → **Actions**:

| Secret | How to Get |
|--------|------------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Vercel ID |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General → Project ID |
| `RAILWAY_TOKEN` | Railway → Account Settings → Tokens → Create |

### Workflow

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:

1. **On Pull Request to `main`**: Run linting and build checks
2. **On Push to `main`**: Deploy frontend to Vercel and backend to Railway

---

## Environment Variables Reference

### Frontend (Vercel)

```bash
# Required
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
OIDC_ISSUER_URL=https://accounts.google.com
OIDC_CLIENT_ID=your-oidc-client-id
OIDC_CLIENT_SECRET=your-oidc-client-secret
NEXT_PUBLIC_OIDC_ISSUER_URL=https://accounts.google.com
NEXT_PUBLIC_OIDC_CLIENT_ID=your-oidc-client-id
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Backend (Railway)

```bash
# Required
DATABASE_URL=<auto-set-by-railway>
OIDC_ISSUER_URL=https://accounts.google.com
FRONTEND_URL=https://your-app.vercel.app
DATASYNC_URL=https://datasync.nextreasonservices.com
DATASYNC_API_KEY=your-datasync-api-key

# Optional
PORT=3001
```

---

## Custom Domain Setup

### Vercel (Frontend)

1. Go to Project → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain
5. Update OIDC provider redirect URIs

### Railway (Backend)

1. Go to Service → **Settings** → **Domains**
2. Add custom domain or use Railway's generated domain
3. Update frontend's `NEXT_PUBLIC_API_URL`

---

## Troubleshooting

### Backend won't start

1. Check Railway logs for errors
2. Verify `DATABASE_URL` is set correctly
3. Run migrations: Railway should run `prisma migrate deploy` on start

### Authentication fails

1. Verify OIDC credentials match between frontend and provider
2. Check redirect URI is added to OIDC provider
3. Ensure `NEXTAUTH_SECRET` is set

### CORS errors

1. Verify `FRONTEND_URL` in backend matches your Vercel URL
2. Check Railway backend is running

### DataSync API errors

1. Verify `DATASYNC_URL` and `DATASYNC_API_KEY` are correct
2. Check DataSync service health at `/health`

---

## Local Development

### Start Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Files
Copy the example files:
```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Then fill in your local development values.

