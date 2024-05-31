const mongoose = require("mongoose");
const { Schema } = mongoose;

const compilerSchema = new Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
  },
  //   ---------- req.body -------------
  id: {
    type: String,
    // required:true
  },
  QuestionLevel: {
    type: String,
    default: "beginner",
    enum: ["beginner", "intermediate", "advanced"],
  },
  QuestionType: {
    type: String,
    default: "Compiler",
  },
  Duration: String,
  Title: String,
  generatedDriverCode: {
    type : Boolean,
    default : false
  },
  code: {
    type: {
      C: {
        defaultCode: String,
        solutionCode: String,
      },
      Cpp: {
        defaultCode: String,
        solutionCode: String,
      },
      Java:{
        defaultCode: String,
        solutionCode: String,
      },
      Python: {
        defaultCode: String,
        solutionCode: String,
      },
    
    },
  },
  // QUESTION DESCRIPTION
  codeQuestion: {
    type: String,
  },

  parameters: {
    type: [],
  },
  returnType: {
    type: String,
  },
 
  testcase: {
    type: [
      {
        input: String,
        expectedOutput: String,
        // studentOutput: String,
        // passed: Boolean,
        isHidden: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  totalTestCases: {
    type: Number,
    default: 0,
  },
 
  //   ---------------------------------
  // Answer: {
  //   type: String,
  //   default: "",
  // },

// ---- not in use----
  codeLanguage: {
    type: String,
  },
  output: {
    type: [],
  },
  verificationCode: {
    type: String,
    default: "",
  },
//  ----------------
  // QuestionBankID: Number,
  // Status: String,
  TotalMarks: Number,
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
  },
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

const Compiler = mongoose.model("Compiler", compilerSchema);

module.exports = Compiler;
