import { connectDB } from "../backend/src/config/db.js";
import app from "../backend/src/app.js";

let isConnected = false;

async function ensureDB() {
    if (!isConnected) {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("Missing MONGO_URI environment variable");
        }
        await connectDB(uri);
        isConnected = true;
    }
}

export default async function handler(req, res) {
    try {
        await ensureDB();
        return app(req, res);
    } catch (error) {
        console.error("Vercel Function Error:", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
}
