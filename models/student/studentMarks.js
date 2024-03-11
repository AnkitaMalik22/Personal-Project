const mongoose = require('mongoose');


const studentMarksSchema = new mongoose.Schema({
    student_id: {
        type: String,
        ref: 'Students'
    },
    assessment_id: {
        type: String,
        ref: 'Assessment'
    },
    mcq_marks: {
        type: Number,
        // required: [true, 'Please enter marks']
    },
    marks: {
        type: Number,
        // required: [true, 'Please enter marks']
    }

});

module.exports = mongoose.model('StudentMarks', studentMarksSchema);

