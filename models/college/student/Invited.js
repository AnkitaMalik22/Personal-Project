const mongoose = require("mongoose");

// Define schema for Invitation model
const invitedStudentsSchema = new mongoose.Schema({
  college: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
  university: { type: mongoose.Schema.Types.ObjectId, ref: "University" },
  students: [
    {
      Email: {
        type: String,
        // required: [true, "Please add an Email"],
        // unique: true,
      },
      FirstName: { type: String },
      LastName: { type: String },
      ProfileLink: { type: String },
      student: { type: mongoose.Schema.Types.ObjectId, ref: "Students" },
      link: { type: String },
      batch: { type: String, default: "2024" },
      approved: { type: Boolean }
    },
  ],
});

// Create model from schema
const InvitedStudents = mongoose.model(
  "InvitedStudents",
  invitedStudentsSchema
);

module.exports = InvitedStudents;
