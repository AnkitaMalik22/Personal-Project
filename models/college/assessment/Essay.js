const mongoose = require('mongoose');
const { Schema } = mongoose;

const essaySchema = new Schema({
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
      },
      section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
      },
    //   ---------- req.body -------------
    id:{
      type:String,
      // required:true
  },
      Title: String,
      Duration : String,
      QuestionLevel: {
        type: String,
        default: "beginner",
        enum: ["beginner", "intermediate", "advanced"],
      },
    //   ---------------------------------
      Answer: {
        type: String,
        default: '',
      },

      QuestionType: {
        type: String,
        default: 'essay',
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

const Essay = mongoose.model('Essay', essaySchema);

module.exports = Essay;

    