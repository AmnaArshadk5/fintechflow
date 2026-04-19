# FintechFlow

Personal Finance & Loan Manager (PKR) with wallet balance tracking, transaction history, loan applications, loan status updates, and an EMI calculator.

## Features

- Wallet dashboard with deposit/withdraw flows
- Transaction history (filter by credit/debit)
- Loan application (3-step form) + loan status page
- EMI calculator endpoint + UI

## Tech Stack

- React + React Router (SPA)
- Vite (bundler) + Tailwind CSS
- Express API (dev + production server in `server.js`)

## Getting Started

**Prerequisites:** Node.js (npm)

1. Install dependencies:
   - `npm install`
2. Start the dev server (Express + Vite middleware):
   - `npm run dev`
3. Open:
   - `http://localhost:3000`

## Scripts

- `npm run dev` - starts `server.js` (API + Vite middleware)
- `npm run build` - builds the frontend to `dist/`
- `npm run preview` - Vite preview (frontend-only)
- `npm run clean` - deletes `dist/` (may not work on Windows shells)

## API Endpoints

**Wallet**

- `GET /api/wallet` - current wallet state
- `POST /api/wallet/deposit` - `{ "amount": number }`
- `POST /api/wallet/withdraw` - `{ "amount": number }`
- `GET /api/wallet/transactions?type=credit|debit` - list transactions
- `GET /api/transactions?type=credit|debit` - alias for transactions

**Loans**

- `GET /api/loans` - list loan applications
- `POST /api/loans/apply` - `{ applicant, amount, purpose, tenure, ... }`
- `PATCH /api/loans/:id/status` - `{ "status": "approved" | "rejected" }`

**EMI**

- `GET /api/emi-calculator?principal=...&annualRate=...&months=...`

## Data Storage (Important)

All data is in-memory (see `src/data.js`). Restarting the server resets wallet balance, transactions, and loan applications.

## Project Structure

- `server.js` - Express server + Vite middleware (dev) / static serving (prod)
- `routes/` - API routes (`wallet.js`, `loans.js`)
- `src/pages/` - app pages (Wallet, Transactions, Loans, EMI)
- `src/context/` - theme + toast providers

## Configuration

- `NODE_ENV=production` - serves the built app from `dist/`
- `DISABLE_HMR=true` - disables Vite HMR in dev

## Production Build

1. Build the frontend:
   - `npm run build`
2. Start the server in production mode (serves `dist/`):
   - PowerShell: `$env:NODE_ENV="production"; node server.js`
   - macOS/Linux: `NODE_ENV=production node server.js`
