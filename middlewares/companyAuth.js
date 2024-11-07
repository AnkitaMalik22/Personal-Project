
// isAuthenticatedUser middleware
const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");

const Company = require("../models/company/companyModel");

 exports.isAuthenticatedCompany= () => {

  return catchAsyncErrors(async (req, res, next) => {

    const token = req.header("auth-token");

    if (!token) {
      return next(new ErrorHander("Please Login to access this resource", 401));
    }
   
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    let user = await Company.findById(decodedData.id);

    if (!user) {
      return next(
        new ErrorHander(
          "User not found with this token. Please login again",
          404
        )
      );
    }
    req.user = user;
    next();
  });
};




exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHander(
          `Role: ${req.user.role} is not allowed to access this resouce `,
          403
        )
      );
    }

    next();
  };
};
