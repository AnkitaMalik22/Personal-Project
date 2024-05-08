const mongoose = require('mongoose');

const QbTopicsSchema = new mongoose.Schema({

    topics:[],
  
  
  // ----------------------------------
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    // ref : 'Company',
    required: true,
  },
    // -----------------------------------------
  },{timestamps: true});


module.exports = mongoose.model('QbTopics', QbTopicsSchema);

