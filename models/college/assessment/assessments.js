const mongoose = require("mongoose");
const { Schema } = mongoose;

const assessmentsSchema = new Schema({

  name: {
    type: String,
    required: true,
  },
  // Total time in minutes = All sections time
  totalTime: {
    type: Number,
    default: 0,
    // required: true,
  },
  totalSectionsCount: {
    type: Number,
    default: 0,
    max: 5,
  },
  level: {
    type: String,
    default: "beginner",
    enum: ["beginner", "intermediate", "advanced"],
    // required: true,
  },
  type: {
    type: String,
    default: "mcq",
    // required: true,
  },
  status: {
    type: String,
    default: "active",
    // required: true,
  },
  // if this is an college assessment
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
  },
  // if this is an company assessment 
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  createdByCompany: {
    type: Boolean,
    default: false,
  },
  sections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
  }],
});

const Assessments = mongoose.model("Assessments", assessmentsSchema);

module.exports = Assessments;
