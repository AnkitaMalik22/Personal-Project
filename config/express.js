const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const errorMiddleware = require("../middlewares/error");
const { CORS_ORIGINS } = require("./config");

module.exports = (app) => {
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

  // Error middleware
app.use(errorMiddleware);
};
