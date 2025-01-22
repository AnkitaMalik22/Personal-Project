// <<<<<<< sidd333
const { Student } = require("../../models/student/studentModel");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const sendToken = require("../../utils/jwtTokenStudent");
const ErrorHandler = require("../../utils/errorhandler");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const College = require("../../models/college/collegeModel");
const Job = require("../../models/company/jobModel");
const Invitation = require("../../models/student/inviteModel");
const axios = require("axios");
const cloudinary = require("cloudinary");
const InvitedStudents = require("../../models/college/student/Invited");
const ApprovedStudents = require("../../models/college/student/Approved");
const UploadedStudents = require("../../models/student/uploadedStudents");
const BlacklistToken = require("../../models/college/blacklistToken");
const sendEmail = require("../../utils/sendEmail");
const QrStudent = require("../../models/college/qr/qrStudent");
const qrcode = require("qrcode");
const speakeasy = require("speakeasy");
const University = require("../../models/university/universityModel");
const mongoose = require("mongoose");

// =======
// const { Student } = require('../../models/student/studentModel');
// const catchAsyncErrors = require('../../middlewares/catchAsyncErrors');
// const sendToken = require('../../utils/jwtTokenStudent');
// const ErrorHandler = require('../../utils/errorhandler');
// const crypto = require('crypto');

// const College = require('../../models/college/collegeModel');
// const Job = require('../../models/company/jobModel');
// const Invitation = require('../../models/student/inviteModel');
// const axios = require('axios');
// const cloudinary = require('cloudinary');

// >>>>>>> master

// ============================================= STUDENT CONTROLLERS ====================================================

// ====

// ================================================================================================================================
//  qr
exports.generateQr = async (req, res, next) => {
  try {
    let secret = speakeasy.generateSecret({
      name: `Skillaccess: ${req.user.FirstName}`,
    });
    // console.log(secret);
    const user = await Student.findById(req.user.id);
    if (!user) return res.status(404).send("student not found");
    const qr = await QrStudent.findOne({ user: req.user.id });

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
      await QrStudent.create({
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
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.verifyQr = catchAsyncErrors(async (req, res, next) => {
  const token = req.header("auth-token");

  const student = await Student.findById(req.user.id);
  if (!student) {
    return next(new ErrorHandler("College not found", 404));
  }
  const qr = await QrStudent.findOne({ user: student._id });
  console.log(qr);
  let verified = speakeasy.totp.verify({
    secret: qr.secret.ascii,
    encoding: "ascii",
    token: parseInt(req.body.token),
  });
  // console.log(parseInt(req.body.token));
  // console.log(req.body.secret);
  // student.qrVerify = true;

  student.loginActivity.forEach((login) => {
    console.log(login.token_id === token);
    if (login.token_id === token) {
      login.qrVerify = true;
    }
  });
  await student.save({ validateBeforeSave: false });

  if (verified) return res.status(200).json({ verified: verified, student });
  return res.status(400).json({ verified: verified, student });
});
// =================================================== selectAuth===========================================================
exports.selectAuth = catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findById(req.user.id);
  if (!student) {
    return next(new ErrorHandler("not found", 404));
  }
  student.authType = req.body.type;
  if (req.body.type === "qr") {
    student.qrVerify = true;
  }
  await student.save({ validateBeforeSave: false });
  return res.status(200).json({ student });
});
// =================================================== REGISTER COLLEGE ===========================================================
// --------------------------------------------- GET A STUDENT -------------------------------------------------------

exports.getStudent = catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findById(req.user.id);

  console.log(req.user.id);

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  res.status(200).json({
    success: true,
    student,
  });
});

// --------------------------------------------- GET A STUDENT --ID -------------------------------------------------------

exports.getStudentById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const studentData = await Student.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: "studentresponses",
        localField: "studentResponses",
        foreignField: "_id",
        as: "allStudentResponses"
      }
    },
    {
      $lookup: {
        from: "assessments",
        localField: "allStudentResponses.assessmentId",
        foreignField: "_id",
        as: "assessments"
      }
    },
    {
      $addFields: {
        allStudentResponses: {
          $map: {
            input: "$allStudentResponses",
            as: "response",
            in: {
              $mergeObjects: [
                "$$response",
                {
                  assessmentId: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$assessments",
                          as: "assessment",
                          cond: {
                            $eq: ["$$assessment._id", "$$response.assessmentId"]
                          }
                        }
                      },
                      0
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      $project: {
        FirstName: 1,
        LastName: 1,
        Email: 1,
        completedProfile: 1,
        batch: 1,
        approved: 1,
        avatar: 1,
        FirstName: 1,
        LastName: 1,
        CollegeName: 1,
        CollegeId: 1,
        Education: 1,
        Skills: 1,
        Links: 1,
        Portfolio: 1,
        Cv: 1,
        Certificate: 1,
        CompanyPlaced: 1,
        JobPlace: 1,
        completedProfile: 1,
        batch: 1,
        approved: 1,
        avatar: 1,
        FirstName: 1,
        LastName: 1,
        CollegeName: 1,
        CollegeId: 1,
        Education: 1,
        Skills: 1,
        Links: 1,
        Portfolio: 1,
        Cv: 1,
        Certificate: 1,
        CompanyPlaced: 1,
        JobPlace: 1,
        PhoneNumber: 1,
        Address: 1,
        Website: 1,
        Certificates: 1,
        approved: 1,
        // Include all other student fields you need
        studentResponses: {
          $slice: ["$allStudentResponses", (page - 1) * limit, parseInt(limit)]
        },
        totalResponses: { $size: "$allStudentResponses" }
      }
    }
  ]);

  if (!studentData.length) {
    return next(new ErrorHandler("Student not found", 404));
  }

  res.status(200).json({
    success: true,
    student: studentData[0],
    pagination: {
      currentPage: parseInt(page),
      limit: parseInt(limit),
      totalResponses: studentData[0].totalResponses,
      totalPages: Math.ceil(studentData[0].totalResponses / limit)
    }
  });
});


// --------------------------------------------- GET ALL STUDENTS -------------------------------------------------------

exports.getAllStudents = catchAsyncErrors(async (req, res, next) => {
  const students = await Student.find();

  res.status(200).json({
    success: true,
    students,
  });
});


// ----------  CHECK INVITATION ---------------------------

exports.checkInvitation = async (req, res, next) => {
  try {
    const { inviteLink, CollegeId } = req.query;
    let entity;
    let FirstName; let LastName;

    // Validate input
    if (!inviteLink || !CollegeId) {
      return next(new ErrorHandler("Invalid invitation link or college ID", 400));
    }

    // Check if the college exists
    const college = await College.findById(CollegeId);
    const university = await University.findById(CollegeId);


    if (!college && !university) {
      return next(new ErrorHandler("College not found", 404));
    }

    if (college) {
      entity = "college"
    } else {
      entity = "university"
    }


    // Check if the invitation exists
    const collegeInv = await InvitedStudents.findOne({ [entity]: CollegeId });
    if (!collegeInv) {
      return next(new ErrorHandler("Invalid invitation link", 400));
    }

    // Validate the invitation link and check if the student is already registered
    let valid = false;
    let email = "";
    collegeInv.students.forEach(student => {
      if (student.link === inviteLink) {
        email = student.Email;
        valid = true;
        FirstName = student.FirstName;
        LastName = student.LastName;
      }
    });

    if (!valid) {
      return next(new ErrorHandler("Invalid invitation link", 400));
    }

    // Check if the student is already registered
    const existingStudent = await Student.findOne({ Email: email });
    if (existingStudent) {
      return res.status(200).redirect("/");
    }
    // If valid and not registered, proceed to registration page
    res.status(200).json({
      FirstName, LastName,
      success: true,
      message: "Valid invitation link, proceed to registration",
      email,
      inviteLink,
      collegeId: CollegeId
    });

  } catch (error) {
    console.log(error);
    next(new ErrorHandler("Internal server error", 500));
  }
};

// --------------------------------------------- CREATE A STUDENT --------------------------------------------------------

exports.createStudent = catchAsyncErrors(async (req, res, next) => {
  // STUDENT WILL REGISTER USING THE REGISTRATION LINK SENT TO THEIR EMAIL

  const { CollegeId, inviteLink } = req.query;

  let entity;
  let student;
  let role = "college";
  let approved = false;
  const device = req.headers["user-agent"];

  entity = await College.findById(CollegeId);

  if (!entity) {
    entity = await University.findById(CollegeId);
    role = "university"
  }


  if (!entity) {
    return next(new ErrorHandler(`${role} not found`, 404));
  }

  if (req.body.googleAccessToken) {

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

    const existingUser = await Student.findOne({ Email });
    const mailUsed = await College.findOne({ Email });
    const existingCompany = await Company.findOne({ Email });
    const existingUniversity = await University.findOne({ Email })

    if (existingUser || mailUsed || existingCompany || existingUniversity) {
      return res.status(400).json({ message: "User already exists" });
    }

    const collegeInv = await InvitedStudents.findOne({ college: CollegeId });


    let batch = "";
    valid = collegeInv.students.some((student) => {
      if (student.link === inviteLink) {
        email = student.Email;
        batch = student.batch;
        approved = student.approved;
      }
      return student.link === inviteLink;
    });
    if (!valid) {
      return next(new ErrorHandler("Invalid invitation link", 400));
    }

    student = await Student.create({
      FirstName,
      LastName,
      Email,
      avatar,
      batch,
      ...(role === "university" ? { universityId: CollegeId, CollegeName: "Unassigned" } : { CollegeName: entity.collegeName, CollegeId: CollegeId }),
      registrationLink: inviteLink,

    });

  } else {

    const {
      Email,
      Password,
      FirstName,
      LastName,
      ip,
      Major,
      From,
      To,
      PhoneNumber,
    } = req.body;

    if (
      (!inviteLink || !Password || !FirstName || !LastName,
        !Major,
        !From,
        !To)
    ) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }

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

    // const invite = await Invitation.findOne({ invitationLink: inviteLink });
    let valid = true;
    const collegeInv = await InvitedStudents.findOne({ [role]: CollegeId });

    let email;
    let batch = "";
    valid = collegeInv.students.some((student) => {
      if (student.link === inviteLink) {
        email = student.Email;
        batch = student.batch;
        approved = student.approved
      }
      return student.link === inviteLink;
    });
    if (!valid) {
      return next(new ErrorHandler("Invalid invitation link", 400));
    }

    student = await Student.create({
      ...req.body,
      Password: req.body.Password,
      ...(role === "university" ? { universityId: CollegeId, CollegeName: "Unassigned", CollegeId: undefined } : { CollegeName: entity.collegeName, CollegeId: CollegeId }),
      avatar,
      Email: email,
      registrationLink: inviteLink,
      PhoneNumber,
      batch: batch,
      approved
    });

  }
  sendToken(student, 201, res, device);
});
// --------------------------------------------- LOGIN A STUDENT --------------------------------------------------------

exports.loginStudent = catchAsyncErrors(async (req, res, next) => {
  if (req.body.googleAccessToken) {
    try {
      const { googleAccessToken, ip } = req.body;
      const device = req.headers["user-agent"];

      const response = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
          },
        }
      );

      const { email: Email } = response.data;

      const student = await Student.findOne({ Email });

      if (!student) {
        return res.status(404).json({ message: "User not found" });
      }

      sendToken(student, 200, res, ip, device);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    // <<<<<<< sidd333
    // =======

    try {
      // >>>>>>> master
      const { Email, Password, ip } = req.body;
      const device = req.headers["user-agent"];

      if (!Email || !Password) {
        return next(new ErrorHandler("Please Enter Email & Password", 400));
      }

      const student = await Student.findOne({ Email }).select("+Password");

      if (!student) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
      }

      // Check if password is correct
      const isPasswordMatched = await student.comparePassword(Password);

      if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
      }

      sendToken(student, 200, res, ip, device);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
});

// --------------------------------------------- FORGOT PASSWORD --------------------------------------------------------

exports.forgotPasswordStudent = catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findOne({ Email: req.body.email });

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  // Get Reset Password Token 
  const resetToken = student.getResetPasswordToken();

  console.log(resetToken);

  await student.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${process.env.STUDENT_URL || "https://student.skillaccess.in"}/password/reset/${resetToken}`;

  const message = `Your password reset token is:\n\n${resetPasswordUrl}\n\nIf you have not requested this email, please ignore it.`;

  try {
    // Send password reset email
    await sendEmail({
      email: student.Email,
      subject: `Student Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${student.Email} successfully`,
    });
  } catch (error) {
    student.resetPasswordToken = undefined;
    student.resetPasswordExpire = undefined;

    await student.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }

  // Send the reset token to the student's email (implement sendEmail function)

  // res.status(200).json({
  //   success: true,
  //   message: `Password reset token sent to ${student.Email} successfully`,
  // });
});

//--------------------------------------------- RESET PASSWORD --------------------------------------------------------

exports.resetPasswordStudent = catchAsyncErrors(async (req, res, next) => {
  // Creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const student = await Student.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!student) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
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
    return next(new ErrorHandler("Student not found", 404));
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

exports.updateProfilePictureStudent = catchAsyncErrors(
  async (req, res, next) => {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    const student = await Student.findByIdAndUpdate(
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
      student,
    });
  }
);
// =================================================== ALL LOGGED IN USERS -- SAME USERID  ===========================================================

exports.getAllLoggedInUsers = catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findById(req.user.id);

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  const loggedInUsers = student.loginActivity;

  res.status(200).json({
    success: true,
    loggedInUsers,
  });
});

// logout a user

exports.logoutAUser = catchAsyncErrors(async (req, res, next) => {
  console.log("req.user.id", req.user.id);
  const student = await Student.findById(req.user.id);

  if (!student) {
    return next(new ErrorHandler("College not found", 404));
  }

  const token = req.params.token;

  student.loginActivity.forEach((login) => {
    console.log(login.token_id === token);
    if (login.token_id === token) {
      login.token_deleted = true;
    }
  });
  student.qrVerify = false;

  const blacklist_token = await BlacklistToken.create({
    token: token,
  });

  console.log("Token blacklisted", blacklist_token);

  await student.save({ validateBeforeSave: false });
  const loggedInUsers = student.loginActivity;

  res.status(200).json({
    success: true,
    message: "Logged Out",
    loggedInUsers,
  });
});

// ===================================================   REMOVE LOGGEDOUT USERS ===========================================================

exports.removeLoggedOutUsers = catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findById(req.user.id);

  if (!student) {
    return next(new ErrorHandler("College not found", 404));
  }

  const token = req.params.token;

  // college.loginActivity = college.loginActivity.filter((login) => login.token_deleted === false);
  student.loginActivity = student.loginActivity.filter(
    (login) => login.token_id !== token
  );

  await student.save({ validateBeforeSave: false });

  const loggedInUsers = student.loginActivity;

  res.status(200).json({
    success: true,
    loggedInUsers,
  });
});

// ----------------------------------------- DELETE A STUDENT --------------------------------------------------------

exports.deleteStudent = catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findById(req.user.id);

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  await student.remove();

  res.status(200).json({
    success: true,
    message: "Student deleted successfully",
  });
});

//   --------------------------------------------- get students by college id --------------------------------------------

exports.getStudentsByCollegeId = catchAsyncErrors(async (req, res, next) => {

  let students;
  if (req.user.role === "college") {
    students = await Student.find({ CollegeId: req.user.id });
  } else {
    students = await Student.find({ universityId: req.user.id });
  }

  console.log(students);

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
  // res.cookie("token", null, {
  //   expires: new Date(Date.now()),
  //   httpOnly: true,
  // });

  const student = await Student.findById(req.user.id);

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }
  const token = req.header("auth-token");

  student.loginActivity?.forEach((login) => {
    console.log(login.token_id === token, login.token_id, token);
    if (login.token_id === token) {
      login.token_deleted = true;
    }
  });
  student.qrVerify = false;
  // console.log(student.loginActivity);

  await student.save({ validateBeforeSave: false });

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
  const recentJobs = await Job.find()
    .populate("company")
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    jobs: recentJobs,
  });
});

// -- RECOMMENDED JOBS

exports.getRecommendedJobs = catchAsyncErrors(async (req, res, next) => {
  const studentId = req.user.id;

  // get the student's skills for the studentId
  const student = await Student.findById(studentId).select("Skills");

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  //using the student's software knowledge to find recommended jobs
  const recommendedJobs = await Job.find({
    "Skills.SoftwareKnowledge": { $in: student.Skills.SoftwareKnowledge },
  });

  res.status(200).json({
    success: true,
    jobs: recommendedJobs,
  });
});
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
