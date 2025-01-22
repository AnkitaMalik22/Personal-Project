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

    coverPhoto : {
        type: String,
        default: 'https://via.placeholder.com/150'
    },
// ----------- Act as an Community -------------
    company:{ 
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
// --------------------------------------------- 

    companies : [
        {
            type: Schema.Types.ObjectId,
            ref: 'Company'
        }
    ],

    colleges : [
        {
            type: Schema.Types.ObjectId,
            ref: 'College'
        }
    ],

    testsAssignedColleges : [
        {
            type: Schema.Types.ObjectId,
            ref: 'College'
        }],

    tests : [
        {
            test : {
                type: Schema.Types.ObjectId,
                ref: 'Assessments'
            },
            assignedTo :[ {
                type: Schema.Types.ObjectId,
                ref: 'College'
            }],
            students :[
                {
                  student : {
                        type: Schema.Types.ObjectId,
                        ref: 'Students'
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
                    },
                    collegeId : {
                        type: Schema.Types.ObjectId,
                        ref: 'College'
                    },

                    selectedBy : {
                        type: Schema.Types.ObjectId,
                        ref: 'Company'
                    },

                       
                    // updated
                        selection : {
                    
                          selectedBy : {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'Company'
                          },
                          status : {
                            type: String,
                            enum: ["pending", "completed", "rejected", "shortlisted", "hired", "not_hired"],
                            default: "pending",
                          },
                        },
                    

                    selectedForInterview : {
                        type: Boolean,
                        default: false
                    },

                    interviewStatus : {
                        type: String,
                        enum: ['pending', 'completed', 'rejected', 'shortlisted', 'hired', 'not_hired'],
                        default: 'pending'
                    },

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
    },
    updatedAt : {
        type: Date,
        default: Date.now
    },
    createdBy : {
        type: Schema.Types.ObjectId,
        ref: 'Company'
    },
});


// campusDriveSchema.pre('remove', async function(next) {
//     await studentResponse.deleteMany({campusDrive: this._id});
//     next();
// });


module.exports = mongoose.model('CampusDrive', CampusDriveSchema);
