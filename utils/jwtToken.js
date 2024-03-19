// // Create Token and saving in cookie

// const College = require("../models/college/collegeModel");
// const BlacklistToken = require("../models/college/blacklistToken");

// // const sendToken = (user, statusCode, res) => {
// //   const token = user.getJWTToken();

// //   // options for cookie
// //   const options = {
// //     expires: new Date(
// //       Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
// //     ),
// //     httpOnly: true,
// //     SameSite: "None",
// //   };

// //   res.status(statusCode).json({
// //     success: true,
// //     user,
// //     token,
// //   });
// // };

// // module.exports = sendToken;
// const sendToken =async (user, statusCode, res, ip, device) => {
//   const token = user.getJWTToken();

//   // Options for cookie
//   const options = {
//     expires: new Date(
//       Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//     sameSite: "None",
//     // Add other cookie options if needed
//   };

//   // Set cookie with the token
//   res.cookie('token', token, options);

//   const clg = await College.findById(user._id);

// if(clg.loginActivity.length > 0){
//   let tokenExists = false;
//   clg.loginActivity.forEach((login) => {
//     if (login.token_id === token) {
//       tokenExists = true;
//       login.logged_in_at = Date.now();
//       login.token_deleted = false;

//     }
//   });

//   if (!tokenExists) {
//     clg.loginActivity.push({
//       ip,
//       logged_in_at: Date.now(),
//       device,
//       token_id: token,
//       token_secret: process.env.JWT_SECRET,
//       token_deleted: false,
//     });
//   }
// }




//   await College.findByIdAndUpdate(
//     user._id,
//     {
//       loginActivity: clg.loginActivity,
//     },
//     {
//       new: true,
//       runValidators: true,
//       useFindAndModify: false,
//     }
//   );
// const blacklist_token =await BlacklistToken.deleteOne({
//   token: token
// });


// // Send response with token, user information, IP address, and device
// res.status(statusCode).json({
//   success: true,
//   user,
//   token,
//   ip,
//   device,
// });
// };

// module.exports = sendToken;



// sendToken function
const College = require("../models/college/collegeModel");
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

  // // Update the login activity to mark the token as not deleted
  // if (user.loginActivity.length > 0) {
  //   let tokenExists = false;
  //   for (let i = 0; i < user.loginActivity.length; i++) {
  //     console.log(user.loginActivity[i].token_id === token);
  //     if (user.loginActivity[i].token_id === token) {
  //       tokenExists = true;
  //       user.loginActivity[i].token_deleted = false;
  //       user.loginActivity[i].logged_in_at = Date.now();

  //       // console.log(user.loginActivity[i])

  //       break;
  //     }
  //   }

  //   // If token does not exist in login activity, add it
  //   if (!tokenExists) {
  //     console.log('Token does not exist');
  //     user.loginActivity.push({
  //       ip,
  //       logged_in_at: Date.now(),
  //       device,
  //       token_id: token,
  //       // token_secret: process.env.JWT_SECRET,
  //       token_deleted: false,
  //     });
  //     // console.log(user.loginActivity)
  //   }
  // } else {
  //   console.log('Token does not exist');
  //   user.loginActivity.push({
  //     ip,
  //     logged_in_at: Date.now(),
  //     device,
  //     token_id: token,
  //     // token_secret: process.env.JWT_SECRET,
  //     token_deleted: false,
  //   });
  // }

  // Check if login activity already contains the token
// const existingLogin = user.loginActivity.find(activity => activity.token_id === token);
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
  await College.findByIdAndUpdate(
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




