const  mongoose = require('mongoose');
const studentResponse = require('../student/studentResponse');

const campusDriveSchema = new mongoose.Schema({

    name : {
        type: String,
        required: true
    },
    description : {
        type: String,
        required: true
    },

    coverPhoto :{
        public_id: {
            type: String,
          },
          url: {
            type: String,
          },
          file_name: {
            type: String,
          },
    },

    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    colleges : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'College'
        }
    ],

    tests : [
        {
            test : {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Assessments'
            },
            assignedTo : {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'College'
            },
            students :[
                {
                  student : {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Student'
                    },
                    status : {
                        type: String,
                        enum: ['pending', 'completed', 'rejected', 'shortlisted', 'hired', 'not_hired','invited'],
                    },
                    score : {
                        type: Number
                    },
                    studentResponse : {
                        type : mongoose.Schema.Types.ObjectId,
                        ref : 'StudentResponse'
                    }

                }
            ]
        }
    ],

    startDate : {
        type: Date,
        required: true
    },
    endDate : {
        type: Date,
        required: true
    },
    status : {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt : {
        type: Date,
        default: Date.now
    }
});


// campusDriveSchema.pre('remove', async function(next) {
//     await studentResponse.deleteMany({campusDrive: this._id});
//     next();
// });


module.exports = mongoose.model('CampusDrive', campusDriveSchema);

