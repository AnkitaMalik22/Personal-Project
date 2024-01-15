const ErrorHandler = require("../../utils/errorhandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const College = require("../../models/college/collegeModel");
const sendToken = require("../../utils/jwtToken");
const sendEmail = require("../../utils/sendEmail");
const crypto = require("crypto");

// ================================================================================================================================

// =================================================== REGISTER COLLEGE ===========================================================

exports.registerCollege = catchAsyncErrors(async (req, res, next) => {
  const { Email, FirstName, LastName, Password } = req.body;

  // Check if required fields are present
  if (!Email || !FirstName || !LastName || !Password) {
    return next(new ErrorHandler("Please Enter All Fields", 400));
  }

  // Create a new college
  const college = await College.create(req.body);

  // Log college details
  console.log(college);

  // Send JWT token in response
  sendToken(college, 201, res);
});

// =================================================== LOGIN COLLEGE ===========================================================
// Login College
exports.loginCollege = catchAsyncErrors(async (req, res, next) => {
  const { Email, Password,confirmPassword } = req.body;


  // Check if email and password are provided
  if (!Email || !Password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  if (Password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

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

  // Send JWT token in response
  sendToken(college, 200, res);
});

// ====================================================== LOGOUT COLLEGE ===========================================================
// Logout College
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// ==================================================== GET COLLEGE PROFILE ===========================================================
// Get College Details
exports.getCollegeDetails = catchAsyncErrors(async (req, res, next) => {
  const college = await College.findById(req.query.id);

  res.status(200).json({
    success: true,
    college,
  });
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

  const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;

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
      new ErrorHandler("Reset Password Token is invalid or has been expired", 400)
    );
  }

  // Check if passwords match
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Update college password and reset token
  college.Password = req.body.password;
  college.resetPasswordToken = undefined;
  college.resetPasswordExpire = undefined;

  await college.save();

  // Send JWT token in response
  sendToken(college, 200, res);
});

// ========================================= UPDATE COLLEGE PASSWORD ===========================================================
// Update College Password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const college = await College.findById(req.user.id).select("+Password");

  // Check if old password is correct
  const isPasswordMatched = await college.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  // Check if new passwords match
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Update college password
  college.Password = req.body.newPassword;

  await college.save();

  // Send JWT token in response
  sendToken(college, 200, res);
});

// ================================================ UPDATE COLLEGE PROFILE ===========================================================
// Update College Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newCollegeData = req.body;

  // Update college profile
  const updatedCollege = await College.findByIdAndUpdate(
    req.params.id,
    newCollegeData,
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


// ================================================ Update Profile Picture ===========================================================

exports.updateProfilePictureCollege = catchAsyncErrors(async (req, res, next) => {
  const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });

  const college = await College.findByIdAndUpdate(  req.params.id,
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
    college,
  });
});

// Add Student to College



  





