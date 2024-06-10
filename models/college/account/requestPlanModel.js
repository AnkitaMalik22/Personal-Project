const mongoose = require("mongoose");

const requestPlanSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
  },
  requestedOn: {
    type: Date,
    require: true,
  },
  isPurchased: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: "",
  },
  collegeId: {
    type: String,
    required: true,
  },
});

const requestPlan = mongoose.model("admin_request", requestPlanSchema);

module.exports = requestPlan;
