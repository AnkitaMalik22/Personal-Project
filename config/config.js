require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI,
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CORS_ORIGINS: [
    "http://localhost:3000",
    "https://app.skillaccess.in",
    "https://student.skillaccess.in",
    // Add other allowed origins here
  ],
};
