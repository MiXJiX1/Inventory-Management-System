# Inventory Management System

A professional Full Stack Inventory Management System built with modern web technologies.

## 🚀 Tech Stack

### Frontend
-   **Framework**: Next.js 14+ (App Router)
-   **Language**: TypeScript
-   **Styling**: TailwindCSS + shadcn/ui
-   **State Management**: TanStack Query (React Query)
-   **Forms**: React Hook Form + Zod
-   **HTTP Client**: Axios

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Language**: TypeScript
-   **Database ORM**: Prisma
-   **Database**: PostgreSQL
-   **Authentication**: JWT (Access + Refresh Tokens) + HttpOnly Cookies
-   **Validation**: Zod

## ✨ Features

-   **Authentication**: Secure Register/Login flow with automatic token refreshing.
-   **Dashboard**: Real-time overview of total stock, low stock items, and more.
-   **Product Management**:
    -   Create, Read, Update, Delete (CRUD) products.
    -   Pagination, Search, and Filtering.
    -   Status tracking (In Stock, Low Stock, Out of Stock).
-   **Responsive Design**: text-based mobile friendly UI.

## 🛠️ Setup Instructions

### Prerequisites
-   Node.js (v18+)
-   PostgreSQL Database

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
    JWT_SECRET="your_jwt_secret"
    JWT_REFRESH_SECRET="your_refresh_secret"
    FRONTEND_URL="http://localhost:3000"
    PORT=4000
    ```
-   Run migrations:
    ```bash
    npx prisma migrate dev --name init
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

## 📂 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── middlewares/  # Auth & Validation
│   │   ├── routes/       # API Routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helpers
│   └── prisma/           # DB Schema
│
└── frontend/
    ├── app/              # Next.js Pages
    ├── components/
    │   ├── ui/           # Shadcn Components
    │   └── layout/       # Sidebar, Header
    ├── lib/              # Utils & API client
    └── services/         # API calls
```
