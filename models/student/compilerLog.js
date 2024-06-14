const mongoose = require("mongoose");

const compilerLogSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Students" },
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessments" },
    attempt: { type: Number, default: 1 },
    code: {
      C: {
        defaultCode: String,
        solutionCode: String,
        answerCode: String,
      },
      Cpp: {
        defaultCode: String,
        solutionCode: String,
        answerCode: String,
      },
      Java: {
        defaultCode: String,
        solutionCode: String,
        answerCode: String,
      },
      Python: {
        defaultCode: String,
        solutionCode: String,
        answerCode: String,
      },
    },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Compiler" },
    // {expectedOutput
    // :
    // "2 4"
    // input
    // :
    // "5 12\n1 2 3 7 5"
    // isHidden
    // :
    // true
    // output
    // :
    // "errror"
    // passed
    // :
    // false
    // _id
    // :
    // "666006e408b370f2994b8300"}
    testcase: [
      {
        input: String,
        output: String,
        expectedOutput: String,
        studentOutput: String,
        passed: {
          type: Boolean,
          default: false,
        },
        isHidden: {
          type: Boolean,
          default: true,
        },
        _id: { type: mongoose.Schema.Types.ObjectId },
      },
    ],
    totalTestCases: Number,
    totalPassedTestCases: Number,

    codeLanguage: String,
  },
  {
    timestamps: true,
  }
);

const CompilerLog = mongoose.model("CompilerLog", compilerLogSchema);

module.exports = CompilerLog;
