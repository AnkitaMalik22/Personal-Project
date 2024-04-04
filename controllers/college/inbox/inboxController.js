const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const College = require("../../../models/college/collegeModel");
const Inbox = require("../../../models/college/inbox/Inbox");
const { Student } = require("../../../models/student/studentModel");
const ErrorHandler = require("../../../utils/errorhandler");

// Forgot Password
exports.sendEMail = catchAsyncErrors(async (req, res, next) => {
  const role = req.params.role;
  let user, emailTo;
  if (role === "college") {
    user = await College.findOne({ Email: req.body.Email });
  } else {
    user = await Student.findOne({ Email: req.body.Email });
  }

  const college = await College.findOne({ Email: req.body.Email });
  const student = await Student.findOne({ Email: req.body.Email });
  if (college) {
    emailTo = "College";
  } else if (student) {
    emailTo = "Student";
  } else {
    return next(new ErrorHandler("not found", 404));
  }
  try {
    const sender = await Inbox.findOneAndUpdate(
      { user: req.user.id }, // Find the document with the specified user ID
      {
        $push: {
          emailsSent: {
            refModel: emailTo,
            Date: new Date(),
            to: user._id,
            message: req.body.Message,
            subject: req.body.Subject,
          },
        },
      },
      { new: true, upsert: true } // Return the modified document after update
    );
    sender.emailsSent.reverse();
    const receiver = await Inbox.findOneAndUpdate(
      { user: user._id }, // Find the document with the specified user ID
      {
        $push: {
          emailsReceived: {
            refModel: emailTo,
            Date: new Date(),
            from: req.user.id,
            message: req.body.Message,
            subject: req.body.Subject,
          },
        },
      },
      { new: true, upsert: true } // Return the modified document after update
    );

    res.status(200).send({ sender, receiver });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.getEmail = catchAsyncErrors(async (req, res, next) => {
  try {
    const mail = await Inbox.findOne({ user: req.user.id }).populate({
      path: "emailsReceived.from",
      select: "FirstName LastName Email CollegeName",
    });

    res.status(200).send({ success: true, mail });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
