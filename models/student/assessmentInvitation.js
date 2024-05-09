const mongoose = require("mongoose");

// Define schema for Invitation model
const collegeAssessInvSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  email: { type: String },
  assessments: [
    {
      active: { type: Boolean },
      onGoingAssessment: { type: String },

      completed: { type: Boolean },
      completedAt: { type: Date },
      startedAt: { type: Date },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
      assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessments" },
      response:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: "StudentResponse"
      },
      percentage:{
        type: Number  
      },
      level:{
        type: Number
      },
      marks :{
        type: Number,
        default: 0
      },
      negativeCount:{
        type : Number,
        default: 0
      },
      L1marks:{
        type: Number
      },
      L2marks:{
        type: Number
      },
      L3marks:{
        type: Number
      },
      attempts :{
        type: Number,
        default: 0
      },
      
      
    },
  ],
});

// Create model from schema
const CollegeAssessInv = mongoose.model(
  "CollegeAssessInv",
  collegeAssessInvSchema
);

module.exports = CollegeAssessInv;
