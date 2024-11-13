const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Company = require("../models/company/companyModel");

exports.isAuthenticatedCompany = catchAsyncErrors(async (req, res, next) => {
  // Get the token from the authorization header
  const token = req.header("auth-token");

  if (!token) {
    return next(new ErrorHander("Please Login to access this resource", 401));
  }

  try {
    // Verify the token
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    let user = await Company.findById(decodedData.id);
    if (!user) {
      console.log("user not found -inside companyAuth");
      return next(new ErrorHander("User not found with this token. Please login again", 404));
    }

    // Attach the user to the request object
    req.user = user;
    if(user.status==="pending"){
      return res.status(401).json({success:true,message:"account under review"});
    }
    next();

  } catch (error) {
    // Handle token expiration or invalid token
    if (error.name === "TokenExpiredError") {
      return next(new ErrorHander("Token has expired. Please login again", 401));
    }
    return next(new ErrorHander("Invalid token. Please login again", 401));
  }
});
