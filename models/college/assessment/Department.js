const mongoose = require("mongoose");
const {
  ENG_DEPARTMENTS,
  MEDICAL_DEPARTMENTS,
  ARTS_DEPARTMENTS,
  SCIENCE_DEPARTMENTS,
  COMMERCE_DEPARTMENTS,
} = require("../../../utils/constants/assessmentConstants");

const Schema = mongoose.Schema;

const DepartmentSchema = new Schema({
  categoryID: {
    type: Schema.Types.ObjectId,
    ref: "Category",
  },
  name: {
    type: String,
    enum: {
      values: ENG_DEPARTMENTS.concat(MEDICAL_DEPARTMENTS)
        .concat(ARTS_DEPARTMENTS)
        .concat(SCIENCE_DEPARTMENTS)
        .concat(COMMERCE_DEPARTMENTS),
      message: "Invalid Department",
    },
    required: true,
  },
  code: {
    type: String,
    //   required: true,
    //   unique: true,
  },
  description: {
    type: String,
  },
  // branch: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Branch",
  //   // required: true,
  // },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Department", DepartmentSchema);
