
// isAuthenticatedUser middleware
const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const College = require("../models/college/collegeModel");
const Company = require("../models/company/companyModel");
const { Student } = require("../models/student/studentModel");
const BlacklistToken = require("../models/college/blacklistToken");

const isAuthenticatedUser = (model) => {
  return catchAsyncErrors(async (req, res, next) => {
    const token = req.header("auth-token");
    if (!token) {
      return next(new ErrorHander("Please Login to access this resource", 401));
    }
    const allBlacklistedTokens = await BlacklistToken.find();
    // console.log(allBlacklistedTokens);
    // console.log("Token value:", token);
    // const isBlacklisted = await BlacklistToken.findOne({ token : token});
    // console.log(isBlacklisted); //  null
    let isBlacklisted = false;
    allBlacklistedTokens.forEach((blacklistedToken) => {
      // console.log(blacklistedToken.token === token ," blaclisted token");
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
    // console.log(decodedData);
    // let college = await College.findById(decodedData.id);
    let user = await College.findById(decodedData.id);
    // console.log(user, "college");
    if (!user) {
      return next(
        new ErrorHander(
          "User not found with this token. Please login again",
          404
        )
      );
    }
    // if (user.loginActivity.length > 0) {
    //   for (const login of user.loginActivity) {
    //     if (login.token_deleted === true) {
    //       await BlacklistToken.create({ token });
    //       break;
    //     }
    //   }
    // }
    // console.log(user);
    // if (user.authType === "qr" && user.qrVerify === false) {
    //   console.log
    //   // throw new Error('This is an error message');
    // } else {
    //   req.user = user;
    //   next();
    // }
    req.user = user;
    next();
  });
};
// Usage
exports.isAuthenticatedStudent = isAuthenticatedUser(Student);
exports.isAuthenticatedCollege = isAuthenticatedUser(College);
exports.isAuthenticatedCompany = isAuthenticatedUser(Company);

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
