# CampusTrade Frontend

CampusTrade is a responsive, production-ready React frontend for a verified student marketplace.

## Tech Stack

- React + Vite
- React Router
- Axios
- Context API
- Tailwind CSS
- React Hook Form + Zod
- Firebase Cloud Messaging (optional)
- Framer Motion

## Features

- University email auth flow (register, login, verify success)
- Protected routes and admin-only routes
- Marketplace home with:
  - Search
  - Filters (campus, category, condition, type, price range)
  - Pagination
- Listing details with:
  - Image gallery
  - Seller metadata (rating, transaction count)
  - Offer flow (used listings)
  - Order flow (new listings)
  - Wishlist toggle
  - Report modal
  - Review modal
  - Related listings
- Messaging UI with conversation list + active chat window
- Profile page with editable profile, avatar upload, transaction history
- Admin dashboard:
  - Stats cards
  - Reports table
  - User management (suspend/delete actions)
- Notification system:
  - Bell dropdown
  - Unread badges
  - Mark as read / mark all read
  - Toast notifications
- UI states included: loading, empty, and error states

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill values as needed:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

Firebase variables are optional unless you want real push notifications.

### 3. Run locally

```bash
npm run dev
```

App runs at the Vite local URL (usually `http://localhost:5173`).

## Available Scripts

- `npm run dev` - start local dev server
- `npm run build` - create production build
- `npm run preview` - preview production build locally

## Project Structure

```txt
src/
  api/           # Axios client + feature API modules
  assets/        # Static assets (logo, etc.)
  components/
    ui/          # Reusable UI primitives
    listings/    # Marketplace/listing feature components
    messaging/   # Chat/conversation components
    profile/     # Profile feature components
    admin/       # Admin feature components
  context/       # App/Auth/Notification state providers
  hooks/         # Shared hooks (debounce, pagination, Firebase notifications)
  layouts/       # Main and auth layouts
  pages/         # Route-level screens
  routes/        # Route declarations + guards
  utils/         # Constants, validators, mock data, formatters, helpers
```

## Routing Overview

- Public:
  - `/`
  - `/listings/:listingId`
  - `/login`
  - `/register`
  - `/verify-success`
- Protected:
  - `/messages`
  - `/profile`
- Admin only:
  - `/admin`
- Fallback:
  - `/404`

## API Integration Notes

- Centralized Axios instance: `src/api/axiosClient.js`
- `withCredentials: true` is enabled for cookie-based auth compatibility
- Response interceptor dispatches a custom unauthorized event on `401`
- API modules are structured by domain:
  - `authApi`
  - `listingsApi`
  - `messagingApi`
  - `profileApi`
  - `adminApi`
  - `notificationsApi`
- A fallback layer (`src/api/fallback.js`) provides mock data when backend endpoints are unavailable

## State Management

- `AuthContext` - session, login/register/logout, auth flags
- `AppContext` - listings state, filters, pagination state, wishlist toggles
- `NotificationContext` - notifications, unread counts, toasts

## Build Status

Production build is passing with Vite:

```bash
npm run build
```

## Next Improvements

- Replace mock fallback responses with live backend responses per endpoint
- Add automated tests (unit + integration)
- Add role claims from backend for strict admin authorization
- Add observability (Sentry/analytics) for runtime errors
