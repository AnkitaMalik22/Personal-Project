const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const College = require("../models/college/collegeModel");
const Company = require("../models/company/companyModel");
const{ Student} = require("../models/student/studentModel");

const isAuthenticatedUser = (model) => {
  return catchAsyncErrors(async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
      return next(new ErrorHander("Please Login to access this resource", 401));
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await model.findById(decodedData.id);

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