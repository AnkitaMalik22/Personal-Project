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
const CollegeAssessInv = require("../../models/student/assessmentInvitation");

// student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
//   email: { type: String },
//   assessments: [
//     {
//       active: { type: Boolean },
//       sender: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
//       assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessments" },
//     },
// {
//       active: { type: Boolean },
//       sender: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
//       assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessments" },
//     },
//   ],

// @route   GET TEST FOR STUDENT
// STUDENT ID , TEST ID

// ===================================================| Get Tests For Student |========================================================

// route  : /api/student/test
// method : get
// desc   : gets all assessments for a student

exports.getTestsForStudent = catchAsyncErrors(async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const student = await CollegeAssessInv.findOne({
      student: studentId,
    })
      .populate({
        path: "assessments.assessment",

        // deselect: "",

        select: "-topics -studentResponses -totalQuestionsCount",
      })
      .populate({
        path: "assessments.sender",
        select: "CollegeName Email _id",
      });

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    res.status(200).json({
      success: true,
      assessments: student.assessments,
      message: "Test found",
    });
  } catch (error) {
    console.log(error);
  }
});

// ===================================================| Get Test For Student |========================================================

// route  :/api/student/test/:id
// method : get
// desc   : get assessment by id
exports.getTestDetailsForStudent = catchAsyncErrors(async (req, res, next) => {
  try {
    const { testId } = req.params;
    const studentId = req.user.id;
    const student = await CollegeAssessInv.findOne({
      student: studentId,
    }).populate({
      path: "assessments.assessment",

      // deselect: "",

      select: "-studentResponses -totalQuestionsCount -topics",
    });

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const assessment = student.assessments.find(
      (assessment) => assessment.assessment._id == testId
    );

    if (!assessment) {
      return next(new ErrorHandler("test not found", 404));
      // status(404)
      // .json({ success: false, message: "Test not found" });
    }
    res.status(200).json({
      success: true,
      assessment,
      message: "Test found",
    });
  } catch (error) {
    console.log(error);
  }
});

// const collegeAssessInvSchema = new mongoose.Schema({
//   student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
//   email: { type: String },
//   assessments: [
//     {
//       active: { type: Boolean },
//       onGoingAssessment: { type: String },

//       completed: { type: Boolean },
//       completedAt: { type: Date },
//       startedAt: { type: Date },
//       sender: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
//       assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessments" },
//     },
//   ],
// });

exports.startAssessment = catchAsyncErrors(async (req, res, next) => {
  const { testId, studentId, timeout } = req.params;

  const student = await CollegeAssessInv.findOne({
    student: studentId,
    // "assessments.assessment": testId // Include testId in the query
  }).populate("assessments.assessment");

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  const assessment = student.assessments.find(
    (assessment) => assessment._id.toString() === testId
  );

  if (!assessment) {
    return next(new ErrorHandler("Test not found", 404));
  }

  if (student.active) {
    return next(new ErrorHandler("Assessment already started", 404));
  }

  student.OnGoingAssessment = testId;
  student.active = true;
  student.startedAt = Date.now();

  await student.save();

  // // Simulate a timeout
  // setTimeout(() => {
  //   student.OnGoingAssessment = null;
  //   student.active = false;
  //   student.completed = true;
  //   student.completedAt = Date.now();
  //   student.save();

  //   res.status(200).json({ message: "Test Timeout completed" });

  // }, timeout * 1000);

  res.json({
    success: true,
    message: "Assessment started",
    data: {
      assessment,
      student,
    },
  });
});

exports.endTestAfterTimeout = catchAsyncErrors(async (req, res, next) => {
  const { testId, studentId } = req.params;
  const timeout = req.body.timeout;

  const student = await CollegeAssessInv.findOne({
    student: studentId,
    OnGoingAssessment: testId, // Check if the assessment is ongoing
  }).populate("assessments.assessment");

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  const assessment = student.assessments.find(
    (assessment) => assessment._id.toString() === testId
  );

  if (!assessment) {
    return next(new ErrorHandler("Test not found", 404));
  }

  if (!student.active) {
    return next(new ErrorHandler("Assessment not started", 404));
  }

  // Clear the ongoing assessment
  student.OnGoingAssessment = null;
  student.active = false;
  student.completed = true;
  student.completedAt = Date.now();
  await student.save();

  // Simulate a timeout
  setTimeout(() => {
    return res.status(200).json({ message: "Timeout completed" });
  }, timeout * 1000);

  return;
});

//  after the time is over client will send the request to end the assessment

// ===================================================| End Assessment Manually by ID |========================================================

exports.endAssessment = catchAsyncErrors(async (req, res, next) => {
  const { testId, studentId, timeout } = req.params;

  const student = await CollegeAssessInv.findOne({
    student: studentId,
    "assessments.assessment": testId, // Include testId in the query
  }).populate("assessments.assessment");

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  const assessment = student.assessments.find(
    (assessment) => assessment.assessment._id.toString() === testId
  );

  if (!assessment) {
    return next(new ErrorHandler("Test not found", 404));
  }

  if (student.OnGoingAssessment) {
    return next(new ErrorHandler("Assessment already started", 404));
  }

  student.OnGoingAssessment = null;
  student.active = false;
  student.completed = true;
  student.completedAt = Date.now();

  await student.save();

  res.json({
    success: true,
    message: "Assessment Ended",
    data: {
      assessment,
      student,
    },
  });
});

// --------------- send question to student ----------------
//  send assessment > topic1 > question1
// get the student response and save it in the  assessment.response.topic1.question1 = response
// if answer is correct then save the marks in the assessment.marks = marks
// if student completed 1/3 % of the topic and correct 1/3 % of the question then save the level = 1
