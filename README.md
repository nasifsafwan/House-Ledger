# House Ledger - by Nasif Safwan

<p align="center">
  <img src="./frontend/public/logo.png" alt="House Ledger logo" width="400" />
</p>

<p align="center">
  Smart mess and hostel expense tracking for meals, rent, shared bills, payments, settlements, personal expenses, and analytics.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/MERN-Full%20Stack-0f766e?style=for-the-badge" alt="MERN Stack" />
  <img src="https://img.shields.io/badge/React-19-1d4ed8?style=for-the-badge" alt="React 19" />
  <img src="https://img.shields.io/badge/Express-API-111827?style=for-the-badge" alt="Express API" />
  <img src="https://img.shields.io/badge/MongoDB-Database-166534?style=for-the-badge" alt="MongoDB" />
</p>

---

This project is available in: https://house-ledger-lgkkz01pl-nasifsafwans-projects.vercel.app/ and is open source.

## Overview

House Ledger helps a mess manager and members stay aligned on monthly costs. It combines mess operations and personal expense tracking in one app, with shared monthly summaries, payment status, settlement handling, reminders, and visual analytics.

### Quick Navigation

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [User Guide](#user-guide)
- [API Highlights](#api-highlights)
- [FAQ](#faq)
- [Deployment](#deployment)

## User Guide

### Main Flow

```text
Register -> Login -> Create or Join Mess -> Open Dashboard -> Manage Month
```

### First-Time Setup

1. Create an account.
2. Sign in.
3. Create a new mess as manager, or join one using an invite code.
4. Open the mess from the mess selection screen.
5. Optionally open the `Personal` page to track private expenses outside the shared mess flow.

### Role Guide

| Role | Main actions |
| --- | --- |
| Manager | Set meal price, upload bills, update member rent, configure reminders, monitor payments, manage settlements, review analytics |
| Member | Log meals, review dues, mark self as paid, repay settlements, view analytics |
| Personal | Add private expenses, categorize spending, delete entries, review charts and trends |

### Manager Workflow

<details>
  <summary><strong>Open manager checklist</strong></summary>

1. Select the month from the dashboard.
2. Enter the meal unit price in `Quick Settings`.
3. Add utility and other bill items.
4. Review bill totals, member share, and collection summary.
5. Update each member's rent for the selected month.
6. Monitor who has paid and mark payment status.
7. Create settlements when one member owes another.
8. Record repayment entries or force-settle if needed.
9. Set reminder day and enabled state for the mess.
10. Inspect mess spending analytics by category and monthly trend.

</details>

### Member Workflow

<details>
  <summary><strong>Open member checklist</strong></summary>

1. Open the current month.
2. Log meals from `Quick Meal Log`.
3. Review rent, bill share, meal cost, settlement adjustments, and final due.
4. Mark yourself as paid after sending payment.
5. Repay open settlements if you owe another member.
6. Inspect mess spending analytics for the selected period.

</details>

### Personal Expense Workflow

<details>
  <summary><strong>Open personal checklist</strong></summary>

1. Open the `Personal` page from the app layout.
2. Add expenses with category, amount, optional note, and optional date.
3. Use custom labels when `Others` is selected.
4. Review category and monthly breakdown cards.
5. Delete entries when needed.
6. Explore charts for personal spending trends.

</details>

### Mess Access at a Glance

| Action | Result |
| --- | --- |
| Create mess | You become the manager and get an invite code |
| Join with invite code | You become a member of that mess |
| Open mess card | You are routed to manager or member dashboard based on your role |
| Open `Personal` | You manage expenses that are not tied to any mess |

## Features

| Area | What it does |
| --- | --- |
| Authentication | Register and log in with JWT-based auth |
| Mess Access | Create a new mess, join with an invite code, and switch between active mess memberships |
| Manager Tools | Set meal price, upload monthly bills, update per-member rent, manage payment status, configure reminder settings |
| Member Tools | Log meals, check dues, mark self as paid, and repay settlements |
| Monthly Summary | Breaks down rent, bills, meals, payment state, and settlement-adjusted dues |
| Settlements | Track who owes whom, allow partial repayments, and let managers force-settle |
| Personal Expenses | Track private spending with category, amount, date, and description |
| Analytics | View mess and personal spending by category and monthly trend |
| Visitor Log | Record visitors and review them from the manager side |

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS v4, Axios, React Router DOM v7, Chart.js, react-chartjs-2 |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, Zod |

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/nasifsafwan/House-Ledger.git
cd House-Ledger
```

### 2. Install dependencies

```bash
cd backend
npm install
```

```bash
cd ../frontend
npm install
```

### 3. Configure environment variables

Create `backend/.env`:

```env
PORT=8080
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
CORS_ORIGIN=http://localhost:5173
RESEND_API_KEY=optional_for_email_features
```

Optional frontend override in `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080/api
```

> If `VITE_API_URL` is not set, the frontend uses `http://localhost:8080/api` in development.

### 4. Run the app

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## API Highlights

These are the main route groups currently exposed by the backend:

| Route group | Purpose |
| --- | --- |
| `/api/auth` | Register and login |
| `/api/mess` | Mess creation, joining, meals, bills, visitors, reminders, settlements, and monthly summaries |
| `/api/members` | Member list, rent updates, and member removal |
| `/api/payments` | Member self-paid flow and manager payment marking |
| `/api/personal` | Personal expense create, list, and delete |
| `/api/analytics` | Personal and mess analytics with optional date ranges |

## FAQ

<details>
  <summary><strong>What is the difference between a manager and a member?</strong></summary>

Managers can configure monthly costs, update rents, manage payment status, set reminders, and control settlements. Members can log meals, view their own monthly summary, mark themselves as paid, and repay settlements they owe.

</details>

<details>
  <summary><strong>How is the monthly due calculated?</strong></summary>

The total is based on:

- Rent
- Equal share of total monthly bills across active members
- Meal cost from `meal count x unit price`
- Settlement adjustments

The app also shows an adjusted total when settlements change the final payable amount.

</details>

<details>
  <summary><strong>Can a member join more than one mess?</strong></summary>

Yes. The mess selection page lists all active mess memberships for the signed-in user.

</details>

<details>
  <summary><strong>What happens if someone rejoins a mess they left before?</strong></summary>

The backend reactivates a previous inactive membership when that user joins the same mess again with a valid invite code.

</details>

<details>
  <summary><strong>Can members mark other members as paid?</strong></summary>

No. Members can mark only themselves as paid. Managers can mark any member as paid or unpaid.

</details>

<details>
  <summary><strong>Does the app support personal expense tracking outside a mess?</strong></summary>

Yes. The `Personal` page lets a signed-in user record private expenses, review recent entries, and view analytics without attaching those expenses to any mess.

</details>

<details>
  <summary><strong>Who can create and repay settlements?</strong></summary>

Any active member can create a settlement in a mess. Repayments can be recorded by the owing member or by the manager.

</details>

<details>
  <summary><strong>Can a settlement be partially repaid?</strong></summary>

Yes. Partial repayments are supported until the remaining amount reaches zero.

</details>

<details>
  <summary><strong>What analytics are available now?</strong></summary>

The app includes both personal and mess analytics. Each view supports category breakdown, monthly trend, total spending, and date filtering presets including custom ranges.

</details>

<details>
  <summary><strong>Are reminders configurable?</strong></summary>

Yes. Each mess has a reminder setting with an enabled flag and a day-of-month value that managers can update.

</details>

<details>
  <summary><strong>Why is the frontend failing to connect to the backend?</strong></summary>

Check these first:

- The backend server is running on port `8080`
- `MONGO_URI` and `JWT_SECRET` are set in `backend/.env`
- `CORS_ORIGIN` includes `http://localhost:5173`
- `VITE_API_URL` points to the correct backend API URL if you overrode it

</details>

<details>
  <summary><strong>Is there a <code>.env.example</code> file?</strong></summary>

No. This repository currently does not include one, so use the environment variable block in this README.

</details>

## Deployment

This repo is structured for the same-project frontend and API deployment.

### Required environment variables

- `MONGO_URI`
- `JWT_SECRET`
- `VITE_API_URL=/api`

### Optional

- `RESEND_API_KEY`
- `CORS_ORIGIN`

## Contributing

Issues and pull requests are welcome.
