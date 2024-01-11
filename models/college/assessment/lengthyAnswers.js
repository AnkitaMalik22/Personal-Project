const mongoose = require('mongoose');
const { Schema } = mongoose;

const lengthyAnswersSchema = new Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  },
  AnswerText: String,
});

const LengthyAnswers = mongoose.model('LengthyAnswers', lengthyAnswersSchema);

module.exports = LengthyAnswers;
