const mongoose = require("mongoose");
const { Schema } = mongoose;
const {BRANCH_NAMES} = require("../../../utils/constants/assessmentConstants");

// NOT IN USE 

const BranchSchema = new Schema({
  name: { type: String, enum: BRANCH_NAMES, required: true, unique: true },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    // required: true,
  },
  code: { type: String, unique: true }, // Optional: Short code like "ENG" or "MED"
  departments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
  ], // References to Department documents
 // ["CSE", "ECE", "ME", "Other"]
 // ["CSE", "ECE", "ME", "Other"]
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Branch", BranchSchema);
