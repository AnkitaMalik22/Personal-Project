const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ErrorHandler = require("../../utils/errorhandler");

exports.access = catchAsyncErrors(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorHandler("User not found", 401));
  }

  return res.status(200).json({
    success: true,
    payload: {
      user: req.user,
    },
    message: `User is authenticated`,
  });
});
