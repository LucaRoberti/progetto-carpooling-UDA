import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import tripRoutes from "./routes/trip.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import carRoutes from "./routes/car.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/trips", tripRoutes);
app.use("/bookings", bookingRoutes);
app.use("/reviews", reviewRoutes);
app.use("/cars", carRoutes);

// Health check
app.get("/", (_, res) => res.json({ status: "ok", service: "CarLink API" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Errore interno del server",
  });
});

app.listen(PORT, () => {
  console.log(`CarLink API running on http://localhost:${PORT}`);
});
