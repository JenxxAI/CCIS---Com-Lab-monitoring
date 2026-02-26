# CICTE Lab Monitor — Frontend

A modern, real-time computer lab management dashboard built with:

**React 18 · TypeScript · Tailwind CSS · Zustand · TanStack Query · Socket.io**

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Start dev server
npm run dev
```

Open `http://localhost:5173`

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Badge.tsx          # Status/condition badge pill
│   ├── FloorPlans.tsx     # CL1-3, CL4-5, and generic floor plan maps
│   ├── PCDetailPanel.tsx  # Slide-over PC detail panel
│   ├── PCTile.tsx         # Clickable PC square on map
│   ├── Sidebar.tsx        # Left lab navigation sidebar
│   └── Topbar.tsx         # Top header with global stats
│
├── pages/
│   ├── MapView.tsx        # Lab floor plan view
│   ├── ListView.tsx       # PC registry table view
│   └── AnalyticsView.tsx  # Charts and analytics dashboard
│
├── store/
│   └── index.ts           # Zustand stores (theme, lab state, notifications)
│
├── hooks/
│   ├── useSocket.ts       # Socket.io real-time connection
│   └── useApi.ts          # TanStack Query API hooks
│
├── lib/
│   ├── data.ts            # Lab definitions + mock data generator
│   └── utils.ts           # cn(), status/condition metadata, hex colors
│
├── types/
│   └── index.ts           # TypeScript interfaces (PC, Lab, Filters…)
│
├── App.tsx                # Root layout (Topbar + Sidebar + SubNav + Views)
├── main.tsx               # React entry point with QueryClientProvider
└── index.css              # Tailwind directives + global styles
```

---

## 🔌 Connecting to a Backend

### Environment Variables

Edit `.env.local`:

```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### Expected API Endpoints

| Method | Path                         | Description             |
|--------|------------------------------|-------------------------|
| GET    | `/api/labs/:id/pcs`         | Get all PCs for a lab   |
| PATCH  | `/api/pcs/:id`              | Update PC status/cond   |
| POST   | `/api/pcs/:id/repairs`      | Log a repair            |

### Socket.io Events

| Event         | Direction     | Payload | Description               |
|---------------|---------------|---------|---------------------------|
| `pc:updated`  | server → client | `PC`  | PC status/condition changed |
| `pc:repaired` | server → client | `PC`  | Repair was logged          |

> Without a backend, the app runs fully on mock data — no errors.

---

## 🏗️ Recommended Backend Stack

```
Node.js + Express + TypeScript
MySQL or Supabase (PostgreSQL)
Socket.io for real-time push
Prisma ORM for type-safe DB queries
```

---

## 🗺️ Adding Floor Plans for Other Labs

In `src/components/FloorPlans.tsx`, add a new export function following the
`FloorPlanCL123` or `FloorPlanCL45` pattern.

Then in `src/App.tsx`, add your new lab IDs to the `renderFloorPlan()` switch.

Finally, update `hasFloorPlan: true` for that lab in `src/lib/data.ts`.

---

## 🎨 Theming

Dark/light mode is handled by Tailwind's `dark:` class strategy.
The `dark` class is toggled on `<html>` by `useThemeStore`.
Theme preference is persisted to `localStorage` via Zustand's `persist` middleware.

---

## 📦 Build for Production

```bash
npm run build
# Output in /dist — deploy to Vercel, Netlify, or any static host
```
