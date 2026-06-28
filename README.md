# 📚 Library Management System

A modern, full-featured library management system built with Next.js 16, Prisma, and SQLite. Manage members, seats, floors, sections, payments, and WhatsApp notifications — all in one PWA-ready app.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Database](https://img.shields.io/badge/SQLite-Prisma-003B57?logo=sqlite&logoColor=white)
![UI](https://img.shields.io/badge/shadcn%2Fui-Teal-06B6D4)
![PWA](https://img.shields.io/badge/Installable-PWA-4285F4)

## ✨ Features

### Core Management
- **Dashboard** — Real-time stats, revenue charts, expiring members, activity feed
- **Members** — Full CRUD with search, filter by status/floor/section, bulk operations
- **Seats** — Visual seat grid, drag-and-drop allocation, batch creation with prefix
- **Floors & Sections** — Hierarchical management with cascade delete
- **Payments** — Auto-detect renewal dates, receipt generation (PDF), revenue tracking
- **Settings** — Library name, fee amount, WhatsApp configuration

### Smart Automation
- **Auto-Renewal Dates** — Renewals start from previous expiry (no lost days)
- **Payment-Driven Status** — Member status derived from last payment (active/expiring/expired/unpaid)
- **Activity Logging** — Full audit trail of all operations

### WhatsApp Integration
- **Baileys Microservice** — Independent Node.js service on port 3005
- **QR Code Scanning** — Connect via WhatsApp Web QR
- **Message Templates** — Renewal reminders, payment confirmations, welcome, expiry alerts
- **Bulk Reminders** — Send to all expiring/expired members at once
- **Receipt Sharing** — Send payment receipts directly via WhatsApp

### PWA (Installable App)
- **Web App Manifest** — Installable on Chrome, Edge, Android
- **Offline-Capable Layout** — Standalone display mode
- **App Icons** — 192×192 and 512×512 with favicon variants
- **Apple Web App** — Full iOS support with touch icon

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | SQLite via Prisma ORM |
| State | Zustand + TanStack Query |
| Animations | Framer Motion |
| Auth | JWT (httpOnly cookies) |
| Charts | Recharts |
| PDF | pdf-lib |
| WhatsApp | Baileys (Node.js microservice) |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm or bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/MuftukMall/library-management-system.git
cd library-management-system

# Install main app dependencies
npm install

# Set up database
npx prisma db push

# Start the main app
npm run dev
```

### WhatsApp Service (Optional)

```bash
# Navigate to the WhatsApp microservice
cd mini-services/whatsapp-service

# Install dependencies
npm install

# Start the service
npm run dev
```

The WhatsApp service runs on **port 3005** and is proxied through the main Next.js API.

### Default Login
- **Username:** `admin`
- **Password:** `admin123`

## 📁 Project Structure

```
├── public/                  # Static assets, PWA icons, manifest
├── prisma/
│   └── schema.prisma        # Database schema (9 models)
├── src/
│   ├── app/
│   │   ├── api/             # API routes (auth, members, payments, etc.)
│   │   ├── layout.tsx       # Root layout with PWA meta tags
│   │   └── page.tsx         # SPA entry point
│   ├── components/          # UI components
│   │   ├── members/         # Member management
│   │   ├── payments/        # Payment tracking
│   │   ├── seats/           # Seat allocation
│   │   ├── whatsapp/        # WhatsApp integration
│   │   └── layout/          # App shell, sidebar, command palette
│   ├── lib/                 # Utilities (auth, db, activity log)
│   └── store/               # Zustand stores
├── mini-services/
│   └── whatsapp-service/    # Baileys WhatsApp microservice
└── db/                      # SQLite database (git-ignored)
```

## 📱 PWA Install

This app is a Progressive Web App. On supported browsers:
1. Visit the app in Chrome/Edge
2. Click the **"Install"** button in the header (or browser address bar)
3. The app installs as a standalone application

## 🗄 Database Models

- **Admin** — System administrators
- **Member** — Library members with seat/floor/section assignment
- **Payment** — Payment records with auto-calculated validity periods
- **Floor** — Building floors
- **Section** — Sections within floors (A Block, B Block, etc.)
- **Seat** — Individual seats with occupancy status
- **Setting** — Key-value configuration store
- **ActivityLog** — Audit trail for all operations
- **WhatsAppMessage** — Message queue with delivery status tracking

## 📄 License

MIT