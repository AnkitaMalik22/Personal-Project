const mongoose = require("mongoose");

const inboxSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "refModel",
    },
    refModel: {
      type: String,
      required: true,
      enum: ["College", "Student"],
    },
    emailsReceived: [
      {
        mail: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Mail",
        },
      },
    ],
    emailsSent: [
      {
        mail: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Mail",
        },
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
