# Inventory Management System

A professional, full-featured Inventory Management System built with modern web technologies, designed to streamline stock tracking, financial reporting, and operational security.

## 🚀 Tech Stack

### Frontend
-   **Framework**: Next.js 14+ (App Router)
-   **Language**: TypeScript
-   **Styling**: TailwindCSS + shadcn/ui
-   **Icons**: Lucide React
-   **State Management**: TanStack Query (React Query)
-   **Forms**: React Hook Form + Zod
-   **Charts**: Recharts
-   **HTTP Client**: Axios

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Language**: TypeScript
-   **Database ORM**: Prisma
-   **Database**: PostgreSQL (Supabase compatible)
-   **Authentication**: JWT (Access + Refresh Tokens) + HttpOnly Cookies
-   **Validation**: Zod

## ✨ Key Features

### 📦 Inventory & Product Management
-   **Complete CRUD**: Create, read, update, and delete products with ease.
-   **Stock Tracking**: Real-time tracking of stock levels with status indicators (In Stock, Low Stock, Out of Stock).
-   **Low Stock Alerts**: Visual badges and filters to quickly identify items below minimum stock levels.
-   **Import/Export**: Bulk import and export products via CSV.
-   **Categories**: Organize products into manageable categories.
-   **Stock Movements**: Track refined movements including **IN** (Purchase), **OUT** (Sale), and **ADJUST** (Manual Correction).

### 💰 Financials & Reporting
-   **Profit & Loss Report**: Dedicated section for financial health analysis.
-   **Visual Analytics**: Interactive charts for Sales Trends (Line), Net Profit (Bar), and Expense/Revenue Breakdown (Pie).
-   **Metrics**: Track Revenue, Cost of Goods Sold (COGS), Expenses, and Net Profit.
-   **Currency**: Optimized for Thai Baht (฿).
-   **Filtering**: Analyze financial data by custom date ranges and categories.

### 🔐 Security & Access Control
-   **Role-Based Access Control (RBAC)**: Distinguish between **Admin** (full access) and **Staff** (restricted access) roles.
-   **Secure Authentication**: Robust JWT implementation with automatic token refreshing and HttpOnly cookies.
-   **Auto-Logout**: Security feature that automatically logs out users after 10 minutes of inactivity.
-   **Audit Logs**: Comprehensive, searchable logs of all critical actions (Login, Create, Update, Delete) for accountability.

### 🎨 User Experience (UX)
-   **Mobile Responsiveness**: Fully responsive tailored for desktop and mobile usage.
-   **Modern UI**: Clean interface using `shadcn/ui` components with smooth animations.
-   **Smart Interactions**: Debounced search, skeleton loading states, and toast notifications (Success/Error).
-   **Confirmation Dialogs**: Safety checks for critical actions like deletion.

## 🛠️ Setup Instructions

### Prerequisites
-   Node.js (v18+)
-   PostgreSQL Database (Local or Supabase)

### 1. Clone the repository
```bash
git clone <repository-url>
cd inventory-management-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```
-   Create a `.env` file in `backend/`:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/inventory_db?schema=public"
    JWT_SECRET="your_super_secret_jwt_key"
    JWT_REFRESH_SECRET="your_super_secret_refresh_key"
    FRONTEND_URL="http://localhost:3000"
    PORT=4000
    ```
-   Run migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
-   Seed initial data (optional but recommended):
    ```bash
    npx ts-node prisma/seed.ts
    ```
-   Start server:
    ```bash
    npm run dev
    ```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
-   Create a `.env.local` file in `frontend/`:
    ```env
    NEXT_PUBLIC_API_URL="http://localhost:4000"
    ```
-   Start client:
    ```bash
    npm run dev
    ```

### 4. Access the App
Open `http://localhost:3000` in your browser.
-   **Default Admin Credentials** (if seeded):
    -   Email: `admin@example.com`
    -   Password: `password123`

## 📂 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/  # Logic for handling requests
│   │   ├── middlewares/  # Authentication & Validation guards
│   │   ├── routes/       # API Route definitions
│   │   ├── services/     # Business logic layer
│   │   └── utils/        # Helper functions & constants
│   └── prisma/           # Database Schema & Seeds
│
└── frontend/
    ├── app/              # Next.js App Router Pages
    ├── components/
    │   ├── ui/           # Reusable shadcn/ui components
    │   └── layout/       # App shell (Sidebar, Header)
    ├── lib/              # Utilities & Axios client
    └── hooks/            # Custom React hooks (e.g., use-debounce)
```
