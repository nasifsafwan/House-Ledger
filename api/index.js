import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import app from "../backend/src/app.js";
import { connectDB } from "../backend/src/config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });

let dbReadyPromise = null;

async function ensureDbConnection() {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI");
  }

  if (!dbReadyPromise) {
    dbReadyPromise = connectDB(process.env.MONGO_URI).catch((error) => {
      dbReadyPromise = null;
      throw error;
    });
  }

  await dbReadyPromise;
}

export default async function handler(req, res) {
  try {
    await ensureDbConnection();
    return app(req, res);
  } catch (error) {
    console.error("[API] Startup failure:", error.message);
    return res.status(500).json({ message: "Failed to start API" });
  }
}
