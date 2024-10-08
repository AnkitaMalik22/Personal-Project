const mongoose = require("mongoose");

const studentScreenshotsSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Students",
      required: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessments",
      required: true,
    },
    screenshots: {
      type: Array,
      default: [
        {
          image: {
            public_id: {
              type: String,
              required: true,
            },
            url: {
              type: String,
              required: true,
            },

          },
          date: new Date(),
        },
      ],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentScreenshots", studentScreenshotsSchema);
