const mongoose = require("mongoose");

// Define schema for Invitation model
const approvedStudentsSchema = new mongoose.Schema({
  college: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Students" }],
});

// Create model from schema
const ApprovedStudents = mongoose.model(
  "ApprovedStudents",
  approvedStudentsSchema
);

module.exports = ApprovedStudents;
