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
  const {adaptive} = req.query
  console.log(testId, studentId);

  const student = await CollegeAssessInv.findOne({
    student: studentId,
    // "assessments.assessment": testId // Include testId in the query
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
    assessmentId: testId,
    topics: assessment.assessment.topics,
  });

  // await studentResponse.save();

  // send the first question

 if(adaptive){
  res.json({
    success: true,
    message: "Assessment started",
    firstQuestion: assessment.assessment.topics[0].questions[0],
    // studentResponse
  });
 }else{
  
  res.json({
    success: true,
    message: "Assessment started",
    data: {
      assessment,
      student,
    },
  
    // studentResponse
  });
 }
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

// =============================================== ADAPTIVE || SEND STUDENT RESPONSE AND GET NEXT QUESTION ==============================

exports.sendResponse = catchAsyncErrors(async (req, res, next) => {
  try {
    const { testId, studentId } = req.params;
    const { response } = req.body;

    const student = await CollegeAssessInv.findOne({
      student: studentId,
    }).populate("assessments.assessment");
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const assessment = student.assessments.find(
      (assessment) => assessment.assessment._id.toString() === testId
    );

    // ------------------- assessment started  or not ---------------------

     if(!assessment.active){
      return next(new ErrorHandler("Assessment not started", 404));
     }
    // ---------------------------------------------------------------------

    const questionIndex = assessment.currentQuestionIndex;
    const topicIndex = assessment.currentTopicIndex;

    if (!assessment) {
      return next(new ErrorHandler("Test not found", 404));
    } // return res.send(assessment)

    // ========== IF NO NEXT TOPIC FOUND END THE TEST ==========
    const topic = assessment.assessment.topics[topicIndex];
    if (!topic) {
      // return next(new ErrorHandler("Topic not found", 404));
      return res.json({
        success: true,
        message: "Test Completed",
      });
    }
    // ==========================================================
    //find the question from topic
    const question = topic.questions[questionIndex];
    if (!question) {
      return next(new ErrorHandler("Question not found", 404));
    }

    //----------------------------------------------------------handle marks -------------------------------------------------------------------------------//
    if (question.AnswerIndex === response) {
      if (question.QuestionLevel === "beginner") {
        assessment.marks += 1;
        assessment.L1Correct += 1;
      } else if (question.QuestionLevel === "intermediate") {
        assessment.marks += 2;
        assessment.L2Correct += 1;
      } else if (question.QuestionLevel === "advanced") {
        assessment.marks += 3;
        assessment.L3Correct += 1;
      }
    } else {
      if (assessment.negativeCount === 3) {
        assessment.marks -= 1;
        assessment.negativeCount = 0;
      } else {
        assessment.negativeCount += 1;
      }
    }
    //-----------------------------------------------------------------------------------------------------------------------------------------------------//
    // Save the student's response
    // const studentResponse = await StudentResponse.findOneAndUpdate(
    //   {
    //     studentId,
    //     assessmentId: testId,
    //     "topics._id": topicId,
    //     "topics.questions.id": questionId,
    //   },
    //   {
    //     $set: {
    //       "topics.$.questions.$[ques].AnswerIndex": response,
    //     },
    //   },
    //   {
    //     arrayFilters: [{ "ques.id": questionId }],
    //     new: true,
    //   }
    // );

    let nextQuestion = topic.questions[0];
    assessment.totalQuestionsAttempted += 1;

    //check how many question have been attempted
    // if (
    //   assessment.totalQuestionsAttempted > assessment.assessment.totalL1Question
    // ) {
    //   // got to next topic
    //   //if next topic does not exist end test
    //   assessment.active = false;
    // }

    // ---------------------------------      All topics completed ----------------------------------------------------------------------------------------

    //-----------------check if student has attempted all questions from current topic --------------

    if (assessment.totalQuestionsAttempted > topic.totalL1Question) {
      console.log(
        "All questions completed 1",
        assessment.totalQuestionsAttempted,
        topic.totalL1Question
      );
      // Move to the next topic if the student has answered all questions for the current topic
      const nextTopicIndex = topicIndex + 1;
      if (nextTopicIndex < assessment.assessment.topics.length) {
        nextQuestion =
          assessment.assessment.topics[nextTopicIndex].questions[0];
      }
      assessment.totalQuestionsAttempted = 0;
      assessment.currentQuestionIndex = 0;
      assessment.currentTopicIndex += 1;
    }

    //------------------------------------------------------------------------------------------------------
    if (assessment.assessment.topics.length < student.currentTopicIndex) {
      console.log("All topics completed");
      res.json({
        success: true,
        message: "Test Completed",
      });
      assessment.active = false;
      //send res
    }
    //------------------------------------------------------------------------------------------------------


    if (
      assessment.L1Correct >= topic.L1count &&
      assessment.L2Correct < topic.L2count &&
      assessment.L3Correct < topic.L3count
    ) {
      console.log("All L1 questions completed ");
      // Send the same topic level 2 questions if the student has achieved the required marks for level 1
      const nextQuestionIndex = topic.totalL1Question + 1;
      if (nextQuestionIndex < topic.questions.length) {
        nextQuestion = topic.questions[nextQuestionIndex];
      }
      assessment.currentQuestionIndex = nextQuestionIndex;
    } else if (
      assessment.L2Correct >= topic.L2count &&
      assessment.L3Correct < topic.L3count
    ) {
      console.log("All L2 questions completed ");
      // Send the same topic level 3 questions if the student has achieved the required marks for level 2
      const nextQuestionIndex =
        topic.totalL1Question + topic.totalL2Question + 1;
      if (nextQuestionIndex < topic.questions.length) {
        nextQuestion = topic.questions[nextQuestionIndex];
        assessment.currentQuestionIndex = nextQuestionIndex;
      }
    } else if (assessment.L3Correct >= topic.L3count) {
      console.log("All L3 questions completed ");
      // Send the next topic level 1 questions if the student has achieved the required marks for level 3
      const nextTopicIndex = topicIndex + 1;
      if (nextTopicIndex < assessment.assessment.topics.length) {
        nextQuestion =
          assessment.assessment.topics[nextTopicIndex].questions[0];
        assessment.currentQuestionIndex = questionIndex + 1;
      }
    } else {
      nextQuestion = topic.questions[questionIndex + 1];
      assessment.currentQuestionIndex = questionIndex + 1;
      console.log(assessment.currentQuestionIndex, questionIndex);
    }

    // Return the next question to the client
    // return nextQuestion;  // await studentResponse.save();

    // question with no correct

    // ======================================== STUDENT RESPONSE ==========================================
    //FIND THE STUDENT RESPONSE
    const studentResponse = await StudentResponse.findOne({
      studentId: studentId,
      assessmentId: testId,
    });

    // UPDATE THE STUDENT RESPONSE
    studentResponse.topics[topicIndex].questions[
      questionIndex
    ].StudentAnswerIndex = response;

    await studentResponse.save();
    // console.log(studentResponse);

    // ==========================| NEXT QUESTION CORRECT ANS REMOVE |========================================
      nextQuestion = { ...nextQuestion, AnswerIndex: null };

      await student.save();
    // ================================================== RESPONSE ==========================================
    res.json({
      success: true,
      message: "Question sent",

      questionIndex: questionIndex,
      nextQuestion: nextQuestion,
      topic: topic.Heading,
      studentResponse:
        studentResponse.topics[topicIndex].questions[questionIndex],
    });
    // ==================================================================================================
  } catch (error) {
    console.log("Error", error);
  }
});


// ===============================================  NON ADAPTIVE || SEND STUDENT RESPONSE AND GET NEXT QUESTION ==============================

