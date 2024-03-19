// const ErrorHander = require("../utils/errorhandler");
// const catchAsyncErrors = require("./catchAsyncErrors");
// const jwt = require("jsonwebtoken");
// const College = require("../models/college/collegeModel");
// const Company = require("../models/company/companyModel");
// const{ Student} = require("../models/student/studentModel");
// const BlacklistToken = require("../models/college/blacklistToken");

// const isAuthenticatedUser = (model) => {
//   return catchAsyncErrors(async (req, res, next) => {
//     const token  = req.header("auth-token");

//     // console.log(token)


//     if (!token) {
//       return next(new ErrorHander("Please Login to access this resource", 401));
//     }


//     const isBlacklisted = await BlacklistToken.findOne({ token
//     });

//     if (isBlacklisted) {
//       return next(new ErrorHander("Token is blacklisted. Please login again", 401));
//     }
//     else{
//       // console.log('Token is not blacklisted')
//       const decodedData = jwt.verify(token, process.env.JWT_SECRET);
//        let user = await model.findById(decodedData.id);

//     // if (!user) {
//     //   return next(new ErrorHander("User not found with this token. Please login again", 404));
//     // }
//    // if(login.token_deleted==true){
//     //  const blacklist_token = Blacklist.create({
//     //    token:token
//     //  });

//   //  req.user = user;

//     if(user.loginActivity.length > 0){
//       let tokenExists = false;
//       user.loginActivity.forEach((login) => {
//         //if (login.token_id === decodedData.token_id) {
//        //   tokenExists = true;
//         //}
//         if(login.token_deleted==true){
//           const blacklist_token = BlacklistToken.create({
//           token:token
//         });


//         }

//       });
      
//       req.user = user;
//       }


//     }
  
  

//     // req.user = user;
//     // req.user = await model.findById('65d851843523422df95ab98b');
//     // console.log(req.user)

//     next();
//   });
// };

// // Usage
// exports.isAuthenticatedStudent = isAuthenticatedUser(Student);
// exports.isAuthenticatedCollege = isAuthenticatedUser(College);
// exports.isAuthenticatedCompany = isAuthenticatedUser(Company);



// exports.authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return next(
//         new ErrorHander(
//           `Role: ${req.user.role} is not allowed to access this resouce `,
//           403
//         )
//       );
//     }

//     next();
//   };
// };

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
      return next(new ErrorHander("Token is blacklisted. Please login again", 401));
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    let user = await model.findById(decodedData.id);

    if (!user) {
      return next(new ErrorHander("User not found with this token. Please login again", 404));
    }

    // if (user.loginActivity.length > 0) {
    //   for (const login of user.loginActivity) {
    //     if (login.token_deleted === true) {
    //       await BlacklistToken.create({ token });
    //       break;
    //     }
    //   }
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

