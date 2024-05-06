const mongoose = require("mongoose");

// Define schema for Invitation model
const collegeAssessInvSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  email: { type: String },
  assessments: [
    {
      active: { type: Boolean },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
      assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessments" },
    },
  ],
});

// Create model from schema
const CollegeAssessInv = mongoose.model(
  "CollegeAssessInv",
  collegeAssessInvSchema
);

module.exports = CollegeAssessInv;
