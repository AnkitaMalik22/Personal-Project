const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Company = require("../models/company/companyModel");
const College = require("../models/college/collegeModel");
const University = require("../models/university/universityModel");
const { Student } = require("../models/student/studentModel");
const BlacklistToken = require("../models/college/blacklistToken");

exports.authenticateMultiDatabase = catchAsyncErrors(async (req, res, next) => {
  const token = req.header("auth-token");
  try {
    if (token) {
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);
      const role = decodedData.role;
      const id = decodedData.id;

      switch (role) {
        case "college":
          const collegeUser = await College.findById(id);
          if (!collegeUser)
            return next(
              new ErrorHander(
                "Invalid college user token. Please login again",
                401
              )
            );

          req.user = collegeUser;
          req.userType = "college";
          return next();

        case "company":
          const companyUser = await Company.findById(id);
          if (!companyUser) {
            return next(
              new ErrorHander(
                "Invalid company user token. Please login again",
                401
              )
            );
          }
          req.user = companyUser;
          req.userType = "company";
          return next();

        case "university":
          const universityUser = await University.findById(id);
          // console.log("user found--fghnjm")
          // console.log(uniUser);
          if (!universityUser)
            return next(
              new ErrorHander(
                "Invalid university user token. Please login again",
                401
              )
            );

          req.user = universityUser;
          req.userType = "university";
          return next();

        case "student":
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

          const studentUser = await Student.findById(id);
          if (!studentUser)
            return next(
              new ErrorHander(
                "Invalid university user token. Please login again",
                401
              )
            );
          req.user = studentUser;
          req.userType = "student";
          return next();

        default:
          return next(
            new ErrorHander("Invalid token. Please login again", 401)
          );
      }
    } else {
      return next(new ErrorHander("No token found, Please login again", 401));
    }
  } catch (error) {
    console.log(error);
    // Handle token expiration or invalid token
    if (error.name === "TokenExpiredError") {
      return next(
        new ErrorHander("Token has expired. Please login again", 401)
      );
    }
    return next(new ErrorHander("Invalid token. Please login again", 401));
  }
});
