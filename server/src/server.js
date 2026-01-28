// src/server.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load env
dotenv.config();

// Connect DB
connectDB();

// Import routes
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("College Event Management API is running 🚀");
});

// Auth routes
app.use("/api/auth", authRoutes);

// (Later)
// app.use("/api/events", eventRoutes);
// app.use("/api/audi", bookingRoutes);
// app.use("/api/hod", hodRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
