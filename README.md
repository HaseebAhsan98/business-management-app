# Business Management Web Application (Wholesale & Distribution)

A production-grade wholesale and distribution business management system built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Supabase**.

---

## Features

- **Rapid Order Entry (< 1 min)**: Area $\rightarrow$ Party $\rightarrow$ Category $\rightarrow$ Product workflow with minimal typing.
- **Dynamic Customer Pricing**: Customer-specific profit per carton or fixed rates with an automated rate waterfall.
- **FIFO Batch Inventory**: Stock tracked batch-by-batch with exact purchase cost snapshotting upon delivery.
- **Shortage Block**: Strict inventory integrity; negative inventory is completely blocked.
- **Payment Allocation Waterfall**: Payments automatically reduce opening balance first, then chronologically oldest unpaid bills.
- **Credit Recovery Reminders**: Daily overdue reminders, customer promise dates, and one-tap WhatsApp prefilled links.
- **Role-Based Access Control**: Strict permissions for `OWNER`, `MANAGER`, and `SALESMAN` (cost and profit figures strictly hidden from salesmen).
- **Executive Reports & Daybook**: Sales, profit (Latest Purchase Rate vs FIFO), receivables aging, payables, stock movements, and daily cash book with PDF/Excel export.

---

## Technology Stack

- **Frontend & App Framework**: Next.js 14+ (App Router, Server Actions, Route Handlers)
- **Database & Backend**: Supabase (PostgreSQL, Supabase Auth, Supabase Storage, PostgreSQL Functions/RPCs)
- **Styling & UI**: Tailwind CSS, shadcn/ui, Lucide React
- **Data Tables & Charts**: TanStack Table v8, Recharts
- **PDF & Excel**: jsPDF, ExcelJS
- **Validation**: Zod, React Hook Form

---

## Getting Started

### 1. Supabase Setup
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase Dashboard.
3. Run the migrations located in `./supabase/migrations/`:
   - `20261123000001_initial_schema.sql` (Tables, constraints, indexes)
   - `20261123000002_stored_procedures.sql` (FIFO allocation, payment waterfall, stock checking RPCs)
   - `20261123000003_seed_data.sql` (3 categories, 10 companies, 30 products, 10 parties, 2 suppliers)
4. Retrieve your Supabase Project URL and Anon Key from **Project Settings $\rightarrow$ API**.

### 2. Local Environment Setup
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploying to Vercel via GitHub

1. **Initialize Git & Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Wholesale Business Management App"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```
2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Import your GitHub repository.
   - Under **Environment Variables**, add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Click **Deploy**. Vercel will automatically build and publish your Next.js application!
