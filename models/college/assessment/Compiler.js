const mongoose = require('mongoose');
const { Schema } = mongoose;

const compilerSchema = new Schema({
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
  QuestionLevel: {
    type: String,
    default: "beginner",
    enum: ["beginner", "intermediate", "advanced"],
  },
    Duration : String,
      code: {
        type: String,
        default: `printf('hello world')`
      },
      verificationCode: {
        type: String,
        default: '',
      },
      codeQuestion:{
         type:String,
       },
      codeLanguage: {
        type: String,
        // enum:['c','cpp','java','python','javascript'],
      },
      parameters: {
       type: [],
       },
      returnType: {
        type: String,
        // enum: ['int', 'boolean', 'string'],
      },
      
       testcase:{
        type:[],
        },
       output:{
         type:[],
        },
    //   ---------------------------------
      Answer: {
        type: String,
        default: '',
      },

      QuestionType: {
        type: String,
        default: 'Compiler',
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

const Compiler = mongoose.model('Compiler', compilerSchema);

module.exports = Compiler;

    