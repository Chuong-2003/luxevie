import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middlewares/error.js";

const app = express();

// Security
app.use(
  helmet({
    crossOriginResourcePolicy: false, // để CORS hoạt động
    crossOriginEmbedderPolicy: false,
  })
);

const allowed = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://luxevie-frontend.vercel.app",
].filter(Boolean);

// middleware CORS
app.use(
  cors({
    origin: allowed, // danh sách domain được phép
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check (đặt sớm)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);
// ✅ Mount “index routes” – tất cả route con sẽ đi qua đây
app.use("/api", routes);

// 404 + Error
app.use(notFound);
app.use(errorHandler);

export default app;
