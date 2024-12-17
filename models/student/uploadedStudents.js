const mongoose = require("mongoose");

const UploadedStudentsSchema = new mongoose.Schema({
  university:{ type: mongoose.Schema.Types.ObjectId, ref: "University"},
  college: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Students" }],
});

const UploadedStudents = mongoose.model(
  "UploadedStudents",
  UploadedStudentsSchema
);

module.exports = UploadedStudents;
