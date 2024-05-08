const mongoose = require("mongoose");

const mailSchema = new mongoose.Schema(
  {
   mail: {
        type: mongoose.Schema.ObjectId,
        ref: "Mail",
    },
    userId:{
        type: mongoose.Schema.ObjectId,
        ref: "College",
    },
  },
  { timestamps: true }
);

const Mail = mongoose.model("BookmarkedMail", mailSchema);
module.exports = Mail;
