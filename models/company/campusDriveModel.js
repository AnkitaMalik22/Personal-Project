const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const CampusDriveSchema = new Schema({

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

    company:{ 
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    colleges : [
        {
            type: Schema.Types.ObjectId,
            ref: 'College'
        }
    ],

    tests : [
        {
            test : {
                type: Schema.Types.ObjectId,
                ref: 'Assessments'
            },
            assignedTo : {
                type: Schema.Types.ObjectId,
                ref: 'College'
            },
            students :[
                {
                  student : {
                        type: Schema.Types.ObjectId,
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
                        type : Schema.Types.ObjectId,
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


module.exports = mongoose.model('CampusDrive', CampusDriveSchema);
