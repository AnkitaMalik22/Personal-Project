const mongoose = require('mongoose');
const { Schema } = mongoose;

// SECTION === TOPIC 

const sectionSchema = new Schema({

  // ==== Will remove this later=====
  // as section will be independent of assessment

  AssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessments',
  },
  // =========================

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
    default : '',
    // enum: ['mcq', 'lengthy'],
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

  }],


// ---------------------- remove later --------------------

//  The assessments where this topic is used
assessments : [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Assessments',
}],

// the questions in this topic
// initially added by 
//----------------------  uestions types ------------------
questions: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Questions',
}],
findAnswers: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'FindAnswer',
}],
essay :[
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Essay',
  }
],
video :[
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
  }
],
compiler:[
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Compiler',
  }
],

// -------------------------------------------------------- student test requirements---------
  L1count: {
    type: Number,
    default: 0,
  },
  L2count: {
    type: Number,
    default: 0,
  },
  L3count: {
    type: Number,
    default: 0,
  },

  totalL1Question:{
    type: Number,
    default: 0,
  },
  totalL2Question : {
    type: Number,
    default: 0,
  },
  totalL3Question :{
    type: Number,
    default: 0,
  },

  
  // negativeCount: {
  //   type: Number,
  //   default: 0,
  // },
// --------------------------------------------------------------------------------------------

    // if this is an college assessment -section
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
    },
    // if this is an company assessment- section
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    createdByCompany: {
      type: Boolean,
      default: false,
    },
    createdByCollege:{
      type: Boolean,
      default: false,
    },
    CreatedByAdmin :{
      type: Boolean,
      default: false,
    },
    // ---------------------------------------------
  },
);

// only the topics created by the admin will show to all colleges 
// college's topic will be saved in college's table only.

const Section = mongoose.model('Topics', sectionSchema);

module.exports = Section;

