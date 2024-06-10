const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");

exports.qrWare = catchAsyncErrors(async (req, res, next) => {
  const token = req.header("auth-token");

  const existingLogin = req.user.loginActivity.find((activity) => {
    console.log(activity.token_id === token);
    return activity.token_id === token;
  });

  if (existingLogin) {
    if (req.user.authType === "qr") {
      console.log(existingLogin.qrVerify, "ex");
      if (!existingLogin.qrVerify) {
        return res.status(500).json({ success: "false" });
      }
    }
  }

  return next();
});
