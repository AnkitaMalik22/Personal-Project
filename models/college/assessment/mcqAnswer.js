const mongoose = require("mongoose");
const { Schema } = mongoose;

const mcqAnswersSchema = new Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  },
  //For Student
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  AnswerText: {
    type: String,
    enum: ["option_1", "option_2", "option_3", "option_4"],
  },
});

const MCQAnswers = mongoose.model("MCQAnswers", mcqAnswersSchema);

module.exports = MCQAnswers;
