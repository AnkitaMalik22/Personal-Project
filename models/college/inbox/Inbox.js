const mongoose = require("mongoose");

const inboxSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "refModel",
    },
    emailsReceived: [
      {
        refModel: {
          type: String,
          required: true,
          enum: ["College", "Student"],
        },
        Date: Date,
        from: {
          type: mongoose.Schema.ObjectId,
          refPath: "emailsReceived.refModel",
        },
        message: String,
        subject: String,
        ref: String,
      },
    ],
    emailsSent: [
      {
        Date: Date,
        to: String,
        message: String,
        subject: String,
      },
    ],
  },
  { timestamps: true }
);

const Inbox = mongoose.model("Inbox", inboxSchema);

// Inbox.pre("save", function (next) {
//   // Update customTimestamp field to current date and time
//   this.customTimestamp = new Date();
//   next();
// });

module.exports = Inbox;
