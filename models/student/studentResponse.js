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
    answers: [
        {
            topicId: {
                type: mongoose.Schema.ObjectId,
                ref: 'Topic',
                // required: [true, 'Please enter topic id']
            },
            questions: [
                {
                    questionId: {
                        type: mongoose.Schema.ObjectId,
                        ref: 'Question',
                        // required: [true, 'Please enter question id']
                    },
                    // for MCQ
                    studentAnswerIndex: {
                        type: Number,
                        // required: [true, 'Please enter student answer index']
                    },
                    // for subjective
                    studentAnswer: {
                        type: String,
                        // required: [true, 'Please enter student answer']
                    }
                }
            ]
        }
    ]
});

module.exports = mongoose.model('StudentResponse', studentResponseSchema);
