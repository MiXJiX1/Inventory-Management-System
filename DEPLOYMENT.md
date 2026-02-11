# Deployment Guide

## 1. Database (PostgreSQL)
You can use **Supabase** or **Railway** for a free managed PostgreSQL database.

1.  Create a project on [Supabase](https://supabase.com/).
2.  Get the `DATABASE_URL` (Transaction Mode or Session Mode, usually port 6543 or 5432).
3.  Save this URL for the Backend environment variables.

## 2. Backend (Render / Railway)

### Option A: Render
1.  Push your code to GitHub.
2.  Create a new **Web Service** on [Render](https://render.com/).
3.  Connect your repository.
4.  **Root Directory**: `backend`
5.  **Build Command**: `npm install && npx prisma generate && npx tsc`
6.  **Start Command**: `node dist/index.js`
7.  **Environment Variables**:
    -   `DATABASE_URL`: (From Step 1)
    -   `JWT_SECRET`: (Generate a secure string)
    -   `JWT_REFRESH_SECRET`: (Generate a secure string)
    -   `FRONTEND_URL`: `https://your-frontend-domain.vercel.app`
    -   `NODE_ENV`: `production`

### Option B: Railway
1.  Create a new project from GitHub repo.
2.  Set Root Directory to `backend`.
3.  Add variables in the dashboard.
4.  Railway automatically detects `npm run start` or custom start command.

## 3. Frontend (Vercel)

1.  Push your code to GitHub.
2.  Import project into [Vercel](https://vercel.com/).
3.  **Root Directory**: `frontend`
4.  **Environment Variables**:
    -   `NEXT_PUBLIC_API_URL`: `https://your-backend-service.onrender.com` (The URL from Step 2)
5.  Deploy.

## 4. Final Configuration

1.  Once Frontend is deployed, go back to **Backend** settings.
2.  Update `FRONTEND_URL` to match your actual Vercel domain (e.g., `https://inventory-app.vercel.app`).
3.  This ensures CORS allows requests from your frontend.
