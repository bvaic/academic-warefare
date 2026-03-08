import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────────
app.use(cors({ origin: "*" })); // tighten to your frontend origin in prod
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

app.get("/health", (_, res) => res.json({ status: "ok", ts: new Date() }));

// ── Start ───────────────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`🚀 API running on http://localhost:${PORT}`)
);

// Connect to DB in the background — server stays up even if it fails
connectDB()
  .then(() => console.log("✅ MongoDB connected to comet_db"))
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    console.warn("⚠️  Auth routes will return 503 until DB is reachable.");
  });

