const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const connectToMongoDB = require("./config/db");
const errorMiddleware = require("./middlewares/error");



// ======================================================= APP CONFIG ===================================================

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectToMongoDB();

// ======================================================= MIDDLEWARES ===================================================

app.use(express.json());
app.use(cookieParser());

// ======================================================= ROUTES =======================================================

const collegeRoutes = require("./routes/college/collegeRoutes.js");
const assessmentsRoutes = require('./routes/college/assessmentsRoutes.js');
const studentRoutes = require("./routes/student/studentRoutes.js");
const companyRoutes = require("./routes/company/companyRoutes.js");

// routes
app.use("/api/college", collegeRoutes );
app.use("/api/assessments", assessmentsRoutes);
app.use("/api/student",studentRoutes );
app.use("/api/company", companyRoutes);
app.get("/", (req, res) => {
  res.send("API is running");
});



// ======================================================= ERROR MIDDLEWARE =======================================================

app.use(errorMiddleware);

// ======================================================= SERVER ===================================================================

const server = app.listen(process.env.PORT, () => {
  console.log(`Server is working on http://localhost:${process.env.PORT}`);
});

// ======================================= HANDLE UNHANDLED PROMISE REJECTION =======================================================

// Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});
