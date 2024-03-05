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
 



// questions:[{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Questions"
// }],


// essay :[{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Essay"
// }],
// findAnswers:[{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "FindAnswer"
// }],


video :String,
videoFile :String,
long:[],
short:[],
questions:[],
VideoLink: String,

mcq: [],
essay:[],
findAnswer:[],
shortAnswer:[],
longAnswer:[],

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
