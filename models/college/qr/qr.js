const mongoose = require("mongoose");

const qrSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
  code: String,
  secret: {
    ascii: { type: String, required: true },
    hex: String,
    base32: String,
    otpauth_url: String,
  },
});

const Qr = mongoose.model("Qr", qrSchema);

module.exports = Qr;
