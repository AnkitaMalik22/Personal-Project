const { Student } = require("../../models/student/studentModel");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ErrorHandler = require("../../utils/errorhandler");
const StudentResponse = require("../../models/student/studentResponse");
const Assessments = require("../../models/college/assessment/assessments");
const cloudinary = require("cloudinary");

// api route: POST /api/v1/student/test/:id/screenshot // body: { screenshot }
const saveStudentScreenshot = catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id);

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const assessment = await Assessments.findOne({ studentId: req.params.id });

    if (!assessment) {
      return next(new ErrorHandler("Assessment not found", 404));
    }

    const studentResponse = await Student.findOne({
      studentId: req.params.id,
      assessmentId: assessment._id,
    });

    if (!studentResponse) {
      return next(new ErrorHandler("Student response not found", 404));
    }

    const { screenshot } = req.body;

    if (!screenshot) {
      return next(new ErrorHandler("Please upload a screenshot", 400));
    }

    const result = await cloudinary.v2.uploader.upload(screenshot, {
      folder: "screenshots",
      width: 150,
      crop: "scale",
    });

    if (!result) {
      return next(new ErrorHandler("Screenshot not uploaded", 400));
    }

    const studentScreenshot = await StudentResponse.findOneAndUpdate(
      { studentId: req.params.id, assessmentId: assessment._id },
      {
        $push: {
          screenshots: {
            image: {
              public_id: result.public_id,
              url: result.secure_url,
            },
            date: new Date(),
          },
        },
      },
      { new: true, runValidators: true, useFindAndModify: false }
    );

    res.status(200).json({
      success: true,
      studentScreenshot,
    });
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
});

module.exports = {
  saveStudentScreenshot,
};
