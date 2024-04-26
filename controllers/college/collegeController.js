const ErrorHandler = require("../../utils/errorhandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const { Student } = require("../../models/student/studentModel");
const College = require("../../models/college/collegeModel");
const sendToken = require("../../utils/jwtToken");
const sendEmail = require("../../utils/sendEmail");
const crypto = require("crypto");
const Company = require("../../models/company/companyModel");
const Credit = require("../../models/college/account/creditModel")

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
          console.log(resp);
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
      name: "Skillaccess",
    });
    // console.log(secret);

    qrcode.toDataURL(secret.otpauth_url, function (err, data) {
      return res.status(200).json({ success: true, qr: data, secret: secret });
    });
  } catch (error) {
    console.log(error);
  }
};

exports.verifyQr = catchAsyncErrors(async (req, res, next) => {
  const college = await College.findById(req.user.id);
  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }
  let verified = speakeasy.totp.verify({
    secret: req.body.secret,
    encoding: "ascii",
    token: parseInt(req.body.token),
  });
  // console.log(parseInt(req.body.token));
  // console.log(req.body.secret);
  college.qrVerify = true;
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

      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      // const ip =  (req.headers['x-forwarded-for'] || '')
      // .split(',').pop().trim() ||
      // req.connection.remoteAddress||
      // req.socket.remoteAddress ||
      // req.connection.socket.remoteAddress;
      console.log("ip = ", ip);
      const device = req.headers["user-agent"];
      console.log(device);

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
    console.log("ip = ", ip);
    // console.log("req ip = ",req.ip)
    const device = req.headers["user-agent"];
    console.log(device);

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
        console.log(ip);
        const device = req.headers["user-agent"];
        console.log(device);

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
    console.log(ip);
    const device = req.headers["user-agent"];
    console.log(device);

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
  console.log("req.user.id", req.user.id);
  const college = await College.findById(req.user.id);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  const token = req.params.token;

  college.loginActivity.forEach((login) => {
    console.log(login.token_id === token);
    if (login.token_id === token) {
      login.token_deleted = true;
    }
  });
  college.qrVerify = false;

  const blacklist_token = await BlacklistToken.create({
    token: token,
  });

  console.log("Token blacklisted", blacklist_token);

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
    console.log(login.token_id === token, login.token_id, token);
    if (login.token_id === token) {
      login.token_deleted = true;
    }
  });
  college.qrVerify = false;
  console.log(college.loginActivity);

  await college.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// ==================================================== GET COLLEGE PROFILE ===========================================================
// Get College Details
exports.getCollegeDetails = catchAsyncErrors(async (req, res, next) => {
  try {
    const college = await College.findById(req.user.id);
    let credit = await Credit.findOne({
      college: college,
    });

    return res.status(200).json({
      success: true,
      college,
      credit
    });
  } catch (error) {
    next(error);
  }
});

// ====================================================== FORGOT PASSWORD ===========================================================
// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const college = await College.findOne({ Email: req.body.email });

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = college.getResetPasswordToken();

  await college.save({ validateBeforeSave: false });

  // const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;
  const resetPasswordUrl = `https://skillaccessclient.netlify.app/password/reset/${resetToken}`;

  const message = `Your password reset token is:\n\n${resetPasswordUrl}\n\nIf you have not requested this email, please ignore it.`;

  try {
    // Send password reset email
    await sendEmail({
      email: college.Email,
      subject: `College Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${college.Email} successfully`,
    });
  } catch (error) {
    college.resetPasswordToken = undefined;
    college.resetPasswordExpire = undefined;

    await college.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// ============================================================ RESET PASSWORD ===========================================================
// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  console.log(req.body, "reset password body");

  const ip = req.body.ip;
  console.log(ip);
  const device = req.headers["user-agent"];
  console.log(device);

  // Creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const college = await College.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!college) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  // Check if passwords match
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // it should contain atleast one uppercase, one lowercase, one number and one special character
  const passwordRegex = new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"
  );
  if (!passwordRegex.test(req.body.password)) {
    return next(
      new ErrorHandler(
        "Password should contain atleast one uppercase, one lowercase, one number and one special character",
        400
      )
    );
  }
  // try {
  //   const isSame = await college.comparePassword(req.body.password);
  //   if (isSame) {
  //     return next(new ErrorHandler("Password cannot be same as old password", 400));
  //   }
  // } catch (error) {
  //   console.error("Error comparing passwords:", error);
  //   return next(new ErrorHandler("Error comparing passwords", 500));
  // }

  // Password validation and update code

  college.Password = req.body.password;
  college.resetPasswordToken = undefined;
  college.resetPasswordExpire = undefined;

  await college.save();

  // Send JWT token in response
  sendToken(college, 200, res, ip, device);
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

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newCollegeData = req.body;
  const data = {
    CollegeName: newCollegeData.CollegeName,
    Phone: newCollegeData.Phone,
    Website: newCollegeData.Website,
    Address: newCollegeData.Address,
    Description: newCollegeData.Description,
    avatar: newCollegeData.avatar,
  };
  // Update college profile
  const updatedCollege = await College.findByIdAndUpdate(
    newCollegeData._id,
    { ...data },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  res.status(200).json({
    success: true,
    college: updatedCollege,
  });
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

exports.updateProfilePictureCollege = catchAsyncErrors(
  async (req, res, next) => {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    // const newCollegeData = req.body;

    // console.log(avatar);

    // const college = await College.findByIdAndUpdate(  req.body.id,
    const college = await College.findByIdAndUpdate(
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
    console.log(college);

    res.status(200).json({
      success: true,
      college,
    });
  }
);

// ===============================================================================================================

//------------------------ Upload Students----------------------------

exports.uploadStudents = catchAsyncErrors(async (req, res, next) => {
  const { students } = req.body;
  // console.log(students)

  // console.log ("upload students called" , students , "students")

  const CollegeId = req.user.id;

  const college = await College.findById(CollegeId);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  const allDuplicateEmails = [];

  for (let i = 0; i < students.length; i++) {
    const { FirstName, LastName, Email } = students[i];
    // const student = await UploadedStudents.create({
    //   college_id: CollegeId,
    //   FirstName,
    //   LastName,
    //   Email,
    // });

    const student = await Invitation.findOne({
      recipientEmail: Email,
    });

    if (!student) {
      const invite = await Invitation.create({
        FirstName,
        LastName,
        Email,
        sender: CollegeId,
        recipientEmail: Email,
        invitationLink: crypto.randomBytes(20).toString("hex"),
      });

      // console.log(invite);

      sendEmail({
        email: Email,
        subject: "Invitation to join College",
        message: `Hello ${FirstName}!,You have been invited to join ${college.FirstName} ${college.LastName} college. Please click on the link to register: https://skillaccessclient.netlify.app/student?CollegeId=${CollegeId}&inviteLink=${invite.invitationLink}`,
        // message: `Hello ${student.FirstName}!,You have been invited to join ${college.FirstName} ${college.LastName} college. Please click on the link to register: ${process.env.FRONTEND_URL}/student/register/${invite.invitationLink}`,
      });
    } else {
      allDuplicateEmails.push(Email);
    }
    // student.invited = true;
    // await student.save();
  }

  console.log(allDuplicateEmails);

  if (allDuplicateEmails.length == students.length) {
    console.log("all duplicate emails");
    return res.status(400).json({
      success: false,
      message: "Student already invited",
    });
  } else {
    res.status(200).json({
      success: true,
      message: "Students uploaded & Invited successfully",
    });
  }

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

exports.inviteStudents = catchAsyncErrors(async (req, res, next) => {
  // const { studentId } = req.body;
  // const college = await College.findById(req.user.id);

  // if (!college) {
  //   return next(new ErrorHandler("College not found", 404));
  // }

  // const student = await Student.findById(studentId);

  // if (!student) {
  //   return next(new ErrorHandler("Student not found", 404));
  // }

  // if (student.college) {
  //   return next(new ErrorHandler("Student already registered", 400));
  // }

  // student.college = req.user.id;
  // await student.save();

  // college.students.push(studentId);
  // await college.save();

  // res.status(200).json({
  //   success: true,
  //   message: "Student added successfully",
  // });

  const { students } = req.body;
  const CollegeId = req.user.id;

  const college = await College.findById(CollegeId);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  for (let i = 0; i < students.length; i++) {
    // from uploaded students
    const student = await UploadedStudents.findOne({
      college_id: CollegeId,
      Email: students[i].Email,
    });
    if (student) {
      // console.log(student)
      console.log({ sender: CollegeId, recipientEmail: student.Email });
    } else {
      console.log("Student not found.");
    }

    const invite = await Invitation.create({
      sender: CollegeId,
      recipientEmail: student.Email,
      invitationLink: crypto.randomBytes(20).toString("hex"),
    });

    sendEmail({
      email: student.Email,
      subject: "Invitation to join College",
      message: `Hello ${student.FirstName}!,You have been invited to join ${college.FirstName} ${college.LastName} college. Please click on the link to register: http://localhost:3000/student?CollegeId=${CollegeId}&inviteLink=${invite.invitationLink}`,
      // message: `Hello ${student.FirstName}!,You have been invited to join ${college.FirstName} ${college.LastName} college. Please click on the link to register: ${process.env.FRONTEND_URL}/student/register/${invite.invitationLink}`,
    });

    student.invited = true;
    await student.save();
  }

  res.status(200).json({
    success: true,
    message: "Students invited successfully",
  });
});

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

exports.approveStudents = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log(req.body, "approve students");
    const { studentId } = req.body;
    const CollegeId = req.user.id;

    const college = await College.findById(CollegeId);

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    const student = await Student.findById(studentId.studentId);

    // for (let i = 0; i < college.pendingStudents.length; i++) {
    //   const student = await Student.findById(college.pendingStudents[i]);

    //   if (students.includes(student.id)) {
    //     student.college = CollegeId;
    //     await student.save();
    //   }
    // }

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    college.pendingStudents = college.pendingStudents.filter(
      (id) => id.toString() !== studentId.studentId
    );
    console.log(college.pendingStudents);

    college.students = college.students.concat(student);

    console.log(college.students);
    await college.save();

    res.status(200).json({
      success: true,
      message: "Students approved successfully",
    });
  } catch (error) {
    console.log(error);
  }
});

// ------------------------------get students-----------------------------

exports.getStudents = catchAsyncErrors(async (req, res, next) => {
  const id = req.user.id;

  const college = await College.findById(id);
  const approvedStudents = await College.findById(id).populate({
    path: "students",
  });
  // const uploadedStudents = await UploadedStudents.find({ college_id: id });
  // const invitedStudents = await Invitation.find({ sender: id });

  const uploadedStudents = await Invitation.find({ sender: id });

  // console.log(uploadedStudents , "uploaded students" , id)

  const pending = [];
  for (let i = 0; i < college.pendingStudents.length; i++) {
    const student = await Student.findById(college.pendingStudents[i]);
    pending.push(student);
  }
  res.status(200).json({
    success: true,
    approvedStudents: approvedStudents.students,
    uploadedStudents,
    pendingStudents: pending,
    // invitedStudents,
  });
});

// ============================================ dashboard ===========================================================

// getTotalJobs

exports.getTotalJobs = catchAsyncErrors(async (req, res, next) => {
  // const college = await College.findById(req.user.id).populate({
  //   path: "jobs",
  // });
  const jobs = await Job.find({});

  res.status(200).json({
    success: true,
    jobs: jobs,
    // totalJobs: college.jobs.length,
  });
});

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
  const companies = await Company.find({});
  res.status(200).json({
    success: true,
    companies: companies,
  });
});

// get recent companies

exports.getRecentCompanies = catchAsyncErrors(async (req, res, next) => {
  const companies = await Company.find({}).sort({ createdAt: -1 }).limit(5);

  if (companies.length > 0) {
    res.status(200).json({
      success: true,
      companies: companies,
    });
  } else {
    res.status(404).json({
      success: false,
      message: "No recent companies found",
    });
  }
});

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
