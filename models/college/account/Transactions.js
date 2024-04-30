const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
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
  Date : {
    type: Date,
    default: Date.now
  },
  user :{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  }
  

});

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
