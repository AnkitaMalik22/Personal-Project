const {Student} = require('../../models/student/studentModel');
const catchAsyncErrors = require('../../middlewares/catchAsyncErrors');
const sendToken = require('../../utils/jwtToken');
const ErrorHandler = require('../../utils/errorhandler');
const crypto = require('crypto');

const College = require('../../models/college/collegeModel');
const Job = require('../../models/company/jobModel');
const Invitation = require('../../models/student/inviteModel');




// ============================================= STUDENT CONTROLLERS ====================================================

// --------------------------------------------- GET ALL STUDENTS -------------------------------------------------------

exports.getAllStudents = catchAsyncErrors(async (req, res, next) => {

  const students = await Student.find();

  res.status(200).json({
    success: true,
    students,
  });
});

// --------------------------------------------- GET A STUDENT ----------------------------------------------------------

exports.getStudent = catchAsyncErrors(async (req, res, next) => {

    const student = await Student.findById(req.user.id);

    console.log(req.user)
    
    if (!student) {
        return next(new ErrorHandler('Student not found', 404));
    }
    
    res.status(200).json({
        success: true,
        student,
    });
    });

// =======================================================================================================================




// --------------------------------------------- CREATE A STUDENT --------------------------------------------------------


exports.createStudent = catchAsyncErrors(async (req, res, next) => {

// const { Email, Password, ConfirmPassword ,CollegeName } = req.body;

// const college = await College.findOne({ 
//   CollegeName: CollegeName
// });

// if (!college) {
//   return next(new ErrorHandler('College not found', 404));
// }

// if (!Email || !Password || !ConfirmPassword) {
//   return next(new ErrorHandler('Please Enter All Fields', 400));
// }

// if (Password !== ConfirmPassword) {
//   return next(new ErrorHandler('Passwords do not match', 400));
// }

// const student = await Student.create({ ...req.body, CollegeId: college._id });

// college.students.push(student._id);

// await college.save();

// console.log("Student Created Successfully");


//   sendToken(student, 201, res);


// STUDENT WILL REGISTER USING THE REGISTRATION LINK SENT TO THEIR EMAIL 

const { Email, Password, FirstName, LastName, Major, From, To} = req.body;

// const CollegeId = req.params.CollegeId;
const { CollegeId, inviteLink } = req.query;

const college = await College.findById(CollegeId);

// const inviteLink = req.params.inviteLink;

console.log(inviteLink, CollegeId)

if (!college) {
  return next(new ErrorHandler('College not found', 404));
}

if (!inviteLink || !Email || !Password || !FirstName || !LastName || !Major || !From || !To) {
  return next(new ErrorHandler('Please Enter All Fields', 400));
}

const invite = await Invitation.findOne({ invitationLink: inviteLink });

if (!invite) {
  return next(new ErrorHandler('Invalid invitation link', 400));
}

// if (invite.status !== 'pending') {
//   return next(new ErrorHandler('Invitation link has been expired', 400));
// }

if (invite.recipientEmail !== Email) {
  return next(new ErrorHandler('Invalid email', 400));
}


invite.status = 'accepted';

await invite.save();

const student = await Student.create({ ...req.body, CollegeId: CollegeId });

college.students.push(student._id);

await college.save();

console.log("Student Created Successfully");  

sendToken(student, 201, res);

});

// --------------------------------------------- LOGIN A STUDENT --------------------------------------------------------

exports.loginStudent = catchAsyncErrors(async (req, res, next) => {

  const { Email, Password ,ConfirmPassword} = req.body;


 
  if (!Email || !Password || !ConfirmPassword) {
    return next(new ErrorHandler('Please Enter All Fields', 400));
  }


  if (Password !== ConfirmPassword) {
    return next(new ErrorHandler('Passwords do not match', 400));
  }


  const student = await Student.findOne({ Email }).select('+Password');

  if (!student) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  const isPasswordMatched = await student.comparePassword(Password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  sendToken(student, 200, res);
});

// --------------------------------------------- FORGOT PASSWORD --------------------------------------------------------

exports.forgotPasswordStudent = catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findOne({ Email: req.body.email });

  if (!student) {
    return next(new ErrorHandler('Student not found', 404));
  }

  // Get Reset Password Token
  const resetToken = student.getResetPasswordToken();

  await student.save({ validateBeforeSave: false });

  // Send the reset token to the student's email (implement sendEmail function)

  res.status(200).json({
    success: true,
    message: `Password reset token sent to ${student.Email} successfully`,
  });
});

//--------------------------------------------- RESET PASSWORD --------------------------------------------------------

exports.resetPasswordStudent = catchAsyncErrors(async (req, res, next) => {
  // Creating token hash
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const student = await Student.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!student) {
    return next(new ErrorHandler('Reset Password Token is invalid or has been expired', 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler('Passwords do not match', 400));
  }

  student.Password = req.body.password;
  student.resetPasswordToken = undefined;
  student.resetPasswordExpire = undefined;

  await student.save();

  // Send JWT token in response
  sendToken(student, 200, res);
});

// --------------------------------------------- UPDATE PASSWORD --------------------------------------------------------

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findById(req.user.id).select("+Password");

  // Check if old password is correct
  const isPasswordMatched = await student.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  // Check if new passwords match
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Update college password
  student.Password = req.body.newPassword;

  await student.save();

  // Send JWT token in response
  sendToken(student, 200, res);
});

// --------------------------------------------- UPDATE A STUDENT --------------------------------------------------------

exports.updateProfileStudent = catchAsyncErrors(async (req, res, next) => {
  let student = await Student.findById(req.user.id);
  
    if (!student) {
      return next(new ErrorHandler('Student not found', 404));
    }
  
    student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  
    res.status(200).json({
      success: true,
      student,
    });
  });

// Update Profile Picture

exports.updateProfilePictureStudent = catchAsyncErrors(async (req, res, next) => {
  const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });

  const student = await Student.findByIdAndUpdate(  req.user.id,
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
    student,
  });
});
  


  
// ----------------------------------------- DELETE A STUDENT --------------------------------------------------------


exports.deleteStudent = catchAsyncErrors(async (req, res, next) => {

    const student = await Student.findById(req.user.id);
  
    if (!student) {
      return next(new ErrorHandler('Student not found', 404));
    }
  
    await student.remove();
  
    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  });

//   --------------------------------------------- get students by college id --------------------------------------------

exports.getStudentsByCollegeId = catchAsyncErrors(async (req, res, next) => {
    const students = await Student.find({ CollegeId: req.user.id });

    console.log(students)

    res.status(200).json({
        success: true,
        students,
        });

});

// --------------------------------------------- get students by assessment id --------------------------------------------

exports.getStudentsByAssessmentId = catchAsyncErrors(async (req, res, next) => {
    const students = await Student.find({ Assessments: req.params.id });

    res.status(200).json({
        success: true,
        students,
        });

});

// --------------------------------------------- get students by job id ------------------------------------------------

exports.getStudentsByJobId = catchAsyncErrors(async (req, res, next) => {
    const students = await Student.find({ Jobs: req.params.id });

    res.status(200).json({
        success: true,
        students,
        });

});

// --------------------------------------------- get students by skill -------------------------------------------------

exports.getStudentsBySkill = catchAsyncErrors(async (req, res, next) => {
    const students = await Student.find({ Skills: req.params.skill });

    res.status(200).json({
        success: true,
        students,
        });

});

  // ====================================================== LOGOUT  ===========================================================

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
  

// ========================================================= DASHBOARD =======================================================

// -- Your Assessments
exports.getYourAssessments = catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findById(req.user.id).populate("Assessments");

  res.status(200).json({
    success: true,
    assessments: student.Assessments,
  });
});


//  -- New Jobs
exports.getNewJobs = catchAsyncErrors(async (req, res, next) => {
  const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5);

  res.status(200).json({
    success: true,
    jobs:recentJobs 
  });
})

// -- RECOMMENDED JOBS

exports.getRecommendedJobs = catchAsyncErrors(async (req, res, next) => {
  const  studentId  = req.user.id;

  // get the student's skills for the studentId
  const student = await Student.findById(studentId).select('Skills');

  if (!student) {
    return next(new ErrorHandler('Student not found', 404));
  }

  //using the student's software knowledge to find recommended jobs
  const recommendedJobs = await Job.find({ 'Skills.SoftwareKnowledge': { $in: student.Skills.SoftwareKnowledge } });

  res.status(200).json({
    success: true,
    jobs: recommendedJobs,
  });
});
;

// GET RESULT By Student ID

exports.getResultByStudentId = catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findById(req.user.id).populate("Score");

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  res.status(200).json({
    success: true,
    result: student.Score,
  });
});







