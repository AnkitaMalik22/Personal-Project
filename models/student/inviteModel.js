const mongoose = require("mongoose");

// Define schema for Invitation model
const invitationSchema = new mongoose.Schema({
  FirstName: {
    type: String,
    required: [true, "Please add a FirstName"],
  },
  LastName: {
    type: String,
    required: [true, "Please add a LastName"],
  },
  Email: {
    type: String,
    required: [true, "Please add an Email"],
    unique: true,
  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
  recipientEmail: { type: String, required: true },
  invitationLink: { type: String, required: true, unique: true },
  sentAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "accepted", "expired"],
    default: "pending",
  },
});

// Create model from schema
const Invitation = mongoose.model("Invitation", invitationSchema);

module.exports = Invitation;
