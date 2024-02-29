const mongoose = require("mongoose");
const { Schema } = mongoose;

const videoSchema = new Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
  },
  // ---------- req.body -------------
  Title: String,
  questions: [],
  Options: {
    type: Array,
    default: [],
  },
  AnswerIndex: {
    type: Number,
    default: -1,
  },
  VideoLink: String,
  // ---------------------------------
  QuestionBankID: Number,
  Status: String,
  TotalMarks: Number,
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  createdByCompany: {
    type: Boolean,
    default: false,
  },
});

const Video = mongoose.model("Video", videoSchema);
module.exports = Video;
