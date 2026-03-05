# 🍽️ Mess Manager

![Banner Image](logo.jpg)

A beautiful, fully-featured **Hostel & Mess Management System** designed to effortlessly track meals, expenses, and members with a smart, modern UI.

Built with the MERN stack (MongoDB, Express, React, Node.js) and perfectly optimized for cloud deployment.

---

## ✨ Features

- **Dashboard:** Smart summaries of total expenses, active meals, and unpaid dues.
- **Meal Tracking:** Daily meal logging for every member.
- **Expense Ledger:** Transparent tracking of shared bills (groceries, utilities, etc.).
- **Member Management:** Add, remove, and manage mess members.
- **Billing & Payments:** Generate automated monthly summaries and mark payments as paid.
- **Modern UI:** Built with React & Tailwind CSS for a fully responsive, glassy, and premium feel.

---

## 🛠️ Tech Stack

**Frontend:**
- React 19 + Vite
- Tailwind CSS v4
- Axios
- React Router DOM v7

**Backend:**
- Node.js & Express
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for Authentication
- Zod for Validation

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/nasifsafwan/House-Ledger.git
cd House-Ledger
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory (refer to `.env.example`):
```env
PORT=8080
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
CORS_ORIGIN=http://localhost:5173
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
# In a new terminal, from the project root:
cd frontend
npm install
npm run dev
```
The app will be running at `http://localhost:5173`.

---

## ☁️ Deployment (Vercel)

This project is configured as a Monorepo capable of deploying beautifully to **Vercel** with a single click.

1. Import the repository into your Vercel dashboard.
2. Vercel will automatically detect the build settings via `vercel.json` and the root `package.json`.
3. Add your Environment Variables in the Vercel Dashboard:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `VITE_API_URL` (Set this to `/api` for same-domain deployment)
4. Deploy! The frontend will be built statically and the backend will run efficiently as a Serverless Function.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check [issues page](https://github.com/nasifsafwan/House-Ledger/issues).

---

<p align="center">Made with ❤️ for easier living.</p>
