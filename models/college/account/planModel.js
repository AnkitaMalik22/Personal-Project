const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  credit: {
    type: Number,
    required: true
  },
  limit: {
    type: Number,
    required: true
  },
  charges: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  members :[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College'
    }
  
  ]
});

const PaymentPlan = mongoose.model('PaymentPlan', paymentSchema);

module.exports = PaymentPlan;
