
const {Student} = require("../models/student/studentModel");
const BlacklistToken = require("../models/college/blacklistToken");

const sendToken = async (user, statusCode, res, ip, device) => {
  const token = user.getJWTToken();

  // Options for cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: "None",
    // Add other cookie options if needed
  };

  // Set cookie with the token
  res.cookie('token', token, options);

  // Remove the token from the blacklist
  await BlacklistToken.deleteOne({ token });

const existingLogin = user.loginActivity.find(activity => activity.ip === ip);

if (existingLogin) {
  console.log('Token already exists');
  // Token already exists, update the existing entry
  existingLogin.token_deleted = false;
  existingLogin.device = device;
  existingLogin.token_id = token;
  existingLogin.logged_in_at = Date.now();
} else {
  console.log('Token does not exist');
  // Token doesn't exist, add a new entry
  user.loginActivity.push({
    ip,
    logged_in_at: Date.now(),
    device,
    token_id: token,
    token_deleted: false,
  });
}


  // Update the user document in the database
  await Student.findByIdAndUpdate(
    user._id,
    { loginActivity: user.loginActivity },
    { new: true }
  );

  // Send response with token, user information, IP address, and device
  res.status(statusCode).json({
    success: true,
    user,
    token,
    ip,
    device,
  });
};

module.exports = sendToken;




