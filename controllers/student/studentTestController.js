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
const StudentResponse = require("../../models/student/studentResponse");

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
exports.getTestsForStudent = catchAsyncErrors(async (req, res, next) => {
  try {
    const { studentId} = req.params;

    const student = await CollegeAssessInv.findOne({
      student: studentId,
      
    }).populate({
      path: "assessments.assessment",

      // deselect: "",

      select: "-topics -studentResponses -totalQuestionsCount"
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

exports.getTestDetailsForStudent = catchAsyncErrors(async (req, res, next) => {
  try {
    const { studentId, testId } = req.params;

    const student = await CollegeAssessInv.findOne({
      student: studentId,
      
    }).populate({
      path: "assessments.assessment",

      // deselect: "",

      select: "-studentResponses -totalQuestionsCount"
    });

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const assessment = student.assessments.find(
      (assessment) => assessment._id == testId
    );

    if (!assessment) {
      return next
        .status(404)
        .json({ success: false, message: "Test not found" });
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
  const { testId, studentId ,timeout } = req.params;

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

    const studentResponse = await StudentResponse.create({
      studentId: studentId,
      assessment: testId,
    });

    await studentResponse.save();
    res.json({
      success: true,
      message: "Assessment started",
      data: {
        assessment,
        student
      }
    });
  });

exports.endTestAfterTimeout = catchAsyncErrors(async (req, res, next) => {
  const { testId, studentId } = req.params;
  const timeout = req.body.timeout;

  const student = await CollegeAssessInv.findOne({
    student: studentId,
    OnGoingAssessment: testId // Check if the assessment is ongoing
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
  return  res.status(200).json({ message: "Timeout completed" });
  }, timeout * 1000);

return;

});


//  after the time is over client will send the request to end the assessment

// ===================================================| End Assessment Manually by ID |========================================================

exports.endAssessment = catchAsyncErrors(async (req, res, next) => {
  const { testId, studentId ,timeout } = req.params;

  const student = await CollegeAssessInv.findOne({
    student: studentId,
    "assessments.assessment": testId // Include testId in the query
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
// if answer is correct then save the marks in the assessment.marks += 1
// if answer is wrong then save the marks of the total marks in the assessment.marks -= 1
// untill marks reached 1/3 correct rate send the next question if questions end then send the next topic questions level 1
// if marks   1/3 all correct then send the next level 2 questions of the same topic
// until level 2 questions mark reached 1/3 correct rate and all level2 ended send the next topic questions level 
// 3 and so on untill all topics ended
// if all topics ended then send the result of the assessment
// if the student completed the assessment then save the completedAt date and time
// if the student completed the assessment then save the percentage of the assessment
// if the student completed the assessment then save the level of the assessment
// if the student completed the assessment then save the marks of the assessment
// if the student completed the assessment then save the assessment as completed
// if the student completed the assessment then save the assessment as not active
// if the student completed the assessment then save the assessment as not onGoingAssessment
// for each question api call the client will send the response of the student
// if level1 questions can't reach the marks send to next level 1


exports.sendQuestion = catchAsyncErrors(async (req, res, next) => {
  const { testId, studentId } = req.params;
  const {topicId, questionId, response} = req.body;

  // let topicL1marks = 0;
  // let topicL2marks = 0;
  // let topicL3marks = 0;

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

  const topic = assessment.assessment.topics.find(
    (topic) => topic._id.toString() === topicId
  );
  const totalL1Marks = topic.questions.find(
    (question) => question.level === 'beginner'
  ).length;
  const totalL2Marks = topic.questions.find(
    (question) => question.level === 'intermediate'
  ).length * 2;
  const totalL3Marks = topic.questions.find(
    (question) => question.level === 'advanced'
  ).length * 3;

  if (!topic) {
    return next(new ErrorHandler("Topic not found", 404));
  }

  const question = topic.questions.find(
    (question) => question._id.toString() === questionId
  );

  if (!question) {
    return next(new ErrorHandler("Question not found", 404));
  }

  if(question.AnswerIndex === response){
    assessment.marks += 1;
  }
  else{
    if(assessment.negativeCount === 3){
      assessment.marks -= 1;
      assessment.negativeCount = 0;
    }
    else{
      assessment.negativeCount += 1;
    }
  
  }

  


  const totalQuestions = assessment.totalQuestionsCount;
 
// total L1 correct rate 1/3% then send L2 questions

if(assessment.marks === totalL1Marks / 3){
  assessment.level = 2;
  assessment.marks = 0;
  assessment.totalL1Marks = totalL1Marks;
  await student.save();
  }

// save the response of the student
  const studentResponse = await studentResponse.findOne({
    student: studentId,
    assessment: testId,
  });
  const resTopic = studentResponse.response.find(
    (topic) => topic._id.toString() === topicId
  );
  const resQuestion = resTopic.questions.find(
    (question) => question._id.toString() === questionId
  );
  resQuestion.AnswerIndex = response;
  await studentResponse.save();

  await student.save();

  // if(assessment.marks >= topic % 3){
  // await student.save();
  // }

  res.json({
    success: true,
    message: "Question sent",
    data: {
      assessment,
      student,
    },
  });
});






