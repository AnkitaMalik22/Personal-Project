const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config({ path: "./.env.local" });
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
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:5500",
      "http://localhost:8080",
      "https://65a11283c51a3ba9c2cdb954--mellifluous-conkies-ba7b88.netlify.app/",
      "https://deploy-preview-8--mellifluous-conkies-ba7b88.netlify.app",
      "https://skillaccessclient.netlify.app",
      "https://skillaccessclient.netlify.app/",
      "https://skillaccessprod.netlify.app",
      "https://checkout.stripe.com",
      "https://skillaccess.vercel.app",
      "https://skillaccess-student.vercel.app",
      "https://skillaccess-student-iota.vercel.app",
      "https://skillaccess-college.vercel.app",
      "https://skillaccess-student-ten.vercel.app/",
      "https://skillaccess-student-ten.vercel.app/",
      "https://skillaccess-admin-alpha.vercel.app",
      "https://app.skillaccess.in",
      "https://student.skillaccess.in",
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
const adminTestRoutes = require("./routes/admin/adminTestRoutes.js");

const studentDummyRoutes = require("./routes/student/studentDummyRoutes.js");
const collegeTeamRoutes = require("./routes/college/teamRoutes.js");
const qbRoutes = require("./routes/college/qbRoutes.js");
const paymentRoutes = require("./routes/college/paymentRoutes.js");
const collegeStudentRoutes = require("./routes/college/studentRoutes.js");
const universityRoutes = require("./routes/university/universityRoutes.js");
const studentTestRoutes = require("./routes/student/studentTestRoutes.js");
const studentInboxRoutes = require("./routes/student/studentInboxRoutes.js");
const studentGraphRoutes = require("./routes/student/studentGraphRoutes.js");
const companyTestRoutes = require("./routes/company/companyTestRoutes.js");
const { isAuthenticatedCompany } = require("./middlewares/companyAuth.js");
const {
  generateReport,
  generateStudentReportPdf,
} = require("./controllers/college/assessment/assessments.js");

// ======================================================= ROUTES =======================================================

// routes
app.use("/api/university", universityRoutes);
app.use("/api/college", collegeRoutes);
app.use("/api/college/teams", collegeTeamRoutes);
app.use("/api/college/student", collegeStudentRoutes);
app.use("/api/assessments", assessmentsRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/studentDummy", studentDummyRoutes);
app.use(
  "/api/company/studentDummy",
  isAuthenticatedCompany,
  studentDummyRoutes
);
app.use("/api/student/test", studentTestRoutes);
app.use("/api/student/inbox", studentInboxRoutes);
app.use("/api/student/graph", studentGraphRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/company/test", companyTestRoutes);
app.use("/api/admin", adminTestRoutes);
app.use("/api/admin/approval", require("./routes/admin/approvalRoutes.js"));
app.use("/api/qb", qbRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/compiler", require("./routes/compiler/compilerRoutes"));
app.get("/", (req, res) => {
  res.send("API is running");
});


app.get("/test", (req, res) => {
  res.send("Dockerize container running");
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
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:5500",
      "https://65a11283c51a3ba9c2cdb954--mellifluous-conkies-ba7b88.netlify.app/",
      "https://deploy-preview-8--mellifluous-conkies-ba7b88.netlify.app",
      "https://skillaccessclient.netlify.app",
      "https://skillaccessprod.netlify.app",
      "https://skillaccess.vercel.app",
      "https://skillaccess-student.vercel.app",
      "https://skillaccess-college.vercel.app",
      "https://skillaccess-student-iota.vercel.app",
      "https://skillaccess-admin-alpha.vercel.app",
      "https://skillaccess-admin-alpha.vercel.app",
      "https://app.skillaccess.in",
      "https://student.skillaccess.in",
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
    console.log(" joined room" + email);
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
