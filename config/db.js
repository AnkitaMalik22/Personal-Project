const mongoose = require("mongoose");

const connectDatabase = () => {
  const dbURI = process.env.MONGO_URI;
  mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

  const db = mongoose.connection;

  db.on("error", (error) => {
    console.error("Error connecting to MongoDB:", error);
  });

  db.once("open", () => {
    console.log("Connected to MongoDB");
  });
};

module.exports = connectDatabase;
