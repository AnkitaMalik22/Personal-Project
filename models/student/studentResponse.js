const mongoose = require("mongoose");

const studentResponseSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.ObjectId,
    ref: "Students",
    // required: [true, 'Please enter student id']
  },
  assessmentId: {
    type: mongoose.Schema.ObjectId,
    ref: "Assessment",
    // required: [true, 'Please enter assessment id']
  },
  testType:{
    type: String,
    default: "adaptive",
    enum: ["adaptive", "non-adaptive"],

  },
  topics: [
    {
      Type: String,
      Heading: String,
      Description: String,

      questions: [
        {
          // questionId: {
          //     type: mongoose.Schema.ObjectId,
          //     ref: 'Question',
          //     // required: [true, 'Please enter question id']
          // },
          id: {
            type: String,
            // required:true
          },
          QuestionLevel: {
            type: String,
            default: "beginner",
            enum: ["beginner", "intermediate", "advanced"],
          },

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
          }, // for MCQ
          StudentAnswerIndex: {
            type: Number,
            // required: [true, 'Please enter student answer index']
          },
          marks: {
            type: Number,
            default: 0,
          },
          // for subjective
          // studentAnswer: {
          //     type: String,
          //     // required: [true, 'Please enter student answer']
          // }
        },
      ],
      essay: [
        {
          //    questionId: {
          //         type: mongoose.Schema.ObjectId,
          //         ref: 'Essay',
          //         // required: [true, 'Please enter question id']
          //     },
          Title: String,
          Duration: String,
          Answer: {
            type: String,
            default: "",
          },
          studentAnswer: {
            type: String,
            // required: [true, 'Please enter student answer']
          },
          marks: {
            type: Number,
            default: 0,
          },
        },
      ],
      video: [
        {
          Duration: String,
          video: String,
          videoFile: String,
          // calulate total from client and send
          marks: {
            type: Number,
            default: 0,
          },
          long: [
            {
              Title: String,
              studentAnswer: String,
              Duration: String,
              marks: {
                type: Number,
                default: 0,
              }
            },
          ],
          short: [
            {
              Title: String,
              studentAnswer: String,
              Duration: String,
              marks: {
                type: Number,
                default: 0,
              }
            },
          ],
          questions: [
            {
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
              }, // for MCQ
              StudentAnswerIndex: {
                type: Number,
                // required: [true, 'Please enter student answer index']
              },
              attempted : {
                type: Boolean,
                default: false
              },
              marks: {
                type: Number,
                default: 0,
              },
              
            },
          ],
          VideoLink: String,

          mcq: [],
          essay: [],
          findAnswer: [],
          shortAnswer: [],
          longAnswer: [],
          studentAnswer: {
            type: String,
            // required: [true, 'Please enter student answer']
          },
        },
      ],
      findAnswers: [
        {
          Title: String,
          marks: {
            type: Number,
            default: 0,
          },
          questions: [
            {
              question: String,
              studentAnswer: String,
            
            },
          ],
          Duration: String,

          Answer: {
            type: String,
            default: "",
          },

          QuestionType: {
            type: String,
            default: "findAnswer",
          },
          studentAnswer: {
            type: String,
            // required: [true, 'Please enter student answer']
          },
        },
      ],
      compiler: [
        {
          Duration: String,
          code: {
            type: String,
            default: `printf('hello world')`,
          },
          verificationCode: {
            type: String,
            default: "",
          },
          codeQuestion: {
            type: String,
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

          testcase: {
            type: [
              {
                input: String,
                expectedOutput: String,
                studentOutput: String,
                passed: Boolean,
              },
            ],
            // input : "",
            // expectedOutput :"" ,
            // studentOutput : "",
            // passed : false,
          },
          output: {
            type: [],
          },
          studentAnswer: {
            type: String,
            // required: [true, 'Please enter student answer']
          },
        },
      ],
    },
  ],
  percentage: {
    type: Number,
    default: 0,
  },

  mcqMarks: {
    type: Number,
    default: 0,
  },
  codingMarks: {
    type: Number,
    default: 0,
  },
  essayMarks: {
    type: Number,
    default: 0,
  },
  videoMarks: {
    type: Number,
    default: 0,
  },
  findAnswerMarks: {
    type: Number,
    default: 0,
  },
  marks: {
    type: Number,
    default: 0,
  },
  totalMarks: {
    type: Number,
    default: 0,
  },
});

const studentResponse = mongoose.model(
  "StudentResponse",
  studentResponseSchema
);
module.exports = studentResponse;
