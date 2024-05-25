const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const CollegeAssessInv = require("../../../models/student/assessmentInvitation");
const ErrorHandler = require("../../../utils/errorhandler");

// /api/college/student/tests/
exports.getStudentTests = catchAsyncErrors(async (req, res, next) => {
  try {
    const id = req.params.id;

    const assess = await CollegeAssessInv.findOne({
      student: req.params.id,
    }).populate({
      path: "assessments.assessment",
      select: "-topics",
    });
    if (!assess) {
      return next(new ErrorHandler("Assessments not found", 404));
    }
    const assessments = assess.assessments.filter((ass) => ass.attempts > 0);
    res.json({ success: "true", assessments });
  } catch (error) {
    return next(new ErrorHandler("Internal server error", 500));
  }
});
