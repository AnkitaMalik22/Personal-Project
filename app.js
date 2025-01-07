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
const cloudinary = require("cloudinary");
const socketIo = require("socket.io");
const cors = require("cors");

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
require("./config/express")(app);

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

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is working on http://localhost:${PORT}`);
});

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
