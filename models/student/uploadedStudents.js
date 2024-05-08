const mongoose = require("mongoose");

const UploadedStudentsSchema = new mongoose.Schema({
  college: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Students" }],
});

const UploadedStudents = mongoose.model(
  "UploadedStudents",
  UploadedStudentsSchema
);

module.exports = UploadedStudents;
