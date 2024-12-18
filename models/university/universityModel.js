const mongoose = require("mongoose");

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

const University = mongoose.model("University", university);

module.exports = University;
