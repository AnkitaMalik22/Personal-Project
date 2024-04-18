const mongoose = require("mongoose");
const { Schema } = mongoose;

// FOR MCQ ANSWERS

const questionsSchema = new Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
  },
  id: {
    type: String,
    // required:true
  },
  QuestionLevel: {
    type: String,
    default: "beginner",
    enum: ["beginner", "intermediate", "advanced"],
  },
  Duration: String,
  Title: String,
  Options: {
    type: Array,
    default: [],
  },
  // For lengthy questions
  Answer: {
    type: String,
    default: "",
  },

  AnswerIndex: {
    type: Number,
    default: -1,
  },
  QuestionType: {
    type: String,
    default: "mcq",
  },

  QuestionBankID: Number,
  Status: String,
  TotalMarks: Number,

  //---------- For Students -----------

  McqAnswers: [
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
      AnswerIndex: {
        type: Number,
        default: -1,
      },
      Marks: {
        type: Number,
        default: 0,
      },
    },
  ],

  LengthyAnswers: [
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
      AnswerText: {
        type: String,
        default: "",
      },
      Marks: {
        type: Number,
        default: 0,
      },
    },
  ],
  // ----------------------------

  // MCQAnswer: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'MCQAnswers',
  // },
  // LengthyAnswer: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'LengthyAnswers',
  // },
  SectionTime: Number, // Assuming time is in minutes
  SectionHeading: String,

  // if this is an college assessment - question
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
  },
  // if this is an company assessment - question
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  createdByCompany: {
    type: Boolean,
    default: false,
  },
});

const Questions = mongoose.model("Questions", questionsSchema);

module.exports = Questions;
