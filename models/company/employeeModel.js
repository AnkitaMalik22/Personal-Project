const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const employeeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    hiredFrom: {
        jobRef: {
            type: Schema.Types.ObjectId,
            ref: 'Job',
            required: true
        },
        studentRef: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
            required: true
        }
    },
    dateOfHire: {
        type: Date,
        default: Date.now
    }
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;