import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import messRoutes from "./routes/mess.routes.js";
import membersRoutes from "./routes/members.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";

import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

const configuredOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser and same-origin requests.
      if (!origin) return cb(null, true);

      // In development, allow localhost ports to avoid frequent CORS mismatches.
      if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) {
        return cb(null, true);
      }

      if (configuredOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS origin not allowed"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/mess", messRoutes);      // mess + meals + bills + visitors + reminder + summary
app.use("/api/members", membersRoutes); // member management
app.use("/api/payments", paymentsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
