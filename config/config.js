require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 8080,
  MONGODB_URI: process.env.MONGODB_URI,
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CORS_ORIGINS: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://app.skillaccess.in",
    "https://student.skillaccess.in",
    "https://admin.skillaccess.in",

    // Add other allowed origins here
  ],
};
