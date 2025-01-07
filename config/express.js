const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const { CORS_ORIGINS } = require("./config");

module.exports = (app) => {
  app.options("*", cors());

  // Apply CORS middleware to all routes
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || CORS_ORIGINS.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

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
      origin: CORS_ORIGINS,
      credentials: true,
    })
  );

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser());
};
