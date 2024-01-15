const mongoose = require('mongoose');
const { Schema } = mongoose;

const sectionSchema = new Schema({
  AssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessments',
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Questions',
  }],
  Time: {
    type: Number,
    default: 0,
  },
  Heading: {
    type: String,
    required: [true, 'Please enter section heading'],
  },
  Description: {
    type: String,
    required: [true, 'Please enter section description'],
  },
  TotalQuestions: {
    type: Number,
    default: 0,
  },
  Type: {
    type: String,
    enum: ['mcq', 'lengthy'],
  },
  TotalStudentsAttempted: {
    type: Number,
    default: 0,
  },
  TotalStudentsCorrect: {
    type: Number,
    default: 0,
  },
  Timeline: {
    type: Date,
    default: Date.now,
  },
  AvgScore: Number,
  QuestionBankID: Number,
  Status: String,
  TotalMarks: Number,
  // Students Enrolled in the Test
  Student :[{
    studentId : {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    TotalMarks : {
      type: Number,
      default: 0,
    },
    TotalQuestionsAttempted : {
      type: Number,
      default: 0,
    },
    TotalQuestionsCorrect : {
      type: Number,
      default: 0,
    },

  }]
});

const Section = mongoose.model('Section', sectionSchema);

module.exports = Section;

