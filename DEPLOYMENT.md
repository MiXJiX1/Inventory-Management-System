# 🚀 Deployment Guide

This guide outlines the steps to deploy the Inventory Management System to a production environment.

## 1. Database Setup (Supabase / PostgreSQL)

The application requires a PostgreSQL database. We recommend **Supabase** or **Railway**.

### Steps:
1.  Create a new project on [Supabase](https://supabase.com/).
2.  Go to **Project Settings > Database** and copy the **Connection String** (use the "Transaction" mode connection string if available, otherwise "Session" mode is fine for standard apps).
3.  Save this as your `DATABASE_URL`.

## 2. Backend Deployment (Render)

We recommend **Render** for hosting the Node.js/Express backend.

### Steps:
1.  Push your code to a GitHub repository.
2.  Create a new **Web Service** on [Render](https://render.com/).
3.  Connect your GitHub repository.
4.  **Configuration**:
    -   **Root Directory**: `backend`
    -   **Runtime**: `Node`
    -   **Build Command**: `npm install && npx prisma generate && npx tsc`
    -   **Start Command**: `node dist/index.js`
5.  **Environment Variables**:
    Add the following environment variables in the Render dashboard:
    -   `DATABASE_URL`: `postgresql://...` (From Step 1)
    -   `JWT_SECRET`: `...` (Generate a strong random string)
    -   `JWT_REFRESH_SECRET`: `...` (Generate a different strong random string)
    -   `FRONTEND_URL`: `https://your-frontend-app.vercel.app` (You will get this after deploying frontend, come back to update it)
    -   `NODE_ENV`: `production`

## 3. Frontend Deployment (Vercel)

We recommend **Vercel** for hosting the Next.js frontend.

### Steps:
1.  Import your GitHub repository into [Vercel](https://vercel.com/).
2.  **Configuration**:
    -   **Framework Preset**: Next.js
    -   **Root Directory**: `frontend`
3.  **Environment Variables**:
    Add the following environment variable:
    -   `NEXT_PUBLIC_API_URL`: `https://your-backend-app.onrender.com` (Copy the URL from your Render backend)
4.  Click **Deploy**.

## 4. Post-Deployment Configuration

1.  **CORS Configuration**: Once your Frontend is live, copy its domain (e.g., `https://inventory-app.vercel.app`).
2.  Go back to your **Render Backend** settings -> Environment Variables.
3.  Update (or Add) `FRONTEND_URL` with your Vercel domain.
4.  **Database Migration**:
    Render might not run migrations automatically on deploy unless configured in the build command.
    -   **Option A**: Add `npx prisma migrate deploy` to your **Build Command** (e.g., `npm install && npx prisma generate && npx tsc && npx prisma migrate deploy`).
    -   **Option B**: Connect to your database locally using the production `DATABASE_URL` in your `.env` temporarily and run `npx prisma migrate deploy`.

## 5. Verification

1.  Open your Vercel URL.
2.  Try to **Reset Database/Seed** (if you have an endpoint for it) or manually create an Admin user in the database if your seed script didn't run.
    -   *Note*: If you need to seed the production database, you can run `npx prisma db seed` from your local machine while connected to the production database URL.
3.  Login and verify dashboard loads.
