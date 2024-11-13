const Company = require("../models/company/companyModel");


const sendTokenCompany = async (user, statusCode, res) => {
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


  // Send response with token, user information, IP address, and device
  res.status(statusCode).json({
    success: true,
    user,
    token
  });
};

module.exports = sendTokenCompany;
