const mongoose = require("mongoose");

// Define schema for Invitation model
const approvedStudentsSchema = new mongoose.Schema({
  university:{ type: mongoose.Schema.Types.ObjectId, ref: "University" },
  college: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Students" }],
});

// Create model from schema
const ApprovedStudents = mongoose.model(
  "ApprovedStudents",
  approvedStudentsSchema
);

module.exports = ApprovedStudents;
