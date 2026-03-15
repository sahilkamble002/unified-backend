import express from "express";
import dotenv from "dotenv";
import prisma from "./config/prisma.js";
import cors from "cors";
import userRoutes from "./modules/user/user.route.js";
import authRoutes from "./modules/auth/auth.route.js";
import { verifyJWT } from "./middlerware/auth.middleware.js";
import eventRoutes from "./modules/event/event.route.js";
import taskRoutes from "./modules/task/task.route.js"
import donationroutes from "./modules/finance/donation.route.js";
import publicRoutes from "./modules/public/public.route.js"
import analyticsRoutes from "./modules/analytics/analytics.route.js"
import notificationRoutes from "./modules/notification/notification.route.js"


dotenv.config({
  path: "./.env"
});

const configuredOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set(
  [
    ...configuredOrigins,
    "http://localhost:5173",
    "http://localhost:19006",
    "http://localhost:8081",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  ].filter(Boolean)
);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

const app = express();

//middlerware
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));


// routes
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Unified backend is running"
  });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is healthy"
  });
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/tasks", taskRoutes)
app.use("/api/v1/finance", donationroutes);
app.use("/api/v1/public", publicRoutes);
app.use("/api/v1/analytics", analyticsRoutes)
app.use("/api/v1/notifications", notificationRoutes)



// error handler (must be after routes)
app.use((err, req, res, next) => {
  const statusCode = err.status || err.StatusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    statusCode,
    message,
    errors: err.error || [],
  });
});


app.get("/secure-test", verifyJWT, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

export default app;
