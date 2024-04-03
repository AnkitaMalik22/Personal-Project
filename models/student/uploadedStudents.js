const mongoose = require('mongoose');

const UploadedStudentsSchema = new mongoose.Schema({

   college_id: {
        type: String,
        ref: "College",
    },
    FirstName: {
        type: String,
        required: [true, 'Please add a FirstName']
    },

    LastName: {
        type: String,
        required: [true, 'Please add a LastName']
    },

    Email: {
        type: String,
        required: [true, 'Please add an Email'],
        unique: true
    },
    invited: {
        type: Boolean,
        default: false
    },

});

const UploadedStudents = mongoose.model('UploadedStudents', UploadedStudentsSchema);

module.exports = UploadedStudents;