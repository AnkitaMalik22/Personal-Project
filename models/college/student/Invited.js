const mongoose = require("mongoose");

// Define schema for Invitation model
const invitedStudentsSchema = new mongoose.Schema({
  college: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
  students: [
    {
      Email: {
        type: String,
        // required: [true, "Please add an Email"],
        // unique: true,
      },
      FirstName: { type: String },
      LastName: { type: String },
      ProfileLink : { type: String },
      student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
      link: { type: String },
    },
  ],
});

// Create model from schema
const InvitedStudents = mongoose.model(
  "InvitedStudents",
  invitedStudentsSchema
);

module.exports = InvitedStudents;
