const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const CollegeAssessInv = require("../../models/student/assessmentInvitation");
const CompilerLog = require("../../models/student/compilerLog");

const ErrorHandler = require("../../utils/errorhandler");

exports.findLogCompiler = catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await CollegeAssessInv.findOne({
      student: req.user.id,
    }).populate("assessments.assessment");

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const assessment = student.assessments.find(
      (assessment) =>
        assessment?.assessment?._id?.toString() === req.params.testId
    );

    const log = await CompilerLog.find({
      question: req.query.question,
      attempt: assessment.attempts,
      assessment: assessment._id,
      student: req.user.id,
    });

    res.status(200).json({ success: true, logs: log });
  } catch (error) {
    return next(new ErrorHandler("Error fetching tests", 500));
  }
});

exports.addLog = catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await CollegeAssessInv.findOne({
      student: req.user.id,
    }).populate("assessments.assessment");

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const assessment = student.assessments.find(
      (assessment) =>
        assessment?.assessment?._id?.toString() === req.params.testId
    );
    console.log(req.body);
    const log = await CompilerLog.create({
      question: req.body.question,
      attempt: assessment.attempts,
      assessment: assessment._id,
      student: req.user.id,
      code: req.body.code,
      testcase: req.body.testcase,
      codeLanguage: req.body.codeLanguage,
      ...req.body,
    });

    res.status(200).json({ success: true, log: log });
  } catch (error) {
    return next(new ErrorHandler("Error fetching tests", 500));
  }
});
