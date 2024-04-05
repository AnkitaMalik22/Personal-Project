const mongoose = require('mongoose');

const recentQuestionsSchema = new mongoose.Schema({



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

module.exports = mongoose.model('RecentQuestions', recentQuestionsSchema);
