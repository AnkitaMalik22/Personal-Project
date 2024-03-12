const mongoose = require('mongoose');

const studentResponseSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Student',
        // required: [true, 'Please enter student id']
    },
    assessmentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Assessment',
        // required: [true, 'Please enter assessment id']
    },
    topics: [
        {

            questions: [
                {
                    // questionId: {
                    //     type: mongoose.Schema.ObjectId,
                    //     ref: 'Question',
                    //     // required: [true, 'Please enter question id']
                    // },


                    Title: String,
                    Options: {
                        type: Array,
                        default: [],
                    },
                    // For lengthy questions
                    Answer: {
                        type: String,
                        default: '',
                    },

                    AnswerIndex: {
                        type: Number,
                        default: -1,
                    },
                    QuestionType: {
                        type: String,
                        default: 'mcq',
                    },             // for MCQ
                    StudentAnswerIndex: {
                        type: Number,
                        // required: [true, 'Please enter student answer index']
                    },
                    marks : {
                        type: Number,
                        default: 0,
                    }
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
                        default: '',
                    },
                    studentAnswer: {
                        type: String,
                        // required: [true, 'Please enter student answer']
                    }
                }
            ],
            video: [
                {
                    Duration: String,
                    video: String,
                    videoFile: String,
                    long: [],
                    short: [],
                    questions: [],
                    VideoLink: String,

                    mcq: [],
                    essay: [],
                    findAnswer: [],
                    shortAnswer: [],
                    longAnswer: [],
                    studentAnswer: {
                        type: String,
                        // required: [true, 'Please enter student answer']
                    }
                }
            ],
            findAnswers: [
                {
                    Title: String,
                    questions: [],
                    Duration: String,

                    Answer: {
                        type: String,
                        default: '',
                    },

                    QuestionType: {
                        type: String,
                        default: 'findAnswer',
                    },
                    studentAnswer: {
                        type: String,
                        // required: [true, 'Please enter student answer']
                    }
                }
            ],
            compiler: [
                {
                    Duration: String,
                    code: {
                        type: String,
                        default: `printf('hello world')`
                    },
                    verificationCode: {
                        type: String,
                        default: '',
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
                        type: [],
                    },
                    output: {
                        type: [],
                    },
                    studentAnswer: {
                        type: String,
                        // required: [true, 'Please enter student answer']
                    }
                }
            ],

        }
    ],

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
});

module.exports = mongoose.model('StudentResponse', studentResponseSchema);
