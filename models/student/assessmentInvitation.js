const mongoose = require("mongoose");

// Define schema for Invitation model
const collegeAssessInvSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  email: { type: String },
  assessments: [
    {
      active: { type: Boolean },
      onGoingAssessment: { type: String },

      completed: { type: Boolean },
      completedAt: { type: Date },
      startedAt: { type: Date },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
      assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessments" },
      response: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentResponse",
      },
      percentage: {
        type: Number,
      },
      level: {
        type: Number,
      },
      marks: {
        type: Number,
        default: 0,
      },
      negativeCount: {
        type: Number,
        default: 0,
      },
      L1Correct: {
        type: Number,
        default: 0,
      },
      L2Correct: {
        type: Number,
        default: 0,
      },
      L3Correct: {
        type: Number,
        default: 0,
      },
      attempts: {
        type: Number,
        default: 0,
      },
      currentTopicIndex: {
        type: Number,
        default: 0,
      },
      currentQuestionIndex: {
        type: Number,
        default: 0,
      },
      totalQuestionsAttempted: {
        type: Number,
        default: 0,
      },
    },
  ],
});

// Create model from schema
const CollegeAssessInv = mongoose.model(
  "CollegeAssessInv",
  collegeAssessInvSchema
);

module.exports = CollegeAssessInv;
