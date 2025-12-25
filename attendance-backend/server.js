const express = require("express");
const cors = require("cors");
const attendanceRoutes = require("./routes/attendanceRoutes");
const db = require("./db"); // ensures MySQL connects

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/attendance", attendanceRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Server is running correctly!");
});

// Start server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
