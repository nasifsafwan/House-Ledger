import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = process.env.PORT || 8080;
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("[Server] Missing MONGO_URI in backend/.env");
  process.exit(1);
}

try {
  await connectDB(mongoUri);
  app.listen(port, () => console.log(`[Server] Running on ${port}`));
} catch (error) {
  console.error("[Server] Failed to connect to MongoDB:", error.message);
  process.exit(1);
}
