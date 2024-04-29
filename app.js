const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const connectToMongoDB = require("./config/db");
const errorMiddleware = require("./middlewares/error");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary");
const socketIo = require("socket.io");

// ======================================================= APP CONFIG ===================================================

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectToMongoDB();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ======================================================= MIDDLEWARES ===================================================
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: "/tmp/",
    createParentPath: true,
  })
);
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://65a11283c51a3ba9c2cdb954--mellifluous-conkies-ba7b88.netlify.app/",
      "https://deploy-preview-8--mellifluous-conkies-ba7b88.netlify.app",
      "https://skillaccessclient.netlify.app",
      "https://skillaccessclient.netlify.app/",
      "https://skillaccessprod.netlify.app",
      "https://checkout.stripe.com",
    ],
    credentials: true,
    
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ======================================================= ROUTES =======================================================

const collegeRoutes = require("./routes/college/collegeRoutes.js");
const assessmentsRoutes = require("./routes/college/assessmentsRoutes.js");
const studentRoutes = require("./routes/student/studentRoutes.js");
const companyRoutes = require("./routes/company/companyRoutes.js");
const adminRoutes = require("./routes/admin/adminTestRoutes.js");

const studentDummyRoutes = require("./routes/student/studentDummyRoutes.js");
const collegeTeamRoutes = require("./routes/college/teamRoutes.js");
const qbRoutes = require("./routes/college/qbRoutes.js");
const paymentRoutes = require("./routes/college/paymentRoutes.js");

// routes
app.use("/api/college", collegeRoutes);
app.use("/api/college/teams", collegeTeamRoutes);
app.use("/api/assessments", assessmentsRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/studentDummy", studentDummyRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/qb", qbRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

// ======================================================= ERROR MIDDLEWARE =======================================================

app.use(errorMiddleware);

// ======================================================= SERVER ===================================================================

const server = app.listen(process.env.PORT, () => {
  console.log(`Server is working on http://localhost:${process.env.PORT}`);
});

const io = new socketIo.Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://65a11283c51a3ba9c2cdb954--mellifluous-conkies-ba7b88.netlify.app/",
      "https://deploy-preview-8--mellifluous-conkies-ba7b88.netlify.app",
      "https://skillaccessclient.netlify.app",
      "https://skillaccessprod.netlify.app",
      "https://skillaccess.vercel.app",
    ],
  },
});
// ======================================= HANDLE UNHANDLED PROMISE REJECTION =======================================================

io.on("connection", (socket) => {
  console.log("A client connected");

  // Example: Handle email events
  socket.on("joinRoom", (email) => {
    // Handle sending email logic
    socket.join(email);
    console.log("joined room" + email);
  });

  socket.on("message", (roomName, message) => {
    socket.to(roomName).emit("message", message); // Send message to all clients in the room
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});
// Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});
