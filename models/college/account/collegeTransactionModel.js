const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  creditUsed: { type: Number, required: true },
  for: { type: String, required: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: Date, required: true },
});

const collegeTransaction = mongoose.model(
  "college_transaction",
  transactionSchema
);

module.exports = collegeTransaction;
