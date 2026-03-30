import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";
import Admin from "./models/Admin.js";

const port = process.env.PORT || 8080;
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("[Server] Missing MONGO_URI in backend/.env");
  process.exit(1);
}

try {
  await connectDB(mongoUri);
  
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    await Admin.create({ username: 'admin', password: 'temporary_password' });
    console.log("[Server] Seeded initial Admin user (admin / temporary_password)");
  }
  
  app.listen(port, () => console.log(`[Server] Running on ${port}`));
} catch (error) {
  console.error("[Server] Failed to connect to MongoDB:", error.message);
  process.exit(1);
}
