
// isAuthenticatedUser middleware
const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const { Student } = require("../models/student/studentModel");
const BlacklistToken = require("../models/college/blacklistToken");

const isAuthenticatedUser= () => {

  return catchAsyncErrors(async (req, res, next) => {
    const token = req.header("auth-token");

    // console.log(token, "token");
 
    if (!token) {
      return next(new ErrorHander("Please Login to access this resource", 401));
    }
    // const blacklistedToken = await BlacklistToken.findOne({
    //   token  : token
    //       });
    const allBlacklistedTokens = await BlacklistToken.find();

    let isBlacklisted = false;
    allBlacklistedTokens.forEach((blacklistedToken) => {
      if (blacklistedToken.token === token) {
        isBlacklisted = true;
      }
    });
    if (isBlacklisted) {
      return next(
        new ErrorHander("Token is blacklisted. Please login again", 401)
      );
    }
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    let user = await Student.findById(decodedData.id);
    // console.log(user);
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
// Usage
exports.isAuthenticatedStudent = isAuthenticatedUser(Student);
// exports.isAuthenticatedCollege = isAuthenticatedUser(College);
// exports.isAuthenticatedCompany = isAuthenticatedUser(Company);

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
