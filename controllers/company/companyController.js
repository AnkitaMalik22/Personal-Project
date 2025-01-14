const ErrorHandler = require("../../utils/errorhandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const Company = require("../../models/company/companyModel");
const sendToken = require("../../utils/jwtToken");
const sendEmail = require("../../utils/sendEmail");
const crypto = require("crypto");
const sendTokenCompany = require("../../utils/jwtTokenCompany");
const { uploadPicture } = require("../../utils/uploadPicture");
const cloudinary = require("cloudinary");
const bcrypt = require('bcryptjs');

// ================================================================================================================================

// =================================================== REGISTER Company ===========================================================

exports.registerCompany = catchAsyncErrors(async (req, res, next) => {
  const {
    // Step 1
    cover,
   logo,
    publicIdLogo,
    publicIdCover,
    companyName,
    password,
    email,
    phone,
    website,
    type,
    industry,
    description,
    // Step 2
    locationName,
    address,
    town,
    country,
    postalCode,
    // Step 3
    linkedIn,
    yearFounded,
    mission,
    baseLocation,
    isMultinational,
    executiveName,
    executiveDesignation,
  } = req.body;

  // Check if required fields are present
  if (!email || !password) {
    return next(new ErrorHandler("Email and Password Required", 400));
  }
  const hashedPassword =await  bcrypt.hash(password, 10);
  // Create a new Company

  const company = await Company.create({
    Email: email,
    phone: phone,
    status: "pending",
    role: "company",
    FirstName: "ADMIN",
    LastName: "ADMIN",
    Password: hashedPassword,
    designatedColleges: [],
    basic: {
      publicIdCover: publicIdCover,
      publicIdLogo: publicIdLogo,
      coverPhoto: cover,
      logo: logo,
      companyName: companyName,
      website: website,
      totalEmployees: 0,
      yearFounded: yearFounded || 0,
      hqCity: baseLocation,
      annualRevenue: 0,
      sector: "UNSET",
      industry: industry,
      companyType:type,
      status: "Active",
      // _id: new ObjectId(),
    },
    location:  {
      locName: locationName,
      address: address,
      town: town,
      state: town,
      country: country,
      postalCode: postalCode,
      // _id: new ObjectId(),
    },
    leader: {
      name: executiveName,
      title: executiveDesignation,
      country: country,
      isGlobalLeader: false,
      // _id: new ObjectId(),
    },
    about: {
      description: description || "UNSET",
      missions: mission,
      programs:  "UNSET",
      linkedIn: linkedIn || "UNSET",
      // _id: new ObjectId(),
    },
    
    dashboard: {
      totalJobs: 0,
      studentsHired: 0,
      approved: 0,
      institutes: 0,
      assessments: 0,
      newJobs: 0,
      // _id: new ObjectId(),
    },
    students: [],
    jobs: [],
    assessments: [],
    otp: null,
    otpExpires: null,
    otpVerified: false,
    authType: "none",
    createdAt: new Date().toISOString(),
    loginActivity: [],
    emails: [],
    emailsSent: [],
    __v: 0,
  });

  sendTokenCompany(company, 201, res);
});

// =================================================== LOGIN Company ===========================================================
// Login Company
// /api/company/login
exports.loginCompany = catchAsyncErrors(async (req, res, next) => {
console.log("logon");

  const { Email, Password } = req.body;

  // Check if email and password are provided
  if (!Email || !Password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  // if (Password !== confirmPassword) {
  //   return next(new ErrorHandler("Passwords do not match", 400));
  // }

  // Find Company by email
  const company = await Company.findOne({ Email }).select("+Password");
console.log(company.Password,Password);
  // Check if Company exists
  if (!company) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  // Check if password is correct
  const isPasswordMatched = await bcrypt.compare(Password, company.Password);


 
  console.log(isPasswordMatched)

  // If password is incorrect, send an error response
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or passwords", 401));
  }

  // Send JWT token in response
  sendTokenCompany(company, 200, res);
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


// ==================================================== GET Company PROFILE ===========================================================

exports.getCompany = catchAsyncErrors(async (req, res, next) => {
  console.log(req.params.companyId , "company id")
  const company = await Company.findById(req.params.companyId)

  if (!company) {
    return next(new ErrorHandler("Company not found", 404));
  }
  res.status(200).json({
    success: true,
    company,
  });
}
);

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
  // Define allowed fields and their default values for basic info
  const basicDefaults = {
    coverPhoto: '',
    publicIdLogo: '',
    publicIdCover: '',
    logo: '',
    companyName: '',
    website: '',
    totalEmployees: 0,
    yearFounded: 0,
    hqCity: '',
    annualRevenue: 0,
    sector: '',
    industry: '',
    companyType: '',
    status: ''
  };

  // Define allowed top-level fields
  const allowedFields = [
    'status',
    'statusChangedAt',
    'Email',
    'FirstName',
    'LastName',
    'avatar',
    'Phone',
    'location',
    'leader',
    'about',
    'awards',
    'dashboard',
    'students',
    'jobs',
    'assessments',
    'authType',
    'emails',
    'emailsSent'
  ];

  // Initialize new company data
  const newCompanyData = {};

  // Process allowed fields
  allowedFields.forEach(field => {
    if (req.body[field]) {
      // Special handling for role to prevent setting as admin
     
      newCompanyData[field] = req.body[field];
    }
  });

  // Process basic info if provided
  if (req.body.basic) {
    newCompanyData.basic = {};
    Object.keys(basicDefaults).forEach(key => {
      newCompanyData.basic[key] = req.body.basic[key] || basicDefaults[key];
    });
  }

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
  });

  // Update only the cover field within the basic object
  const updatedCompany = await Company.findByIdAndUpdate(
    req.user.id,
    {
      "basic.coverPhoto": myCloud.secure_url,
      "basic.publicIdCover":myCloud.public_id
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    company: updatedCompany,
  });
});

// ================================================ Update Company Logo ===========================================================

exports.updateLogoCompany = catchAsyncErrors(async (req, res, next) => {

  // console.log(req.body.logo)
  const myCloud = await cloudinary.v2.uploader.upload(req.body.logo, {
    folder: "logos",
    width: 150,
    crop: "scale",
  });

  const company = await Company.findByIdAndUpdate(req.user.id,
    {
     avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
        "basic.logo": myCloud.secure_url,
        "basic.publicIdLogo":myCloud.public_id
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

exports.uploadCompanyImage = catchAsyncErrors(async (req, res, next) => {

  console.log(req)
  if (req.files.logo) {

    const logo = await uploadPicture(req.files.logo, "company_logos");
    return res.status(200).json({ success: true, data: logo });

  } else if (req.files.cover) {

    const cover = await uploadPicture(req.files.cover, "company_cover_photos");
    return res.status(200).json({ success: true, data: cover });

  }
  return res.status(400).json({ success: false, message: "something went wrong" });

})





