const mongoose = require("mongoose");

const mailSchema = new mongoose.Schema(
  {
    Mailtype: {
      type: String,
      required: true,
      enum: ["College", "Student"],
    },
    isDeletedReceiver: [{ user: mongoose.Schema.ObjectId }],
    isDeletedSender: [{ user: mongoose.Schema.ObjectId }],
    MailtypeFrom: {
      type: String,
      required: true,
      enum: ["College", "Student"],
    },
    Date: Date,
    to: {
      type: mongoose.Schema.ObjectId,
      refPath: "Mailtype",
    },
    from: {
      type: mongoose.Schema.ObjectId,
      refPath: "MailtypeFrom",
    },
    message: String,
    subject: String,

    attachments: [
      {
        url: String,
        size: String,
        name: String,
        format: String,
      },
    ],
    replies: [
      {
        message: String,
        attachments: [
          {
            url: String,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Mail = mongoose.model("Mail", mailSchema);

// Inbox.pre("save", function (next) {
//   // Update customTimestamp field to current date and time
//   this.customTimestamp = new Date();
//   next();
// });

module.exports = Mail;
