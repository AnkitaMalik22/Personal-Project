const mongoose = require('mongoose');
const { Schema } = mongoose;


const questionsSchema = new Schema({

    questionName: {
        type: String,
        // required: true,
        },

});

const Questions = mongoose.model('FindAnsQuestions', questionsSchema);

const findAnswerSchema = new Schema({

    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
      },
      section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
      },
    //   ---------- req.body -------------
      Title: String,
      questions :[],
      Duration : String,
    //   ---------------------------------
      Answer: {
        type: String,
        default: '',
      },

      QuestionType: {
        type: String,
        default: 'findAnswer',
      },
      
      QuestionBankID: Number,
      Status: String,
      TotalMarks: Number,
        college: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'College',
        },
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

});



const findAnswer = mongoose.model('FindAnswer', findAnswerSchema);

module.exports = findAnswer;