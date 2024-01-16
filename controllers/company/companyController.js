const ErrorHandler = require("../../utils/errorhandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const Company = require("../../models/company/companyModel");
const sendToken = require("../../utils/jwtToken");
const sendEmail = require("../../utils/sendEmail");
const crypto = require("crypto");

// ================================================================================================================================

// =================================================== REGISTER Company ===========================================================

exports.registerCompany = catchAsyncErrors(async (req, res, next) => {
  const { Email, FirstName, LastName, Password } = req.body;

  // Check if required fields are present
  if (!Email || !FirstName || !LastName || !Password) {
    return next(new ErrorHandler("Please Enter All Fields", 400));
  }

  // Create a new Company
  const company = await Company.create(req.body);

  // Log Company details
  // console.log(company);

  // Send JWT token in response
  sendToken(company, 201, res);
});

// =================================================== LOGIN Company ===========================================================
// Login Company
exports.loginCompany = catchAsyncErrors(async (req, res, next) => {
  const { Email, Password,confirmPassword } = req.body;


  // Check if email and password are provided
  if (!Email || !Password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  if (Password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Find Company by email
  const company = await Company.findOne({ Email }).select("+Password");

  // Check if Company exists
  if (!company) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  // Check if password is correct
  const isPasswordMatched = await company.comparePassword(Password);

  // If password is incorrect, send an error response
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  // Send JWT token in response
  sendToken(company, 200, res);
});

// ====================================================== LOGOUT Company ===========================================================
// Logout Company
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

// delete Company

exports.deleteCompany = catchAsyncErrors(async (req, res, next) => {
  const company = await Company.findById(req.user.id);

  if (!company) {
    return next(new ErrorHandler("Company not found", 404));
  }

  // check if the user is authorized to delete the Company
  if (company._id.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        "You are not authorized to delete this Company",
        401
      )
    );
  }

  await company.remove();

  res.status(200).json({
    success: true,
    message: "Company deleted successfully",
  });
});

// ==================================================== GET Company PROFILE ===========================================================
// Get Company Details
exports.getCompanyDetails = catchAsyncErrors(async (req, res, next) => {
  const company = await Company.findById(req.user.id);

  if (!company) {
    return next(new ErrorHandler("Company not found", 404));
  }
  res.status(200).json({
    success: true,
    company,
  });
});

// ====================================================== FORGOT PASSWORD ===========================================================
// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const company = await Company.findOne({ Email: req.body.email });

  if (!company) {
    return next(new ErrorHandler("Company not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = company.getResetPasswordToken();

  await company.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;

  const message = `Your password reset token is:\n\n${resetPasswordUrl}\n\nIf you have not requested this email, please ignore it.`;

  try {
    // Send password reset email
    await sendEmail({
      email: company.Email,
      subject: `Company Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${Company.Email} successfully`,
    });
  } catch (error) {
    Company.resetPasswordToken = undefined;
    Company.resetPasswordExpire = undefined;

    await Company.save({ validateBeforeSave: false });

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

  const company = await Company.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!company) {
    return next(
      new ErrorHandler("Reset Password Token is invalid or has been expired", 400)
    );
  }

  // Check if passwords match
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Update Company password and reset token
  company.Password = req.body.password;
  company.resetPasswordToken = undefined;
  company.resetPasswordExpire = undefined;

  await company.save();

  // Send JWT token in response
  sendToken(company, 200, res);
});

// ========================================= UPDATE Company PASSWORD ===========================================================
// Update Company Password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
 
  const company = await Company.findById(req.user.id).select("+Password");

  // Check if old password is correct
  const isPasswordMatched = await company.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  // Check if new passwords match
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Update Company password
  company.Password = req.body.newPassword;

  await company.save();

  // Send JWT token in response
  sendToken(company, 200, res);
});

// ================================================ UPDATE Company PROFILE ===========================================================
// Update Company Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newCompanyData = req.body;

  // Update Company profile
  const updatedCompany = await Company.findByIdAndUpdate(
    req.user.id,
    newCompanyData,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    Company: updatedCompany,
  });
});



// ================================================ Update Cover Picture ===========================================================

exports.updateCoverPictureCompany = catchAsyncErrors(async (req, res) => {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.cover, {
        folder: "covers",
        width: 150,
        crop: "scale",
    });
    
    const company = await Company.findByIdAndUpdate(req.user.id, {
        basic: {
            coverPhoto: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            },
        
        },
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    
    res.status(200).json({
        success: true,
        company,
    });
});

// ================================================ Update Company Logo ===========================================================

exports.updateLogoCompany = catchAsyncErrors(async (req, res, next) => {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.logo, {
        folder: "logos",
        width: 150,
        crop: "scale",
    });
    
    const company = await Company.findByIdAndUpdate(  req.user.id,
        {
        logo: {
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
        company,
    });
    }
);





  





