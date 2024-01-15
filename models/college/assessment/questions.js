const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionsSchema = new Schema({
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
  },
  Title: String,
  Options: {
    type: Array,
    default: [],
  },
  Answer: {
    type: String,
    default: '',
  },

 //---------- For Students -----------

 McqAnswers: [{
  studentId : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  AnswerIndex: {
    type: Number,
    default: -1,
  },
  Marks : {
    type: Number,
    default: 0,
  },
}],

LengthyAnswers: [{

  studentId : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  AnswerText: {
    type: String,
    default: '',
  },
  Marks : {
    type: Number,
    default: 0,
  },
}],
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
});

const Questions = mongoose.model('Questions', questionsSchema);

module.exports = Questions;
