const { Student } = require("../../models/student/studentModel");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ErrorHandler = require("../../utils/errorhandler");
const StudentResponse = require("../../models/student/studentResponse");
const StudentScreenshots = require("../../models/student/studentScreenshots");
const Assessments = require("../../models/college/assessment/assessments");
const cloudinary = require("cloudinary");

// api route: POST /api/student/test/:id/screenshot // body: { screenshot }
const saveStudentScreenshot = catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id);

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const assessment = await Assessments.findById(req.params.id)

    if (!assessment) {
      return next(new ErrorHandler("Assessment not found", 404));
    }

    const studentResponse = await StudentResponse.findOne({
      studentId: req.user.id,
      assessmentId: req.params.id,
    });

    if (!studentResponse) {
      return next(new ErrorHandler("Student response not found", 404));
    }

    // Check if the screenshot file was uploaded
    if (!req.files || !req.files.screenshot) {
      return next(new ErrorHandler("Please upload a screenshot", 400));
    }

    const screenshotFile = req.files.screenshot;

    // Upload the image to Cloudinary
    const result = await cloudinary.v2.uploader.upload(screenshotFile.tempFilePath, {
      folder: "screenshots",
      width: 150,
      crop: "scale",
    });

    if (!result) {
      return next(new ErrorHandler("Screenshot not uploaded", 400));
    }

    // Update the student response with the new screenshot
    const studentScreenshot = await StudentScreenshots.findOneAndUpdate(
      { studentId: req.user.id, assessmentId: req.params.id },
      {
        studentResponseId: studentResponse._id,
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
      { upsert: true}
    );

    res.status(200).json({
      success: true,
     screenshots: studentScreenshot.screenshots,
    });
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
});


const getScrenshotsFromStudentResponse = catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id);

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }
    const limit = parseInt(req.query.limit) || 100; // Default limit to 10 if not provided
    const skip = parseInt(req.query.skip) || 0; // Default skip to 0 if not provided
    
    const screenshots = await StudentScreenshots.find({ studentResponseId: req.params.id })
      .skip(skip)
      .limit(limit);
    

    res.status(200).json({
      success: true,
      screenshots
    });
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
});

module.exports = {
  saveStudentScreenshot,
};
