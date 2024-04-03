const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const College = require("../../../models/college/collegeModel");
const { Student } = require("../../../models/student/studentModel");
const ErrorHandler = require("../../../utils/errorhandler");

// Forgot Password
exports.sendEMail = catchAsyncErrors(async (req, res, next) => {
  const role = req.params.role;
  let user;

  if (role === "college") {
    user = await College.findById(req.user.id);
  } else {
    user = await Student.findById(req.user.id);
  }

  let college = await College.findOne({ Email: req.body.Email });
  let student = await Student.findOne({ Email: req.body.Email });
  if (!college && !student) {
    return next(new ErrorHandler("not found", 404));
  }

  try {
    if (college) {
      const result = await college.updateOne({
        $push: {
          emails: {
            from: req.user.id,
            message: req.body.Message,
            subject: req.body.Subject,
          },
        },
      });
      await user.updateOne({
        $push: {
          emailsSent: {
            to: req.body.Email,
            message: req.body.Message,
            subject: req.body.Subject,
          },
        },
      });
      user = await College.findById(req.user.id);

      res.status(200).json({
        success: true,
        message: `Email sent successfully`,
        inbox: user.emails,
        sent: user.emailsSent,
      });
    }
    if (student) {
      const result = await college.updateOne({
        $push: {
          emails: {
            from: req.user.id,
            message: req.body.Message,
            subject: req.body.Subject,
          },
        },
      });
      await user.updateOne({
        $push: {
          emailsSent: {
            to: req.body.Email,
            message: req.body.Message,
            subject: req.body.Subject,
          },
        },
      });
      res.status(200).json({
        success: true,
        message: `Email sent successfully`,
        result,
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
