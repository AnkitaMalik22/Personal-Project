const ErrorHandler = require("../../utils/errorhandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const { Student } = require("../../models/student/studentModel");
const College = require("../../models/college/collegeModel");
const sendToken = require("../../utils/jwtToken");
const sendEmail = require("../../utils/sendEmail");
const crypto = require("crypto");

const Company = require("../../models/company/companyModel");
const Credit = require("../../models/college/account/creditModel");

const Job = require("../../models/company/jobModel");
const Invitation = require("../../models/student/inviteModel");
const UploadedStudents = require("../../models/student/uploadedStudents");
const BlacklistToken = require("../../models/college/blacklistToken");
const cloudinary = require("cloudinary");
const axios = require("axios");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

const { Vonage } = require("@vonage/server-sdk");
const { SMS } = require("@vonage/messages");

const Qr = require("../../models/college/qr/qr");
const PaymentPlan = require("../../models/college/account/planModel");
const CollegeAssessInv = require("../../models/student/assessmentInvitation");
const InvitedStudents = require("../../models/college/student/Invited");
const ApprovedStudents = require("../../models/college/student/Approved");
const studentResponse = require("../../models/student/studentResponse");
const Assessments = require("../../models/college/assessment/assessments");
const University = require("../../models/university/universityModel");

// Import the Student model

// ================================================================================================================================
// ================================================== 2FA AUTHENTICATION ===========================================================

exports.checkExampleOtp = catchAsyncErrors(async (req, res, next) => {
  const encodedParams = new URLSearchParams();
  encodedParams.set("sms", "+9");
  encodedParams.set("message", "Your OTP is 1234");
  encodedParams.set("senderid", "SkillAssess");
  encodedParams.set("schedule", "1377959755");
  encodedParams.set("return", "http://yourwebsite.com");
  encodedParams.set("key", "1B490066-EA03-E39A-A18C-C4868E45CFAE");
  encodedParams.set("username", "temp-idk-test-dynamic");

  const options = {
    method: "POST",
    url: "https://inteltech.p.rapidapi.com/send.php",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "X-RapidAPI-Key": "37b805b04a77mshdb64f9f6p1f365djsn0000bc54206a",
      "X-RapidAPI-Host": "intelteapidapi.com",
    },
    data: encodedParams,
  };

  try {
    const response = await axios.request(options);
    // console.log(response.data);
    return res.status(200).json({
      success: true,
      message: response.data,
    });
  } catch (error) {
    console.error(error);
  }
});

exports.sendOtp = catchAsyncErrors(async (req, res, next) => {
  const college = await College.findById(req.user.id);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  college.otp = otp;
  college.otpExpire = Date.now() + 5 * 60 * 1000;

  const TO_NUMBER = `91${college.Phone}`; // `91${college.Phone}` for India
  // const FROM_NUMBER = process.env.VONAGE_FROM_NUMBER;

  await college.save({ validateBeforeSave: false });

  const message = `Your OTP is: ${otp} for SkillAccess.Verification code is valid for 5 minutes.`;

  try {
    const vonage = new Vonage({
      apiKey: process.env.VONAGE_API_KEY,
      apiSecret: process.env.VONAGE_API_SECRET,
    });

    // vonage.messages.send(
    //   new SMS(
    //     `Hello ${college.FirstName} ${college.LastName} ,${message}`,
    //     TO_NUMBER,
    //     FROM_NUMBER,
    //   ),
    // )
    //   .then(resp =>  {return  res.status(200).json({
    //     success: true,
    //     message: `OTP sent to ${college.Email} successfully via SMS. messageUUID: ${resp.messageUUID}`,
    //   })  }
    //   )
    //   .catch(err => console.error(err));
    const from = "Vonage APIs";
    const to = TO_NUMBER;
    const text = `Hello ${college.FirstName} ${college.LastName} ,${message}`;

    async function sendSMS() {
      await vonage.sms
        .send({ to, from, text })
        .then((resp) => {
          console.log("Message sent successfully");
          // console.log(resp);
        })
        .catch((err) => {
          console.log("There was an error sending the messages.");
          console.error(err);
        });
    }

    sendSMS();

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${college.Phone} successfully via SMS.`,
    });
  } catch (error) {
    college.otp = undefined;
    college.otpExpire = undefined;

    await college.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// ================================================================================================================================
// ================================================== VERIFY OTP ===========================================================

exports.verifyOtp = catchAsyncErrors(async (req, res, next) => {
  const college = await College.findById(req.user.id);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  const { otp } = req.body;

  if (!otp) {
    return next(new ErrorHandler("Please enter OTP", 400));
  }

  if (otp !== college.otp) {
    return next(new ErrorHandler("OTP is incorrect", 400));
  }

  // if (college.otpExpire < Date.now()) {
  //   return next(new ErrorHandler("OTP is expired. Please request a new one", 400));
  // }

  college.otpVerified = true;
  college.otp = undefined;
  college.otpExpire = undefined;

  await college.save({ validateBeforeSave: false });

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully",
  });
});

// ================================================================================================================================
//  SIDD
exports.generateQr = async (req, res, next) => {
  try {
    let secret = speakeasy.generateSecret({
      name: `Skillaccess: ${req.user.FirstName}`,
    });
    // console.log(secret);
    const user = await College.findById(req.params.id);
    if (!user) return res.status(404).send("College not found");
    const qr = await Qr.findOne({ user: req.params.id });

    if (!qr) {
      function generateQRCodeDataURL(secret) {
        return new Promise((resolve, reject) => {
          qrcode.toDataURL(secret.otpauth_url, (err, data) => {
            if (err) {
              reject(err); // Reject promise with error if qrcode.toDataURL encounters an error
            } else {
              resolve(data); // Resolve promise with data URL if qrcode.toDataURL is successful
            }
          });
        });
      }
      const code = await generateQRCodeDataURL(secret);
      // console.log(code);

      if (!code) {
        return res.status(401).send("could not get code");
      }
      await Qr.create({
        user: user._id,
        code: code,
        secret: secret,
      });
      return res.status(200).json({ success: true, qr: code, secret: secret });
    } else {
      return res
        .status(200)
        .json({ success: true, qr: qr.code, secret: qr.secret });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.verifyQr = catchAsyncErrors(async (req, res, next) => {
  const token = req.header("auth-token");

  const college = await College.findById(req.user.id);
  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }
  const qr = await Qr.findOne({ user: college._id });

  let verified = speakeasy.totp.verify({
    secret: qr.secret.ascii,
    encoding: "ascii",
    token: parseInt(req.body.token),
  });
  // console.log(parseInt(req.body.token));
  // console.log(req.body.secret);
  // college.qrVerify = true;

  college.loginActivity.forEach((login) => {
    console.log(login.token_id === token);
    if (login.token_id === token) {
      login.qrVerify = true;
    }
  });
  await college.save({ validateBeforeSave: false });

  if (verified) return res.status(200).json({ verified: verified, college });
  return res.status(400).json({ verified: verified, college });
});
// =================================================== selectAuth===========================================================
exports.selectAuth = catchAsyncErrors(async (req, res, next) => {
  const college = await College.findById(req.user.id);
  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }
  college.authType = req.body.type;
  if (req.body.type === "qr") {
    college.qrVerify = true;
  }
  await college.save({ validateBeforeSave: false });
  return res.status(200).json({ college });
});
// =================================================== REGISTER COLLEGE ===========================================================

exports.registerCollege = catchAsyncErrors(async (req, res, next) => {
  console.log("register college");
  if (req.body.googleAccessToken) {
    console.log("googleAccessToken");
    try {
      const { googleAccessToken, ip } = req.body;

      const response = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
          },
        }
      );

      const {
        given_name: FirstName,
        family_name: LastName,
        email: Email,
        picture: profilePicture,
      } = response.data;

      const myCloud = await cloudinary.v2.uploader.upload(profilePicture, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });

      const avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };

      const existingUser = await College.findOne({ Email });
      const mailUsed = await Student.findOne({ Email });

      if (existingUser || mailUsed) {
        return res
          .status(400)
          .json({ message: "User already registered with this email" });
      }
      // const ip =  (req.headers['x-forwarded-for'] || '')
      // .split(',').pop().trim() ||
      // req.connection.remoteAddress||
      // req.socket.remoteAddress ||
      // req.connection.socket.remoteAddress;

      const device = req.headers["user-agent"];

      const college = await College.create({
        FirstName,
        LastName,
        Email,
        avatar,
        CollegeName: `${FirstName} ${LastName}`,
      });

      // var ip = (req.headers['x-forwarded-for'] || '')
      // .split(',').pop().trim() ||
      // req.connection.remoteAddress||
      // req.socket.remoteAddress ||
      // req.connection.socket.remoteAddress;

      sendToken(college, 200, res, ip, device);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    const { Email, FirstName, LastName, Password, Phone, CollegeName, ip } =
      req.body;

    // Check if required fields are present
    if (
      !Email ||
      !FirstName ||
      !LastName ||
      !Password ||
      !Phone ||
      !CollegeName
    ) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }

    // it should contain atleast one uppercase, one lowercase, one number and one special character
    const passwordRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"
    );
    if (!passwordRegex.test(Password)) {
      return next(
        new ErrorHandler(
          "Password should contain atleast one uppercase, one lowercase, one number and one special character",
          400
        )
      );
    }

    const avatar = {
      public_id: "avatars/wy3fbtukb75frndzgnxx",
      url: "https://res.cloudinary.com/dkqgktzny/image/upload/v1708338934/avatars/wy3fbtukb75frndzgnxx.png",
    };

    // const ip =  (req.headers['x-forwarded-for'] || '')
    // .split(',').pop().trim() ||
    // req.connection.remoteAddress||
    // req.socket.remoteAddress ||
    // req.connection.socket.remoteAddress;
    // console.log("ip = ", ip);
    // console.log("req ip = ",req.ip)
    const device = req.headers["user-agent"];
    // console.log(device);

    // Create a new college
    const college = await College.create({
      ...req.body,
      avatar,
    });

    // Log college details
    // console.log(college);

    // Send JWT token in response
    sendToken(college, 201, res, ip, device);
  }
});

// =================================================== LOGIN COLLEGE ===========================================================
// Login College
exports.loginCollege = catchAsyncErrors(async (req, res, next) => {
  if (req.body.googleAccessToken) {
    const { googleAccessToken, ip } = req.body;

    axios
      .get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
        },
      })
      .then(async (response) => {
        const Email = response.data.email;

        const college = await College.findOne({ Email });

        if (!college)
          return res.status(404).json({ message: "User don't exist!" });

        // const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        // console.log(ip);
        const device = req.headers["user-agent"];
        // console.log(device);

        sendToken(college, 200, res, ip, device);
      })

      .catch((err) => {
        res.status(400).json({ message: "Invalid access token!" });
      });
  } else {
    const { Email, Password, ip } = req.body;

    // Check if email and password are provided
    if (!Email || !Password) {
      return next(new ErrorHandler("Please Enter Email & Password", 400));
    }

    // if (Password !== confirmPassword) {
    //   return next(new ErrorHandler("Passwords do not match", 400));
    // }

    // Find college by email
    const college = await College.findOne({ Email }).select("+Password");

    // Check if college exists
    if (!college) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    // Check if password is correct
    const isPasswordMatched = await college.comparePassword(Password);

    // If password is incorrect, send an error response
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    // const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // console.log(ip);
    const device = req.headers["user-agent"];
    // console.log(device);

    // Send JWT token in response
    sendToken(college, 200, res, ip, device);
  }
});

// =================================================== ALL LOGGED IN USERS -- SAME USERID  ===========================================================

exports.getAllLoggedInUsers = catchAsyncErrors(async (req, res, next) => {
  const college = await College.findById(req.user.id);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  const loggedInUsers = college.loginActivity;

  res.status(200).json({
    success: true,
    loggedInUsers,
  });
});

// logout a user

exports.logoutAUser = catchAsyncErrors(async (req, res, next) => {
  // console.log("req.user.id", req.user.id);
  const college = await College.findById(req.user.id);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  const token = req.params.token;

  college.loginActivity.forEach((login) => {
    // console.log(login.token_id === token);
    if (login.token_id === token) {
      login.qrVerify = false;
      login.token_deleted = true;
    }
  });
  college.qrVerify = false;

  const blacklist_token = await BlacklistToken.create({
    token: token,
  });

  // console.log("Token blacklisted", blacklist_token);

  await college.save({ validateBeforeSave: false });
  const loggedInUsers = college.loginActivity;

  res.status(200).json({
    success: true,
    message: "Logged Out",
    loggedInUsers,
  });
});

// ===================================================   REMOVE LOGGEDOUT USERS ===========================================================

exports.removeLoggedOutUsers = catchAsyncErrors(async (req, res, next) => {
  const college = await College.findById(req.user.id);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  const token = req.params.token;

  // college.loginActivity = college.loginActivity.filter((login) => login.token_deleted === false);
  college.loginActivity = college.loginActivity.filter(
    (login) => login.token_id !== token
  );

  await college.save({ validateBeforeSave: false });

  const loggedInUsers = college.loginActivity;

  res.status(200).json({
    success: true,
    loggedInUsers,
  });
});

// ====================================================== LOGOUT COLLEGE ===========================================================
// Logout College
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  const college = await College.findById(req.user.id);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  const token = req.header("auth-token");

  college.loginActivity.forEach((login) => {
    // console.log(login.token_id === token, login.token_id, token);
    if (login.token_id === token) {
      login.qrVerify = false;
      login.token_deleted = true;
    }
  });
  college.qrVerify = false;
  // console.log(college.loginActivity);

  await college.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// ==================================================== GET COLLEGE PROFILE ===========================================================
// Get College Details
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  try {

    const {role,id} = req.user
    let entity ;

    if(role==="college"){
      entity = await College.findById(id);
    }else{
      entity = await University.findById(id);
    }
    

    let credit = await PaymentPlan.find(
      { members: { $in: [entity._id] } },
      { members: 0 }
    );
    const balance = await Credit.findOne({
      [role]: id,
    });

    // console.log(entity, "entity");
    return res.status(200).json({
      success: true,
      [role]:entity,
      user:entity,
      credit,
      balance,
    });
  } catch (error) {
    // console.log(error, "error");
    next(error);
  }
});

// ====================================================== FORGOT PASSWORD ===========================================================
const getRole = async ({ value, type }) => {
  const query =
    type === "email"
      ? { Email: value }
      : {
          resetPasswordToken: value.resetPasswordToken,
          resetPasswordExpire: { $gt: Date.now() },
        };

  if (await College.findOne(query)) return "college";
  if (await University.findOne(type === "email" ? { email: value } : query)) return "university";
  if (await Company.findOne(query)) return "company";

  return null;
};

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const role = await getRole({ value: req.body.email, type: "email" });
  if (!role) {
    return next(new ErrorHandler("Entity not found", 404));
  }

  const model = role === "college" ? College : role === "university" ? University : Company;
  const query = role === "college" ? { Email: req.body.email } : { email: req.body.email };
  const entity = await model.findOne(query);

  if (!entity) {
    return next(new ErrorHandler(`${role.charAt(0).toUpperCase() + role.slice(1)} not found`, 404));
  }

  const resetToken = entity.getResetPasswordToken();
  await entity.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const message = `Your password reset token is:\n\n${resetPasswordUrl}\n\nIf you have not requested this email, please ignore it.`;

  try {
    await sendEmail({
      email: role === "college" ? entity.Email : entity.email,
      subject: `${role.charAt(0).toUpperCase() + role.slice(1)} Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${
        role === "college" ? entity.Email : entity.email
      } successfully`,
    });
  } catch (error) {
    entity.resetPasswordToken = undefined;
    entity.resetPasswordExpire = undefined;
    await entity.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const role = await getRole({
    value: { resetPasswordToken },
    type: "token",
  });

  if (!role) {
    return next(new ErrorHandler("Reset Password Token is invalid or has expired", 400));
  }

  const model = role === "college" ? College : role === "university" ? University : Company;
  const user = await model.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Reset Password Token is invalid or has expired", 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
  if (!passwordRegex.test(req.body.password)) {
    return next(
      new ErrorHandler(
        "Password should contain at least one uppercase, one lowercase, one number, and one special character",
        400
      )
    );
  }

  // Set the new password
  if (role === "college" || role === "company") {
    user.Password = req.body.password;
  } else if (role === "university") {
    user.password = req.body.password;
  }

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res, req.body.ip, req.headers["user-agent"]);
});

// ========================================= UPDATE COLLEGE PASSWORD ===========================================================
// Update College Password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  console.log(req.body, "update password body");
  const college = await College.findById(req.user.id).select("+Password");

  // Check if old password is correct
  const isPasswordMatched = await college.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  if (req.body.oldPassword === req.body.newPassword) {
    return next(
      new ErrorHandler("New password cannot be the same as old password", 400)
    );
  }

  // Check if new passwords match
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }
  // it should contain atleast one uppercase, one lowercase, one number and one special character
  const passwordRegex = new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"
  );
  if (!passwordRegex.test(req.body.newPassword)) {
    return next(
      new ErrorHandler(
        "Password should contain atleast one uppercase, one lowercase, one number and one special character",
        400
      )
    );
  }

  // Update college password
  college.Password = req.body.newPassword;

  await college.save();

  const ip = req.body.ip;
  console.log(ip);
  const device = req.headers["user-agent"];
  console.log(device);

  // Send JWT token in response
  sendToken(college, 200, res, ip, device);
});

// ================================================ UPDATE COLLEGE PROFILE ===========================================================
// Update College Profile

exports.updateProfile = catchAsyncErrors(async (req, res) => {
  const { role, id } = req.user;
  const model = role === "college" ? College : University;
  const newUserData = req.body;
  const data = role  === "college" ? {
    CollegeName: newUserData.CollegeName,
    Phone: newUserData.Phone,
    Website: newUserData.Website,
    Address: newUserData.Address,
    Description: newUserData.Description,
    avatar: newUserData.avatar,
  } : {
    name : newUserData.name,
    phone: newUserData.phone,
    address: newUserData.address,
    website: newUserData.website,
    description: newUserData.description,
    
  }
  // Update user profile
  const updatedUser = await model.findByIdAndUpdate(
    id,
    { ...data },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  res.status(200).json({
    success: true,
    user: updatedUser,
    college: updatedUser,
  });
  console.log("Response sent successfully");
});

// -------------------
// exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
//   // Upload new avatar to Cloudinary
//   const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//     folder: "avatars",
//     width: 150,
//     crop: "scale",
//   });

//   // Remove the avatar from req.body and store the remaining fields
//   const { avatar, ...rest } = req.body;

//   try {
//     // Update college profile with new avatar
//     const updatedCollege = await College.findByIdAndUpdate(
//       req.user.id,
//       {
//         // Spread the remaining fields from req.body
//         ...rest,
//         // Set avatar to the new uploaded avatar
//         avatar: {
//           public_id: myCloud.public_id,
//           url: myCloud.secure_url,
//         },
//       },
//       {
//         new: true,
//         runValidators: true,
//         useFindAndModify: false,
//       }
//     );

//     console.log(...rest, avatar);
//     res.status(200).json({
//       success: true,
//       college: updatedCollege,
//     });
//   } catch (error) {
//     console.log(error)
//     return next(new ErrorHandler(error.message, 500));
//   }
// });

// --------------------------

// ================================================ Update Profile Picture ===========================================================

exports.updateProfilePictureCollege = catchAsyncErrors(async (req, res) => {
  const role = req.user.role;
  const model = role === "college" ? College : University;

  const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });

  const updatedUser = await model.findByIdAndUpdate(
    req.user.id,
    {
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    user: updatedUser,
    avatar: updatedUser.avatar,
  });
});

// ===============================================================================================================

//------------------------ Upload Students----------------------------
//method : POST
//for adding students from students module
//takes an array of students and sends and ivitation mail to them

function generateInvitationEmail({ Email, FirstName, LastName, CollegeId, link }) {

  const URL = process.env.STUDENT_URL || "https://student.skillaccess.in"
  const registerLink = `${URL}/student?inviteLink=${link}&CollegeId=${CollegeId}&Email=${Email}&FirstName=${FirstName}&LastName=${LastName}`
  return {
    email: Email,
    subject: "Invitation to join Skill Access",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Skill Access</title>
    <style>
        :root {
            --primary-color: #6eb9be;
            --primary-dark: #0D9AAC;
            --text-color: #333;
            --background-color: #F1F4F8;
            --container-bg: #ffffff;
            --border-color: #e0e0e0;
        }

        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--background-color);
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 40px;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            background-color: var(--container-bg);
        }

        .logo {
            display: block;
            width: 120px;
            margin: 0 auto 30px;
        }

        .header {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: var(--primary-dark);
        }

        h3 {
            color: var(--primary-dark);
            margin-top: 30px;
        }

        .button {
            display: inline-block;
            margin: 20px 0;
            padding: 12px 24px;
            color: white;
            background-color: var(--primary-color);
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
            font-size: 14px;
            color: #555;
        }

        ul {
            padding-left: 20px;
        }

        li {
            margin-bottom: 10px;
        }

        @media (max-width: 768px) {
            .container {
                padding: 20px;
                margin: 20px auto;
            }
            
            .logo {
                width: 100px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <img class="logo" src="https://res.cloudinary.com/dic0ukpeu/image/upload/v1734001129/logoFinal_tldpct.png" alt="Skill Access Logo">
        
        <div class="header">Hello ${FirstName},</div>
  
        <p>Thank you for joining Skill Access. To get started, please complete your profile:</p>
        
        <h3>Complete Your Profile</h3>

        <p>Use the link below to register and fill out your profile:</p>

        <a href="${registerLink}" class="button">Complete Profile</a>
        
        <p>If the button doesn't work, copy and paste this link into your browser: ${registerLink}</p>

        <p>Your profile must be complete to access tests. You'll know it's done when you no longer see the "Complete Your Profile" message on your dashboard.</p>
  
        <h3>Important Notes:</h3>
        <ul>
            <li>Provide accurate information to avoid delays.</li>
            <li>You'll be notified when tests are available after your profile is complete.</li>
        </ul>
  
        <p>If you need any help, our support team is here for you.</p>
  
        <div class="footer">
            Best regards,<br>
            Skill Access Team
        </div>
    </div>
</body>
</html>

`

  };
}


exports.uploadStudents = catchAsyncErrors(async (req, res, next) => {
  const { students } = req.body;

  const Invitations = [];

  const userId = req.user.id;
  const entity = req.user.role;

  const college = await College.findById(userId);


  let invited;
  if (req.user.role === "university") {

  }
  //create invitation bucket if not exists
  invited = await InvitedStudents.findOneAndUpdate(
    {
      [entity]: userId,
    },
    {
      $set: { [entity]: userId },
    },
    {
      upsert: true,
      new: true,
    }
  );

  if (!college && entity === "college") {
    return next(new ErrorHandler("College not found", 404));
  }

  const allDuplicateEmails = [];

  for (let i = 0; i < students.length; i++) {
    const { FirstName, LastName, Email, Batch } = students[i];
    // const student = await UploadedStudents.create({
    //   college_id: userId,
    //   FirstName,
    //   LastName,
    //   Email,
    // });

    // const student = await Invitation.findOne({
    //   recipientEmail: Email,
    // });
    let student = false;

    if (invited.students) {
      student = invited.students.some((student) => student.Email === Email);
    }

    const isRegisteredEmail = await Student.findOne(
      { Email: Email },
    );

    const link = crypto.randomBytes(20).toString("hex");
    // const curr = await Student.findOne({ Email: Email });
    if (!isRegisteredEmail) {
      if (!student) {
        invited.students.push({
          Email: Email,
          link: link,
          FirstName: FirstName,
          LastName: LastName,
          batch: Batch
          // student: stu._id,
        });

        const mail = await sendEmail(generateInvitationEmail({
          Email: Email,
          link: link,
          FirstName: FirstName,
          LastName: LastName,
          CollegeId: userId
        }));
        console.log(mail,"mail")
        Invitations.push(mail);
        await invited.save();
      } else {
        invited.students.forEach((student, i) => {
          if (student.Email === Email) {
            invited.students[i].link = link;
          }
        });


        const mail = await sendEmail(generateInvitationEmail({
          Email: Email,
          link: link,
          FirstName: FirstName,
          LastName: LastName,
          CollegeId: userId
        }));
        Invitations.push(mail);
        await invited.save();
      }
    } else {
      allDuplicateEmails.push(Email);
    }
  }



  const uploadedStudents = await InvitedStudents.findOne({
    college: userId,
  });
  console.log(uploadedStudents, "uploaded students");

  res.status(200).json({
    success: true,
    allDuplicateEmails,
    uploadedStudents: uploadedStudents?.students,
    message: "Students uploaded & Invited successfully",
    Invitations
  });


  // college.uploadedStudents = students;
  // await college.save();
});

// ------------------------------get uploaded students-----------------------------
exports.getUploadedStudents = catchAsyncErrors(async (req, res) => {
  const college = await College.findById(req.user.id);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  console.log(req.user.id);
  const students = await UploadedStudents.find({ college_id: req.user.id });

  res.status(200).json({
    success: true,
    uploadedStudents: students,
  });
});

// -------------------------- // INVITE STUDENTS------------------------------

// pending students

exports.getPendingStudents = catchAsyncErrors(async (req, res, next) => {
  const college = await College.findById(req.user.id);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  const pending = [];
  for (let i = 0; i < college.pendingStudents.length; i++) {
    const student = await Student.findById(college.pendingStudents[i]);
    pending.push(student);
  }

  // const pendingStudents = await College.findById(req.user.id).select("pendingStudents").populate({
  //   path: "pendingStudents",
  // });
  console.log(pending);

  res.status(200).json({
    success: true,
    pendingStudents: pending,
  });
});

// approve students
//in use
exports.approveStudents = catchAsyncErrors(async (req, res, next) => {
  try {
    // console.log(req.body, "approve students");
    const { studentId } = req.body;
    const userId = req.user.id;
    let entity;

    if(req.user.role==="college"){
      entity = await College.findById(userId);
    }else{
      entity = await University.findById(userId);
    }

    if (!entity) {
      return next(new ErrorHandler(`${entity} not found`, 404));
    }

    const student = await Student.findById(studentId.studentId);

    // for (let i = 0; i < college.pendingStudents.length; i++) {
    //   const student = await Student.findById(college.pendingStudents[i]);

    //   if (students.includes(student.id)) {
    //     student.college = userId;
    //     await student.save();
    //   }
    // }

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    student.approved = true;
    await student.save();

    let sId = studentId.studentId;

    const approvedStudents = await ApprovedStudents.findOne({
      [entity.role]: userId,
    });
    if (approvedStudents) {
      if (!approvedStudents.students.includes(sId)) {
        await ApprovedStudents.findOneAndUpdate(
          { [entity.role]: userId },
          {
            $push: { students: sId },
            $set: { userId: userId },
          },
          { new: true, upsert: true }
        );
      }
    } else {
      await ApprovedStudents.create({ [entity.role]: userId, students: [sId] });
    }

    // const approvedStudents = await ApprovedStudents.findOneAndUpdate(
    //   { [entity]: userId, "students.studentId": { $ne: studentId } }, // Check for duplicates before pushing
    //   {
    //     $addToSet: { students: { studentId } }, // Use $addToSet to avoid duplicates
    //     $set: { userId: userId },
    //   },
    //   { new: true, upsert: true }
    // );
    await InvitedStudents.findOneAndUpdate(
      { [entity.role]: userId },
      {
        $pull: { students: { student: sId } },
      }
    );
    await UploadedStudents.findOneAndUpdate(
      { [entity.role]: userId },
      {
        $pull: { students: sId },
      }
    );

    // college.pendingStudents = college.pendingStudents.filter(
    //   (id) => id.toString() !== studentId.studentId
    // );
    // console.log(college.pendingStudents);

    // college.students = college.students.concat(student);

    // console.log(college.students);
    // await college.save();

    res.status(200).json({
      success: true,
      message: "Students approved successfully",
    });
  } catch (error) {
    console.log(error);
  }
});

// reject student

exports.rejectStudent = catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    await Student.findByIdAndDelete(req.params.studentId);


    let entity;

    if(req.user.role==="college"){
      entity = await College.findById(userId);
    }else{
      entity = await University.findById(userId);
    }

    if (!entity) {
      return next(new ErrorHandler(`${entity} not found`, 404));
    }

    // remove from college approve students

    // college.approveStudents = college.approvedStudents.filter(std => std._id.toString() !== student._id.toString());

    const approvedStudents = await ApprovedStudents.findOne({
      [entity]: req.user.id,
    });
    if (approvedStudents) {
      if (approvedStudents.students.includes(student._id)) {
        approvedStudents.students = approvedStudents.students.filter(
          (std) => std.toString() !== student._id.toString()
        );
      }
    }
    await entity.save();
    await approvedStudents.save();

    const message = `
    Hello ${student.FirstName}, 
    We regret to inform you that your request has been rejected. 
    Please register again using the previous registration link and ensure that you complete your profile accurately.
    `;
    await sendEmail({
      email: student.Email,
      subject: `${entity} Registration Rejection`,
      message,
    });

    return res.status(200).json({
      sucess: "true",
      message: "Student Rejected",
    });
  } catch (error) {
    console.log(error);
  }
});

// ------------------------------get students-----------------------------

exports.getStudents = catchAsyncErrors(async (req, res, next) => {
  try {
    const id = req.user.id;
    const { batch, createdAt, skills, filterType, page, limit = 100 } = req.query;
    let approvedStudents, invitedStudents, pendingStudents;
    let entity = req.user.role;
    // Build the filter object
    let filter = { [entity]: id };

    if (batch) {
      filter["students.batch"] = batch;
    }

    if (createdAt) {
      filter["students.createdAt"] = { $gte: new Date(createdAt) };
    }

    const skip = (page - 1) * limit;

    // completed profile
    if (filterType === 'all students' || filterType === 'pending students') {
      pendingStudents = await UploadedStudents.findOne({
        [entity]: filter[entity]
      })
        .populate({
          path: "students",
          match: {
            $and: [
              batch && batch !== "all" ? { batch: batch } : {},
              createdAt ? { createdAt: { $gte: new Date(createdAt) } } : {},
            ]
          },
          options: {
            skip: skip,
            limit: parseInt(limit),
          }
        });
      console.log("Pending Students:", pendingStudents?.students?.length);
    }
    if (filterType === 'all students' || filterType === 'invited students') {
      invitedStudents = await InvitedStudents.findOne({
        [entity]: filter[entity],
        $and: [
          batch && batch !== "all" ? { batch: batch } : {},
          createdAt ? { createdAt: { $gte: new Date(createdAt) } } : {},
        ]
      })
        .populate({
          path: "students",
          options: {
            skip: skip,
            limit: parseInt(limit),
          }
        });
    }
    if (filterType === 'all students' || filterType === 'approved students') {
      approvedStudents = await ApprovedStudents.findOne({
        [entity]: filter[entity]
      }).populate({
        path: "students",
        match: {
          $and: [
            batch && batch !== "all" ? { batch: batch } : {},
            createdAt ? { createdAt: { $gte: new Date(createdAt) } } : {},
          ]
        },
        options: {
          skip: skip,
          limit: parseInt(limit),
        },
        populate: {
          path: "studentResponses",
          select: ["assessmentId", "batch", "createdAt", "Skills"],
          populate: {
            path: "assessmentId",
            select: "name"
          }
        }
      });
    }

    console.log(approvedStudents,entity);
    res.status(200).json({
      success: true,
      approvedStudents: approvedStudents ? approvedStudents.students : [],
      uploadedStudents: invitedStudents && invitedStudents.students ? invitedStudents.students : [],
      pendingStudents: pendingStudents && pendingStudents.students ? pendingStudents.students : [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// ============================================ dashboard ===========================================================

// getTotalJobs
exports.getTotalJobs = catchAsyncErrors(async (req, res, next) => {
  // const college = await College.findById(req.user.id).populate({
  //   path: "jobs",
  // });
  const id = req.user.id;
  const college = await College.findById(id).populate({
    path: "jobs",
    populate: {
      path: "company", // The field within "jobs" to populate
    },
  });

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  res.status(200).json({
    success: true,
    jobs: college.jobs,

    message: "All jobs fetched successfully",
  });
});

// Corrected getTotalJobs -- commented due to no jobs available

// exports.getTotalJobs = catchAsyncErrors(async (req, res, next) => {
//   try {
//     // Retrieve the college and populate designated companies
//     const college = await College.findById(req.user.id).populate({
//       path: "designatedCompanies",
//       options: { strictPopulate: false }
//     });

//     if (!college) {
//       return next(new ErrorHandler("College not found", 404));
//     }

//     const designatedCompanyIds = college.designatedCompanies.map(company => company._id);

//     const jobs = await Job.find({ company: { $in: designatedCompanyIds } }).populate("company");

//     res.status(200).json({
//       success: true,
//       jobs: jobs,
//       totalJobs: jobs.length,
//     });
//   } catch (error) {
//     console.log(error);
//     return next(new ErrorHandler("An error occurred while fetching the jobs from designated companies", 500));
//   }
// });

// get available assessments

exports.getAvailableAssessments = catchAsyncErrors(async (req, res, next) => {
  const college = await College.findById(req.user.id).populate({
    path: "assessments",
    // match: { Available: true },
  });

  res.status(200).json({
    success: true,
    assessments: college.assessments,
    totalAssessments: college.assessments.length,
  });
});

// get total students

exports.getTotalStudents = catchAsyncErrors(async (req, res, next) => {
  // const college = await College.findById(req.user.id).populate({
  //   path: "students",
  // });
  const students = await Student.find({
    CollegeId: req.user.id,
  });

  res.status(200).json({
    success: true,
    students: college.students,
    totalStudents: college.students.length,
  });
});

// get total companies

exports.getTotalCompanies = catchAsyncErrors(async (req, res, next) => {
  try {
    const college = await College.findById(req.params.collegeId);
    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }
    const filteredJobs = await Job.find({
      tier: college.tier
    }).populate("company");

    // Extract unique companies from the jobs
    const uniqueCompanies = [
      ...new Set(filteredJobs.map((job) => job.company)) // Using Set to ensure uniqueness
    ];


    if (!uniqueCompanies) {
      return next(new ErrorHandler("No designated companies found", 404));
    }

    // Map over the designatedCompanies array
    let designatedCompanies = uniqueCompanies.map((company) => {
      let hiring = false;
      console.log(company.jobs);
      if (company.jobs && company.jobs.length > 0) {
        // set it  based on isOpenForApplications later
        hiring = true;
      }
      return {
        ...company._doc,
        hiring,
        tier: college.tier,
      };
    });

    res.status(200).json({
      success: true,
      companies: designatedCompanies,
    });
  } catch (error) {
    console.log(error);
    return next(
      new ErrorHandler("An error occurred while fetching companies", 500)
    );
  }
});

// get recent companies

exports.getRecentDesignatedCompanies = catchAsyncErrors(
  async (req, res, next) => {
    try {
      // Find the college by user ID and populate the designated companies
      const college = await College.findById(req.params.collegeId).populate({
        path: "designatedCompanies",
        options: { sort: { createdAt: -1 }, limit: 5 }, // Sort by creation date and limit to 5
      });

      if (!college) {
        return next(new ErrorHandler("College not found", 404));
      }

      // Check if there are any designated companies
      if (college.designatedCompanies.length > 0) {
        res.status(200).json({
          success: true,
          companies: college.designatedCompanies,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "No recent designated companies found",
        });
      }
    } catch (error) {
      console.log(error);
      return next(
        new ErrorHandler(
          "An error occurred while fetching recent designated companies",
          500
        )
      );
    }
  }
);

// get Placed Students

exports.getPlacedStudents = catchAsyncErrors(async (req, res, next) => {
  const college = await College.findById(req.user.id).populate({
    path: "students",
    model: Student,
    match: { Placed: true },
  });

  res.status(200).json({
    success: true,
    students: college.students,
    totalPlacedStudents: college.students.length,
  });
});

// =========================================== select student for the assessment ==============================================

//  College Assessment Inv >

exports.selectStudentTest = catchAsyncErrors(async (req, res, next) => {
  //student response id

  const { responseId, testId } = req.params;
  const { status } = req.body;

  const response = await studentResponse.findById(responseId);
  const assessment = await Assessments.findById(testId);

  if (!response) {
    return next(new ErrorHandler("Student response not found", 404));
  }

  response.status = status;

  if (status == "selected") {
    if (!assessment.selectedStudents.includes(responseId)) {
      assessment.selectedStudents.push(responseId);
    }
    // calculate avgSelectedStudents percentage
    if (assessment.avgSelectedPercentage) {
      // if this field exits // check for old tests
      assessment.avgSelectedPercentage =
        (assessment.selectedStudents.length / assessment.totalStudents) * 100;
    }
  } else if (status == "rejected") {
    if (!assessment.rejectedStudents.includes(responseId)) {
      assessment.rejectedStudents.push(responseId);
    }
    if (assessment.avgRejectedPercentage) {
      // if this field exits // check for old tests
      assessment.avgRejectedPercentage =
        (assessment.rejectedStudents.length / assessment.totalStudents) * 100;
    }
  }
// console.log(assessment.selectedStudents)
  await assessment.save();
  await response.save();

  res.status(200).json({
    success: true,
    message: "Student selected/rejected sucessfully",
  });
});

// =========================================== GET ALL SELECTED STUDENTS FOR THE TEST  ===========================================

exports.getSelectedStudents = catchAsyncErrors(async (req, res, next) => {
  const { testId } = req.params;

  const assessment = await Assessments.findById(testId).populate({
    path: "selectedStudents",
    populate: {
      path: "studentId",
      model: "Students",
    },
  });

  if (!assessment) {
    return next(new ErrorHandler("Assessment not found", 404));
  }

  res.status(200).json({
    success: true,
    selectedStudents: assessment.selectedStudents,
  });
});

// =========================================== GET ALL REJECTED STUDENTS FOR THE TEST  ===========================================

exports.getRejectedStudents = catchAsyncErrors(async (req, res, next) => {
  const { testId } = req.params;

  const assessment = await Assessments.findById(testId).populate(
    "rejectedStudents"
  );

  if (!assessment) {
    return next(new ErrorHandler("Assessment not found", 404));
  }

  res.status(200).json({
    success: true,
    rejectedStudents: assessment.rejectedStudents,
  });
});

// =========================================== GET ALL STUDENTS FOR THE TEST  ===========================================

// ALLL ATTEMPTED STUDENTS = studentresponses
// ALL SELECTED STUDENTS = selectedStudents
// ALL REJECTED STUDENTS = rejectedStudents

// student tests => studentResponse

// =========================================== RESULT GRAPHS  ===========================================

// get all students who attempted the test
// get all students who selected the test
// day , week , month , quarter , year

exports.resultOverviewGraph = async (req, res, next) => {
  try {
    const collegeId = req.user.id;

    const assessments = await Assessments.find({ createdBy: collegeId })
      .populate("selectedStudents")
      .populate("rejectedStudents")
      .populate("studentResponses");

    if (!assessments.length) {
      return res
        .status(404)
        .json({ message: "No assessments found for this college" });
    }

    const assessmentIds = assessments.map((assessment) => assessment._id);

    const aggregateData = async (timeUnit) => {
      const format = {
        day: "%Y-%m-%d",
        week: "%Y-%U",
        month: "%Y-%m",
        quarter: {
          $concat: [
            { $substr: [{ $year: "$completedAt" }, 0, 4] },
            "-Q",
            {
              $substr: [
                { $ceil: { $divide: [{ $month: "$completedAt" }, 3] } },
                0,
                1,
              ],
            },
          ],
        },
        year: "%Y",
      }[timeUnit];
      //c
      const groupBy = {
        day: { $dateToString: { format: format, date: "$completedAt" } },
        week: {
          $concat: [
            { $substr: [{ $year: "$completedAt" }, 0, 4] },
            "-",
            {
              $cond: [
                { $lte: [{ $week: "$completedAt" }, 9] },
                { $concat: ["0", { $toString: { $week: "$completedAt" } }] },
                { $toString: { $week: "$completedAt" } },
              ],
            },
          ],
        },
        month: { $dateToString: { format: format, date: "$completedAt" } },
        quarter: {
          $concat: [
            { $substr: [{ $year: "$completedAt" }, 0, 4] },
            "-Q",
            {
              $toString: {
                $ceil: { $divide: [{ $month: "$completedAt" }, 3] },
              },
            },
          ],
        },
        year: { $dateToString: { format: format, date: "$completedAt" } },
      }[timeUnit];

      const result = await studentResponse.aggregate([
        { $match: { assessmentId: { $in: assessmentIds } } },
        {
          $group: {
            _id: groupBy,
            totalStudentsAppeared: { $sum: 1 },
            totalStudentsSelected: {
              $sum: { $cond: [{ $eq: ["$status", "selected"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      return result.map((item) => ({
        time: item._id,
        totalStudentsAppeared: item.totalStudentsAppeared,
        totalStudentsSelected: item.totalStudentsSelected,
      }));
    };

    const data = {
      daily: await aggregateData("day"),
      weekly: await aggregateData("week"),
      monthly: await aggregateData("month"),
      quarterly: await aggregateData("quarter"),
      yearly: await aggregateData("year"),
      assessmentIds: assessmentIds,
    };

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




