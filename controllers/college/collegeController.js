const ErrorHandler = require("../../utils/errorhandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const College = require("../../models/college/collegeModel");
const sendToken = require("../../utils/jwtToken");
const sendEmail = require("../../utils/sendEmail");
const crypto = require("crypto");
const Company = require("../../models/company/companyModel");
const {Student} = require("../../models/student/studentModel");
const Job = require("../../models/company/jobModel");
const Invitation = require("../../models/student/inviteModel");
const UploadedStudents = require("../../models/student/uploadedStudents");
const cloudinary = require("cloudinary");
const axios = require("axios");

// ================================================================================================================================

// =================================================== REGISTER COLLEGE ===========================================================

exports.registerCollege = catchAsyncErrors(async (req, res, next) => {
  if (req.body.googleAccessToken) {
    try {
      const { googleAccessToken } = req.body;

      const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          "Authorization": `Bearer ${googleAccessToken}`
        }
      });

      const { given_name: FirstName, family_name: LastName, email: Email, picture: profilePicture } = response.data;

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

      const college = await College.create({
        FirstName,
        LastName,
        Email,
        avatar
      });

      sendToken(college, 200, res);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    const { Email, FirstName, LastName, Password } = req.body;


    // Check if required fields are present
    if (!Email || !FirstName || !LastName || !Password) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }

    const avatar = {
      public_id: "avatars/wy3fbtukb75frndzgnxx",
      url: "https://res.cloudinary.com/dkqgktzny/image/upload/v1708338934/avatars/wy3fbtukb75frndzgnxx.png"
    };

    // Create a new college
    const college = await College.create({
      ...req.body,avatar
    });

    // Log college details
    // console.log(college);

    // Send JWT token in response
    sendToken(college, 201, res);
  }
});


// =================================================== LOGIN COLLEGE ===========================================================
// Login College
exports.loginCollege = catchAsyncErrors(async (req, res, next) => {



  if(req.body.googleAccessToken){

    const {googleAccessToken} = req.body;
  
          axios
              .get("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: {
                  "Authorization": `Bearer ${googleAccessToken}`
              }
          })
              .then(async response => {
                
                  const Email = response.data.email;
                 
                  const college = await College.findOne({Email})
  
                  if (!college) 
                  return res.status(404).json({message: "User don't exist!"})
  
                 
                  sendToken(college, 200, res);
              })
  
              .catch(err => {
                  res
                      .status(400)
                      .json({message: "Invalid access token!"})
              })
  
  
  }else{


  const { Email, Password } = req.body;


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

  // Send JWT token in response
  sendToken(college, 200, res);

  }
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

  // console.log("user = ", req.user)
  const college = await College.findById(req.user.id);

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

  if (req.body.oldPassword === req.body.newPassword) {
    return next(new ErrorHandler("New password cannot be the same as old password", 400));
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
    req.user.id,
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

  const college = await College.findByIdAndUpdate(  req.user.id,
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
console.log(college)

  res.status(200).json({
    success: true,
    college,
  });
});

// ===============================================================================================================



//------------------------ Upload Students----------------------------


exports.uploadStudents = catchAsyncErrors(async (req, res, next) => {

  const {  students } = req.body;
  // console.log(students)

  const CollegeId = req.user.id;

  const college = await College.findById(CollegeId);
  
  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  for (let i = 0; i < students.length; i++) {
    const { FirstName, LastName, Email } = students[i];
    const student = await
   UploadedStudents.create({
      college_id: CollegeId,
      FirstName,
      LastName,
      Email,
    });
  }

  // college.uploadedStudents = students;
  // await college.save();

  res.status(200).json({
    success: true,
    message: "Students uploaded successfully",
  });
});



// ------------------------------get uploaded students-----------------------------
exports.getUploadedStudents = catchAsyncErrors(async (req, res) => {
  const college = await College.findById(req.user.id);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  console.log(req.user.id)
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


 const { students} = req.body;
 const CollegeId = req.user.id;

  const college = await College.findById(CollegeId);

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }

  for (let i = 0; i < students.length; i++) {

    // from uploaded students
 const student = await UploadedStudents.findOne({college_id: CollegeId, Email: students[i].Email});
 if (student) {
  // console.log(student)
  console.log({ sender: CollegeId, recipientEmail: student.Email });
} else {
  console.log('Student not found.');
}

  const invite = await Invitation.create({
    sender: CollegeId,
    recipientEmail: student.Email,
    invitationLink: crypto.randomBytes(20).toString('hex'),
  });


  sendEmail({
    email: student.Email,
    subject: "Invitation to join College",
        message: `Hello ${student.FirstName}!,You have been invited to join ${college.FirstName} ${college.LastName} college. Please click on the link to register: http://localhost:4000/api/students/CollegeId=${CollegeId}/inviteLink=${invite.invitationLink}`,
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

// ------------------------------get students-----------------------------

exports.getStudents = catchAsyncErrors(async (req, res, next) => {
  const students = await Student.find({ CollegeId: req.user.id });
  res.status(200).json({
    success: true,
    students: students,
  });
});


// ============================================ dashboard ===========================================================


// getTotalJobs

exports.getTotalJobs = catchAsyncErrors(async (req, res, next) => {
  // const college = await College.findById(req.user.id).populate({
  //   path: "jobs",
  // });
  const jobs =  await Job.find({});

  res.status(200).json({
    success: true,
    jobs: jobs,
    // totalJobs: college.jobs.length,
  });
})

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
})

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
})

// get total companies

exports.getTotalCompanies = catchAsyncErrors(async (req, res, next) => {
  const companies = await Company.find({});
  res.status(200).json({
    success: true,
    companies: companies,
 
  });
})

// get recent companies

exports.getRecentCompanies = catchAsyncErrors(async (req, res, next) => {
  const companies = await Company.find({}).sort({createdAt: -1}).limit(5);

  if (companies.length > 0) {
    res.status(200).json({
      success: true,
      companies: companies,
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'No recent companies found',
    });
  }
  ;
})




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
})



  





