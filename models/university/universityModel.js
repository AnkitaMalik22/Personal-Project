const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const university = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
    },
    description: {
      type: String,
    },
    website: {
      type: String,
    },
    
    // Authentication & Access
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "university",
    },
    avatar: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    
    // Tests and Colleges
    tests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assessments",
      },
    ],
    colleges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Colleges",
      },
    ],

    // Admin and Verification
    isApproved: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved" ,"rejected"],
      default: "pending",
    },
    statusChangedAt: {
      type: Date,
      default: Date.now,
    },
    commentsByAdmin: [
      {
        comment: {
          type: String,
        },
        commentedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },
        commentedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    adminNotes: {
      type: String,
    },

    // Additional Fields
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    loginActivity: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LoginActivity",
      },
    ],
  },
  { timestamps: true }
);

university.pre("save", async function (next) {
  if (!this.isModified("Password")) {
    next();
  }

  this.Password = await bcrypt.hash(this.Password, 10);
});

// JWT TOKEN
university.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Compare Password

university.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.Password);
};

// Generating Password Reset Token
university.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hashing and adding resetPasswordToken to university
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};


const University = mongoose.model("University", university);

module.exports = University;
