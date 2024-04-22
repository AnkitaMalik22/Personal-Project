const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");

exports.qrWare = catchAsyncErrors(async (req, res, next) => {
  console.log(req.user, "qr user");
  if (req.user.authType === "qr" && req.user.qrVerify === false) {
    return res.status(500).json({ success: "false" });
  }
  return next();
});
