const mongoose = require('mongoose');


const sessionSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    ipAddress: { type: String },
    userAgent: { type: String },
    loggedInAt: { type: Date, default: Date.now },
    loggedOutAt: { type: Date }
  });

module.exports = mongoose.model('Session', sessionSchema);



