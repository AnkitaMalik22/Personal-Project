const mongoose = require('mongoose');

const validateRef = (value) => {
    const allowedCollections = ["Any"];
    if (!allowedCollections.includes(value)) {
      throw new Error("Invalid reference collection.");
    }
  }


const inboxSchema = new mongoose.Schema({

    emails: [
        {
          from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Any",
            validate: [validateRef, "Invalid reference collection."],
          },
          message: String,
          subject: String,
        },
      ],
      emailsSent: [
        {
          to: String,
          message: String,
          subject: String,
        },
      ],
});



const Inbox = mongoose.model('Inbox', inboxSchema);

module.exports = Inbox;