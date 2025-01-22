const cloudinary = require("cloudinary");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const express = require("express");
const {
  PORT,
  CLOUDINARY_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CORS_ORIGINS,
} = require("./config/config");
const connectToMongoDB = require("./config/db");
const errorMiddleware = require("./middlewares/error");


// Initialize Express app
const app = express();

// Connect to MongoDB
connectToMongoDB();

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Setup Express middleware
// require("./config/express")(app);

 // Apply CORS middleware to all routes
 app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || CORS_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"],
    // allowedHeaders: ["Content-Type", "All"],
  })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: "/tmp/",
    createParentPath: true,
  })
);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is working on http://localhost:${PORT}`);
});

// Setup Socket.IO
const io = new socketIo.Server(server, {
  cors: {
    origin: CORS_ORIGINS,
    credentials: true,
  },
});

// Setup routes
require("./config/routes")(app);

// Error middleware
app.use(errorMiddleware);

io.on("connection", (socket) => {
  console.log("A client connected");

  socket.on("joinRoom", (email) => {
    socket.join(email);
    console.log(`Joined room ${email}`);
  });

  socket.on("message", (roomName, message) => {
    socket.to(roomName).emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});
