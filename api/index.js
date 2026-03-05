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
    await ensureDB();
    return app(req, res);
}
