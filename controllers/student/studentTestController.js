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
const Assessments = require("../../models/college/assessment/assessments");
const { isBefore, isAfter } = require("date-fns");

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

    const student = await CollegeAssessInv.findOne({ student: studentId })
      .populate({
        path: "assessments.assessment",
        select:
          "name description createdAt  totalMarks totalAttempts startDate endDate topics level",
      })
      .populate({
        path: "assessments.sender",
        select: "CollegeName Email _id avatar Address",
      });

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const filteredAssessments = student.assessments
      .filter((assess) => assess.assessment)
      .sort(
        (a, b) =>
          new Date(b.assessment.createdAt) - new Date(a.assessment.createdAt)
      );

    res.status(200).json({
      success: true,
      assessments: filteredAssessments,
      message: "Tests found",
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Error fetching tests", 500));
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
    })
      .populate({
        path: "assessments.assessment",

        // deselect: "",

        select: "-totalQuestionsCount",
      })
      .populate("assessments.sender");

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }
    console.log(student);
    let assessment = student.assessments.find((assessment) => {
      if (assessment.assessment !== null) {
        if (assessment.assessment._id.toString() === testId) return true;
      }
      return false;
    });

    assessment?.assessment?.topics?.forEach((topic, index) => {
      assessment.assessment.topics[index] = {
        ...assessment.assessment.topics[index],
        questions: [],
        _id: "wrongId",
      };
    });

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

// ================================================= START ASSESSMENT =====================================================

exports.startAssessment = catchAsyncErrors(async (req, res, next) => {
  try {
    const { testId, timeout } = req.params;
    const { adaptive } = req.query;

    console.log("isAdaptive", adaptive);
    const studentId = req.user.id;
    console.log("test:" + testId + "student:" + studentId);

    const student = await CollegeAssessInv.findOne({
      student: studentId,
      // "assessments.assessment": testId // Include testId in the query
    }).populate("assessments.assessment");

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const assessment = student.assessments.find(
      (assessment) => assessment?.assessment?._id?.toString() === testId
    );

    const test = await Assessments.findById(testId);

    console.log(test.topics[0], "comp");
    // console.log(assessment);
    console.log(test.totalAttempts, test.name);

    if (!assessment) {
      return next(new ErrorHandler("Test not found", 404));
    }

    if (student.active) {
      return next(new ErrorHandler("Assessment already started", 404));
    }
    if (assessment.assessment.totalAttempts < assessment.attempts) {
      console.log(test.totalAttempts, assessment.attempts);
      return next(new ErrorHandler("test attempts exceeded", 429));
    }
    // ---------------------  CHECK IF TEST STARTED/ENDED-------------------

    // Convert start date, end date, and current date to Date objects
    const startDate = new Date(assessment.assessment.startDate);
    startDate.setHours(startDate.getHours() - 5);
    startDate.setMinutes(startDate.getMinutes() - 30);
    const startDateString = startDate.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    const endDate = new Date(assessment.assessment.endDate);
    endDate.setHours(endDate.getHours() - 5);
    endDate.setMinutes(endDate.getMinutes() - 30);
    const endDateString = endDate.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    const now = new Date();
    const nowString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    let testStatus;

    // console.log("Start Date: ", startDateString, typeof startDateString);
    // console.log("End Date: ", endDateString, typeof endDateString);
    // console.log("Current Date: ", nowString, typeof nowString);

    // Check if the current date is before the start date
    if (isBefore(nowString, startDateString)) {
      testStatus = false;
      return next(new ErrorHandler("Test not started yet", 404));
    }
    // Check if the current date is after the end date
    else if (isAfter(nowString, endDateString)) {
      testStatus = false;
      return next(new ErrorHandler("Test Ended", 404));
    }
    // Otherwise, the test is ongoing
    else {
      testStatus = true;
    }

    console.log("Test Status: ", testStatus);

    // if(!testStatus){

    // }
    // ---------------------------------------------------------------------
    student.OnGoingAssessment = testId;
    assessment.active = true;
    assessment.startedAt = Date.now();
    assessment.attempts += 1;
    assessment.currentQuestionIndex = 0;
    assessment.currentTopicIndex = 0;
    assessment.totalQuestionsAttempted = 0;
    assessment.totalStudentAttempted = 0;
    assessment.currentTopicMarks = 0;
    assessment.correctAnswers = 0;
    assessment.percentage = 0;
    assessment.marks = 0;
    assessment.L1Correct = 0;
    assessment.L2Correct = 0;
    assessment.L3Correct = 0;
    assessment.negativeCount = 0;

    await student.save();

    // // Simulate a timeout
    // setTimeout(() => {
    //   student.OnGoingAssessment = null;
    //   student.active = false;
    //   student.completed = true;
    //   student.completedAt = Date.now();
    //   student.save();
    // // Simulate a timeout
    // setTimeout(() => {
    //   student.OnGoingAssessment = null;
    //   student.active = false;
    //   student.completed = true;
    //   student.completedAt = Date.now();
    //   student.save();

    //   res.status(200).json({ message: "Test Timeout completed" });
    //   res.status(200).json({ message: "Test Timeout completed" });

    // }, timeout * 1000);
    // }, timeout * 1000);

    const topicNames = assessment.assessment.topics.map(
      (topic) => topic.Heading
    );

    const isAdaptive = adaptive === "true";

    const studentResponse = await StudentResponse.create({
      studentId: studentId,
      assessmentId: testId,
      topics: assessment.assessment.topics,
      attempt: assessment.attempts,
      marks: assessment.assessment.totalMarks,
      time: assessment.assessment.totalTime,
      testType: isAdaptive ? "adaptive" : "non-adaptive", //but setting adaptive
    });

    console.log(studentResponse.testType); //false

    assessment.response = studentResponse._id;
    test.studentResponses.push(studentResponse._id);
    // -------------------------------------------------------
    const std = await Student.findById(studentId);
    std.studentResponses.push(studentResponse._id);

    await std.save();
    // -------------------------------------------------------
    await test.save();

    await student.save();

    // await studentResponse.save();

    // send the first question

    if (isAdaptive) {
      const firstQuestion = assessment.assessment.topics[0].questions[0];
      console.log(firstQuestion);
      res.json({
        success: true,
        message: "Assessment started",
        count: 1,
        topic: { ...assessment.assessment.topics[0], questions: [] },
        isAdaptive: true,
        testId,
        topicNames,
        topicIndex: 0,
        firstQuestion: assessment.assessment.topics[0].questions[0],
        totalTime: assessment.assessment.totalTime,
        // studentResponse
      });
    } else {
      // check which type of test it is
      const type = assessment.assessment.topics[0].Type;
      let firstQuestion = {};
      if (type === "mcq") {
        firstQuestion = assessment.assessment.topics[0].questions[0];
      } else if (type === "findAnswer") {
        firstQuestion = assessment.assessment.topics[0].findAnswers[0];
      } else if (type === "essay") {
        firstQuestion = assessment.assessment.topics[0].essay[0];
      } else if (type === "video") {
        firstQuestion = assessment.assessment.topics[0].video[0];
      } else if (type === "compiler") {
        console.log("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
        firstQuestion = assessment.assessment.topics[0].compiler[0];
      }

      res.json({
        success: true,
        message: "Assessment started",
        count: 1,
        firstQuestion,
        topicNames,
        isAdaptive: false,
        testId,
        topicIndex: 0,
        topic: { ...assessment.assessment.topics[0] },
        data: {
          assessment,
          // student,
        },
        totalTime: assessment.assessment.totalTime,
        // studentResponse
      });
    }
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Error starting assessment", 500));
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
  try {
    const { testId, timeout } = req.params;
    const { timeTaken } = req.body;

    const studentId = req.user.id;

    const student = await CollegeAssessInv.findOne({
      student: studentId,
      "assessments.assessment": testId, // Include testId in the query
    }).populate("assessments.assessment");

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    let assessment = student.assessments.find((assessment) => {
      if (assessment.assessment !== null) {
        if (assessment.assessment._id.toString() === testId) return true;
      }
      return false;
    });

    if (!assessment) {
      return next(new ErrorHandler("Test not found", 404));
    }

    if (student.OnGoingAssessment) {
      return next(new ErrorHandler("Assessment already started", 404));
    }

    // ------------------------------------------------

    const studentResponse = await StudentResponse.findOne({
      studentId: studentId,
      assessmentId: testId,
      attempt: assessment.attempts,
    }).populate("assessmentId");

    if (!studentResponse) {
      return next(new ErrorHandler("Student response not found", 404));
    }

    // studentResponse.totalMarks = assessment.marks;
    let totalMarks = parseFloat(assessment.assessment.totalMarks) || 0;
    let marks = parseFloat(assessment.marks) || 0;

    if (totalMarks > 0) {
      studentResponse.percentage = (marks / totalMarks) * 100;
    } else {
      studentResponse.percentage = 0;
    }

    studentResponse.totalMarks = marks;
    studentResponse.completed = true;
    studentResponse.completedAt = Date.now();
    studentResponse.totalQuestionsAttempted = assessment.totalStudentAttempted;
    studentResponse.timeTaken = timeTaken;
    studentResponse.correctAnswers = assessment.correctAnswers;
    // studentResponse.percentage =
    //   (assessment.marks / studentResponse.assessmentId.totalMarks) * 100;
    // studentResponse.totalQuestionsAttempted = assessment.totalStudentAttempted;
    // studentResponse.timeTaken = timeTaken;
    // studentResponse.correctAnswers = assessment.correctAnswers;
    // studentResponse.percentage =
    //   (assessment.marks / studentResponse.assessmentId.totalMarks) * 100;

    await studentResponse.save();

    // ---------------------------------------------
    assessment.active = false;
    assessment.completed = true;
    assessment.completedAt = Date.now();
    assessment.currentQuestionIndex = 0;
    assessment.currentTopicIndex = 0;
    assessment.totalQuestionsAttempted = 0;
    assessment.correctAnswers = 0;
    assessment.totalStudentAttempted = 0;
    assessment.marks = 0;
    assessment.percentage = 0;
    assessment.L1Correct = 0;
    assessment.L2Correct = 0;
    assessment.L3Correct = 0;
    await student.save();

    // --------------------- update the avgPercentage of the assessment -------------------

    const test = await Assessments.findById(testId).populate(
      "studentResponses"
    );
    let avgPercentage = test.avgPercentage;

    // duplicate student responses remove
    // let studentResponses = test.studentResponses.map((response) => response.studentId);

    let totalStudentResponses = test.studentResponses.length;
    let totalPercentage = 0;
    console.log("ending");
    test.studentResponses?.forEach((response) => {
      // console.log(response.percentage, response, "response");
      totalPercentage += response.percentage;
    });

    avgPercentage = totalPercentage / totalStudentResponses;
    test.avgPercentage = avgPercentage;
    await test.save();

    // -------------------------------------------------------------------------------------

    res.json({
      success: true,
      message: "Assessment Ended",
      data: {
        studentResponse: studentResponse,
      },
      // data: {
      //   assessment,
      //   student,
      // },
    });
  } catch (error) {
    console.log(error);
  }
});

// =============================================== ADAPTIVE || SEND STUDENT RESPONSE AND GET NEXT QUESTION ==============================

// route  :/api/student/test/response/:testId
// method :get

exports.sendResponse = catchAsyncErrors(async (req, res, next) => {
  try {
    //  console.log("caalling adaptive.....")
    const { testId } = req.params;
    const { response, timeTaken } = req.body;

    // console.log(response);
    const studentId = req.user.id;
    const student = await CollegeAssessInv.findOne({
      student: studentId,
    }).populate("assessments.assessment");
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const assessment = student.assessments.find(
      (assessment) => assessment.assessment?._id.toString() === testId
    );
    // console.log(assessment.assessment.totalAttempts, assessment.attempts);

    // ------------------- assessment started  or not ---------------------

    if (!assessment) {
      console.log("Assessment not found");
      return next(new ErrorHandler("Assessment not found", 404));
    }
    const studentResponse = await StudentResponse.findOne({
      studentId: studentId,
      assessmentId: testId,
      attempt: assessment.attempts,
    });
    if (!assessment.active) {
      return next(new ErrorHandler("Assessment not started", 404));
    }
    // ---------------------------------------------------------------------

    const questionIndex = assessment.currentQuestionIndex;
    const topicIndex = assessment.currentTopicIndex;

    if (!assessment) {
      return next(new ErrorHandler("Test not found", 404));
    } // return res.send(assessment)

    // ========== IF NO NEXT TOPIC FOUND END THE TEST ==========
    const topic = assessment.assessment?.topics[topicIndex];
    if (!topic) {
      assessment.currentTopicIndex = 0;
      assessment.currentQuestionIndex = 0;
      assessment.currentTopicMarks = 0;
      assessment.active = false;
      assessment.totalStudentAttempted = 0;
      assessment.totalQuestionsAttempted = 0;
      assessment.correctAnswers = 0;
      assessment.marks = 0;
      assessment.percentage = 0;
      assessment.L1Correct = 0;
      assessment.L2Correct = 0;
      assessment.L3Correct = 0;
      await student.save();
      console.log("All topics completed 1");

      // return next(new ErrorHandler("Topic not found", 404));
      return res.json({
        success: true,
        message: "Test Completed",
      });
    }
    // ==========================================================
    //find the question from topic
    const question = topic.questions[questionIndex];
    console.log("question", questionIndex);
    if (!question) {
      return next(new ErrorHandler("Question not found", 404));
    }

    console.log(
      "Question",
      question.AnswerIndex,
      response,
      question.AnswerIndex === parseInt(response),
      question.Title
    );
    //----------------------------------------------------------handle marks -------------------------------------------------------------------------------//
    if (parseInt(question.AnswerIndex) === parseInt(response)) {
      console.log("Correct Answer");
      assessment.correctAnswers += 1;
      if (question.QuestionLevel === "beginner") {
        assessment.marks += 1;
        assessment.L1Correct += 1;
        assessment.currentTopicMarks += 1;

        console.log("L1 correct", assessment.marks);
      } else if (question.QuestionLevel === "intermediate") {
        assessment.marks += 2;
        assessment.L2Correct += 1;
        assessment.currentTopicMarks += 2;
        console.log("L2 correct", assessment.marks);
        // console.log("L2 correct", assessment.L2Correct);
      } else if (question.QuestionLevel === "advanced") {
        assessment.marks += 3;
        assessment.L3Correct += 1;
        assessment.currentTopicMarks += 3;
        console.log("L3 correct", assessment.marks);
        // console.log("L3 correct", assessment.L3Correct);
      }
    } else {
      if (assessment.negativeCount === 3) {
        assessment.marks -= 1;
        assessment.negativeCount = 0;
        assessment.currentTopicMarks -= 1;
      } else {
        assessment.negativeCount += 1;
      }
    }
    await student.save();

    studentResponse.topics[topicIndex].totalMarks =
      assessment.currentTopicMarks;
    await studentResponse.save();
    // console.log(
    //   studentResponse.topics[topicIndex].totalMarks,
    //   "topic marks  totla"
    // );
    // assessment.save();
    // console.log("Marks", assessment.marks ,question.AnswerIndex, response,question.AnswerIndex === parseInt(response))  ;
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
    let totalCompleted = assessment.totalQuestionsAttempted;
    let nextQuestion = topic.questions[questionIndex + 1];
    assessment.totalQuestionsAttempted += 1;
    assessment.totalStudentAttempted += 1;

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
    let check = false;
    // console.log(
    //   "All questions completed ",
    //   assessment.totalQuestionsAttempted,
    //   topic.totalL1Question
    // );
    // totalL1question = l1correct + l2correct + l3correct
    // console.log(
    //   "All questions completed ",
    //   assessment.totalQuestionsAttempted,
    //   topic.totalL1Question
    // );
    if (assessment.totalQuestionsAttempted >= topic.totalL1Question) {
      // console.log(
      //   "All questions completed ",
      //   assessment.totalQuestionsAttempted,
      //   topic.totalL1Question
      // );
      // Move to the next topic if the student has answered all questions for the current topic
      const nextTopicIndex = topicIndex + 1;
      if (nextTopicIndex < assessment.assessment?.topics.length) {
        nextQuestion =
          assessment.assessment?.topics[nextTopicIndex].questions[0];
      }
      assessment.totalQuestionsAttempted = 0;
      assessment.currentQuestionIndex = 0;
      // console.log("currentTopicIndex before", nextTopicIndex);
      assessment.currentTopicIndex = nextTopicIndex;
      assessment.currentTopicMarks = 0;

      // console.log("currentTopicIndex after", assessment.currentTopicIndex);

      // ----------------------
      assessment.L1Correct = 0;
      assessment.L2Correct = 0;
      assessment.L3Correct = 0;
      check = true; // reset the L1, L2, L3 correct count
      if (
        assessment.assessment.topics.length <
        assessment.currentTopicIndex + 1
      ) {
        // console.log("All topics completed");
        assessment.currentTopicIndex = 0;
        assessment.active = false;
        await student.save();

        // ------------------------------------------ STUDENT MARKS SAVE ------------------------------------------------
        const studentResponse = await StudentResponse.findOne({
          studentId: studentId,
          assessmentId: testId,
          attempt: assessment.attempts,
        });

        studentResponse.totalMarks = assessment.marks;
        studentResponse.completed = true;
        studentResponse.completedAt = Date.now();
        studentResponse.totalQuestionsAttempted =
          assessment.totalStudentAttempted;
        studentResponse.timeTaken = timeTaken;
        studentResponse.correctAnswers = assessment.correctAnswers;
        studentResponse.percentage =
          (assessment.marks / assessment.assessment.totalMarks) * 100;
        console.log("student marks", assessment.marks);
        // Fix : saving the last question response
        studentResponse.topics[topicIndex].questions[
          questionIndex
        ].StudentAnswerIndex = response;
        await studentResponse.save();
        // ------------------------------------------ STUDENT MARKS SAVE ------------------------------------------------
        console.log("All topics completed 2");
        // --------------------- update the avgPercentage of the assessment -------------------
        const test = await Assessments.findById(testId).populate(
          "studentResponses"
        );
        let avgPercentage = test.avgPercentage;

        // duplicate student responses remove
        // let studentResponses = test.studentResponses.map((response) => response.studentId);

        let totalStudentResponses = test.studentResponses.length;
        let totalPercentage = 0;

        test.studentResponses?.forEach((response) => {
          totalPercentage += response.percentage;
        });

        avgPercentage = totalPercentage / totalStudentResponses;
        test.avgPercentage = avgPercentage;
        await test.save();

        // -------------------------------------------------------------------------------------
        return res.json({
          success: true,
          message: "Test Completed 482",
        });
        //send res
      }

      // ----------------------------
    }

    //------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------

    if (
      assessment.L1Correct >= topic.L1count &&
      assessment.L2Correct < topic.L2count &&
      assessment.L3Correct < topic.L3count
    ) {
      // console.log("All L1 questions completed ");
      // Send the same topic level 2 questions if the student has achieved the required marks for level 1
      const nextQuestionIndex = topic.totalL1Question + assessment.L2Correct;
      console.log("Next question index L2 ", nextQuestionIndex);

      if (nextQuestionIndex < topic.questions.length) {
        nextQuestion = topic.questions[nextQuestionIndex];
      }
      assessment.currentQuestionIndex = nextQuestionIndex;
    } else if (
      assessment.L1Correct >= topic.L1count &&
      assessment.L2Correct >= topic.L2count &&
      assessment.L3Correct < topic.L3count
    ) {
      // console.log("All L2 questions completed ");
      // Send the same topic level 3 questions if the student has achieved the required marks for level 2
      const nextQuestionIndex =
        topic.totalL1Question + topic.totalL2Question + assessment.L3Correct;
      console.log("Next question index L3 ", nextQuestionIndex);
      if (nextQuestionIndex <= topic.questions.length) {
        // console.log("Next question index", nextQuestionIndex);
        nextQuestion = topic.questions[nextQuestionIndex];
        assessment.currentQuestionIndex = nextQuestionIndex;
      }
    } else if (assessment.L3Correct >= topic.L3count) {
      // console.log("All L3 questions completed ");
      // Send the next topic level 1 questions if the student has achieved the required marks for level 3
      const nextTopicIndex = topicIndex + 1;
      if (nextTopicIndex < assessment.assessment.topics.length) {
        nextQuestion =
          assessment.assessment.topics[nextTopicIndex].questions[0];
        assessment.currentQuestionIndex = 0;
        assessment.currentTopicIndex = nextTopicIndex;
        assessment.totalQuestionsAttempted = 0;
        assessment.currentTopicMarks = 0;

        assessment.L1Correct = 0;
        assessment.L2Correct = 0;
        assessment.L3Correct = 0;

        // console.log("Next topic index l3", nextTopicIndex);
      }
      if (nextTopicIndex === assessment.assessment.topics.length) {
        if (nextTopicIndex === assessment.assessment.topics.length) {
          // ------------------------------------------ STUDENT MARKS SAVE ------------------------------------------------
          const studentResponse = await StudentResponse.findOne({
            studentId: studentId,
            assessmentId: testId,
            attempt: assessment.attempts,
          });

          studentResponse.totalMarks = assessment.marks;
          studentResponse.completed = true;
          studentResponse.completedAt = Date.now();
          studentResponse.totalQuestionsAttempted =
            assessment.totalStudentAttempted;
          studentResponse.timeTaken = timeTaken;
          studentResponse.correctAnswers = assessment.correctAnswers;

          studentResponse.percentage =
            (assessment.marks / assessment.assessment.totalMarks) * 100;
          // console.log("student marks", assessment.marks);
          await studentResponse.save();
          // ------------------------------------------ STUDENT MARKS SAVE ------------------------------------------------
          // --------------------- update the avgPercentage of the assessment -------------------
          const test = await Assessments.findById(testId).populate(
            "studentResponses"
          );
          let avgPercentage = test.avgPercentage;

          // duplicate student responses remove
          // let studentResponses = test.studentResponses.map((response) => response.studentId);

          let totalStudentResponses = test.studentResponses.length;
          let totalPercentage = 0;

          test.studentResponses?.forEach((response) => {
            totalPercentage += response.percentage;
          });

          avgPercentage = totalPercentage / totalStudentResponses;
          test.avgPercentage = avgPercentage;
          await test.save();

          // -------------------------------------------------------------------------------------

          assessment.currentQuestionIndex = 0;
          assessment.currentTopicIndex = 0;
          assessment.totalQuestionsAttempted = 0;
          assessment.totalStudentAttempted = 0;
          assessment.correctAnswers = 0;
          assessment.currentTopicMarks = 0;
          assessment.L1Correct = 0;
          assessment.L2Correct = 0;
          assessment.L3Correct = 0;
          assessment.active = false;
          await student.save();

          // console.log("All topics completed");

          return res.json({
            success: true,
            message: "Test Completed",
          });
        }
      }
    } else if (!check) {
      //Check if topic switched or not
      // console.log("Next question");
      nextQuestion = topic.questions[questionIndex + 1];
      assessment.currentQuestionIndex = questionIndex + 1;
      // console.log(assessment.currentQuestionIndex, questionIndex);
    }

    // Return the next question to the client
    // return nextQuestion;  // await studentResponse.save();d

    // question with no correct

    // ======================================== STUDENT RESPONSE ==========================================
    //FIND THE STUDENT RESPONSE
    // console.log("attempts", assessment.attempts);

    // console.log(studentResponse);
    // UPDATE THE STUDENT RESPONSE
    studentResponse.topics[topicIndex].questions[
      questionIndex
    ].StudentAnswerIndex = response;

    console.log(
      studentResponse.topics[topicIndex].questions[questionIndex]
        .StudentAnswerIndex,
      "is the response"
    );

    // for showing result to student -- show attemted=== true questions
    studentResponse.topics[topicIndex].questions[
      questionIndex
    ].attempted = true;
    studentResponse.totalMarks = assessment.marks;

    studentResponse.totalQuestionsAttempted = assessment.totalStudentAttempted;
    studentResponse.correctAnswers = assessment.correctAnswers;
    const per = (assessment.marks / assessment.assessment.totalMarks) * 100;
    studentResponse.percentage = per || 0;
    studentResponse.timeTaken = timeTaken;

    // console.log(
    //   studentResponse.topics[topicIndex].questions[questionIndex]
    //     .StudentAnswerIndex
    // );

    await studentResponse.save();

    // console.log(studentResponse);

    // NOTE : SEND RESULT BY REMOVING QUESTIONS THAT HAS NO STUDENT ANS INDEX AS THE STUDENT HAS'NT ATTEMPTED

    // ==========================| NEXT QUESTION CORRECT ANS REMOVE |========================================
    nextQuestion = { ...nextQuestion, AnswerIndex: null };

    await student.save();

    // ================================================== RESPONSE ==========================================
    res.json({
      count: assessment.totalQuestionsAttempted + 1,
      success: true,
      message: "Question sent",
      questionIndex: questionIndex,
      nextQuestion: nextQuestion,
      topic: { Heading: topic.Heading, Type: topic.Type },
      topicIndex: topicIndex,
      studentResponse:
        studentResponse.topics[topicIndex].questions[questionIndex],
    });
    // ==================================================================================================
  } catch (error) {
    // console.log("Error", error);
  }
});

// ===============================================  NON ADAPTIVE || SEND STUDENT RESPONSE AND GET NEXT QUESTION ==============================

// exports.sendResponseNonAdaptive = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { testId } = req.params;
//     const { response } = req.body;

//     const studentId = req.user.id;
//     const student = await CollegeAssessInv.findOne({
//       student: studentId,
//     })
//       .populate("assessments.assessment")
//       .populate("assessments.assessment.questions")
//       .populate("assessments.assessment.findAnswers")
//       .populate("assessments.assessment.essay")
//       .populate("assessments.assessment.video")
//       .populate("assessments.assessment.compiler");

//     if (!student) {
//       return next(new ErrorHandler("Student not found", 404));
//     }

//     const assessment = student.assessments.find(
//       (assessment) => assessment.assessment?._id.toString() === testId
//     );

//     if (!assessment) {
//       return next(new ErrorHandler("Test not found", 404));
//     }

//     if (!assessment.active) {
//       return next(new ErrorHandler("Assessment not started", 404));
//     }
//     // total questions student attepted
//     assessment.totalStudentAttempted += 1;
//     const topicIndex = assessment.currentTopicIndex;
//     const topic = assessment.assessment?.topics[topicIndex];
//     const questionIndex = assessment.currentQuestionIndex;

//     if (!topic) {
//       assessment.currentTopicIndex = 0;
//       assessment.currentQuestionIndex = 0;
//       assessment.active = false;

//       await student.save();

//       // ------------------------------------------ STUDENT MARKS SAVE ------------------------------------------------
//       // const studentResponse = await StudentResponse.findOne({
//       //   studentId: studentId,
//       //   assessmentId: testId,
//       //   attempt: assessment.attempts,
//       // });

//       // studentResponse.totalMarks = assessment.marks;
//       // studentResponse.completed = true;
//       // studentResponse.completedAt = Date.now();
//       // console.log("time taken", timeTaken);
//       // studentResponse.timeTaken = timeTaken;
//       // console.log("student marks", assessment.marks);
//       // await studentResponse.save();
//       // ------------------------------------------ STUDENT MARKS SAVE ------------------------------------------------
//       // --------------------- update the avgPercentage of the assessment -------------------

//       const test = await Assessments.findById(testId).populate(
//         "studentResponses"
//       );
//       let avgPercentage = test.avgPercentage;

//       // duplicate student responses remove
//       // let studentResponses = test.studentResponses.map((response) => response.studentId);

//       let totalStudentResponses = test.studentResponses.length;
//       let totalPercentage = 0;

//       assessment.studentResponses?.forEach((response) => {
//         totalPercentage += response.percentage;
//       });
//       console.log("totalPercentage", totalPercentage);

//       avgPercentage = totalPercentage / totalStudentResponses;
//       console.log("avgPercentage", avgPercentage);
//       test.avgPercentage = avgPercentage;
//       await test.save();

//       // -------------------------------------------------------------------------------------

//       return res.json({
//         success: true,
//         message: "Test Completed -- No Next Topic Found",
//       });
//     }

//     let type = topic.Type;
//     let question = {};

//     if (type === "mcq") {
//       typeDir = "questions";
//     } else if (type === "findAnswer") {
//       typeDir = "findAnswers";
//     } else {
//       typeDir = type;
//     }

//     let nextQuestion = {};
//     const totalQuestions = topic[typeDir].length;
//     console.log(type, "is");
//     const studentResponse = await StudentResponse.findOne({
//       studentId: studentId,
//       assessmentId: testId,
//       attempt: assessment.attempts,
//     });

//     console.log("totalQuestionsAttempted");
//     switch (type) {
//       case "mcq":
//         studentResponse.topics[topicIndex].questions[
//           questionIndex
//         ].StudentAnswerIndex = parseInt(response);

//         console.log(
//           "mcq",
//           studentResponse.topics[topicIndex].questions[questionIndex]
//             .StudentAnswerIndex
//         );
//         break;
//       case "findAnswer":
//         // "response" : [
//         //   {

//         //     "studentAnswer": "The capital of France is Paris"
//         //   },
//         //   {

//         //     "studentAnswer": "The capital of Spain is Madrid"
//         //   }
//         // ]
//         if (response && response.length > 0) {
//           studentResponse.topics[topicIndex].findAnswers[
//             questionIndex
//           ].questions.forEach((ques, index) => {
//             ques.studentAnswer = response[index].studentAnswer;
//           });
//         } else {
//           studentResponse.topics[topicIndex].findAnswers[
//             questionIndex
//           ].questions.forEach((ques, index) => {
//             ques.studentAnswer = "";
//           });
//         }
//         console.log(
//           "findAnswer",
//           studentResponse.topics[topicIndex].findAnswers[questionIndex]
//             .questions
//         );

//         break;
//       case "essay":
//         // "response" : "The capital of France is Paris"
//         if (response) {
//           studentResponse.topics[topicIndex].essay[
//             questionIndex
//           ].studentAnswer = response;
//         } else {
//           studentResponse.topics[topicIndex].essay[
//             questionIndex
//           ].studentAnswer = "";
//         }
//         break;
//       case "video":
//         // "response" : {
//         //   "long": [
//         //     "The capital of France is Paris",
//         //     "The capital of Spain is Madrid"
//         //   ],
//         //   "short": [
//         //     "The capital of France is Paris",
//         //     "The capital of Spain is Madrid"
//         //   ],
//         //   "mcq": [
//         //     0,
//         //     1
//         //   ]

//         studentResponse.topics[topicIndex].video[questionIndex].long.forEach(
//           (long, index) => {
//             // long = response.long[index];
//             long.studentAnswer = response.long[index];
//           }
//         );
//         studentResponse.topics[topicIndex].video[questionIndex].short.forEach(
//           (short, index) => {
//             short.studentAnswer = response.short[index];
//           }
//         );
//         studentResponse.topics[topicIndex].video[
//           questionIndex
//         ].questions.forEach((mcq, index) => {
//           mcq.StudentAnswerIndex = response.mcq[index];
//         });

//         break;
//       case "compiler":
//         // "response" : [
//         //   {
//         //     "studentOutput": "Hello World"
//         //   },
//         //   {
//         //     "studentOutput": "Hello World"
//         //   }
//         // ]

//         studentResponse.topics[topicIndex].compiler[
//           questionIndex
//         ].testcase.forEach((testcase, index) => {
//           testcase.studentOutput = response[index];
//         });
//         break;
//       default:
//         break;
//     }

//     studentResponse.totalQuestionsAttempted += 1;
//     studentResponse.correctAnswers = assessment.correctAnswers;
//     studentResponse.totalMarks = assessment.marks;
//     studentResponse.topics[topicIndex].totalMarks =
//       assessment.currentTopicMarks;
//     studentResponse.percentage =parseInt((assessment.marks / assessment.assessment?.totalMarks) * 100);

//     await studentResponse.save();

//     //for one topic
//     assessment.totalQuestionsAttempted = assessment.totalQuestionsAttempted + 1;
//     console.log(assessment.totalQuestionsAttempted, totalQuestions);
//     if (assessment.totalQuestionsAttempted >= totalQuestions) {
//       assessment.currentQuestionIndex = 0;
//       assessment.currentTopicIndex = topicIndex + 1;
//       assessment.totalQuestionsAttempted = 0;
//       console.log("Next topic");

//       if (assessment.assessment.topics.length === topicIndex + 1) {
//         return res.status(200).json({ message: "test comp" });
//       }

//       type = assessment.assessment.topics[topicIndex + 1].Type;
//       if (type === "mcq") {
//         typeDir = "questions";
//       } else if (type === "findAnswer") {
//         typeDir = "findAnswers";
//       } else {
//         typeDir = type;
//       }
//       nextQuestion = assessment.assessment.topics[topicIndex + 1][typeDir][0];
//     } else {
//       assessment.currentQuestionIndex = questionIndex + 1;

//       nextQuestion =
//         assessment.assessment.topics[topicIndex][typeDir][questionIndex + 1];
//     }

//     await student.save();

//     res.json({
//       success: true,
//       message: "Question sent",
//       count: assessment.totalStudentAttempted + 1,
//       questionIndex: questionIndex,
//       topicIndex: topicIndex,
//       nextQuestion: nextQuestion,
//       topic: topic.Heading,
//       studentResponse: question,
//       result: studentResponse,
//     });
//   } catch (error) {
//     console.log("Error", error);
//   }
// });

exports.sendResponseNonAdaptive = catchAsyncErrors(async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { response } = req.body;
    const studentId = req.user.id;
    console.log("Non Adaptive Response");

    const student = await CollegeAssessInv.findOne({ student: studentId })
      .populate("assessments.assessment")
      .populate("assessments.assessment.questions")
      .populate("assessments.assessment.findAnswers")
      .populate("assessments.assessment.essay")
      .populate("assessments.assessment.video")
      .populate("assessments.assessment.compiler");

    if (!student) return next(new ErrorHandler("Student not found", 404));

    const assessment = student.assessments.find(
      (assessment) => assessment.assessment?._id.toString() === testId
    );
    if (!assessment) return next(new ErrorHandler("Test not found", 404));
    if (!assessment.active)
      return next(new ErrorHandler("Assessment not started", 404));

    assessment.totalStudentAttempted += 1;

    const topicIndex = assessment.currentTopicIndex;
    const topic = assessment.assessment?.topics[topicIndex];
    const questionIndex = assessment.currentQuestionIndex;

    if (!topic) {
      await completeAssessment(student, assessment, testId);
      return res.json({
        success: true,
        message: "Test Completed -- No Next Topic Found",
      });
    }

    const type = topic.Type;
    const typeDir = getTypeDir(type);

    let nextQuestion = {};
    const totalQuestions = topic[typeDir].length;

    const studentResponse = await StudentResponse.findOne({
      studentId: studentId,
      assessmentId: testId,
      attempt: assessment.attempts,
    });

    const question = topic[typeDir][questionIndex];
    if (type === "mcq") {
      calculateMcqMarks(assessment, question, response);
    } else if (type === "compiler") {
      calculateCodeMarks(assessment, question, response);
    }
    await student.save();
    await updateStudentResponse(
      studentResponse,
      type,
      topicIndex,
      questionIndex,
      response,
      assessment
    );
    await studentResponse.save();

    if (++assessment.totalQuestionsAttempted >= totalQuestions) {
      assessment.currentQuestionIndex = 0;
      assessment.currentTopicIndex = topicIndex + 1;
      assessment.totalQuestionsAttempted = 0;
      // assessment.topics[currentTopicIndex].totalMarks = 0;
      assessment.currentTopicMarks = 0;

      if (studentResponse.topics[topicIndex + 1]) {
        studentResponse.topics[topicIndex + 1].totalMarks = 0;
      }

      if (assessment.assessment.topics.length === topicIndex + 1) {
        await completeAssessment(student, assessment, testId);
        console.log("comp");
        return res.status(200).json({ message: "Test completed" });
      }

      const nextTopic = assessment.assessment.topics[topicIndex + 1];
      nextQuestion = nextTopic[getTypeDir(nextTopic.Type)][0];
    } else {
      assessment.currentQuestionIndex = questionIndex + 1;
      nextQuestion = topic[typeDir][questionIndex + 1];
    }

    await student.save();
    await assessment.save();

    res.json({
      success: true,
      message: "Question sent",
      count: assessment.totalStudentAttempted,
      questionIndex: questionIndex,
      topicIndex: topicIndex,
      nextQuestion: nextQuestion,
      topic: topic.Heading,
      studentResponse: response,
      result: studentResponse,
    });
  } catch (error) {
    console.log("Error", error);
  }
});

async function completeAssessment(student, assessment, testId) {
  assessment.currentTopicIndex = 0;
  assessment.currentQuestionIndex = 0;
  assessment.active = false;
  await student.save();

  const test = await Assessments.findById(testId).populate("studentResponses");
  const totalPercentage = test.studentResponses.reduce((acc, response) => {
    const percentage = parseInt(response.percentage);
    return acc + (isNaN(percentage) ? 0 : percentage);
  }, 0);

  console.log(totalPercentage, test.studentResponses.length);
  test.avgPercentage = totalPercentage / test.studentResponses.length;

  await test.save();

  const studentResponse = await StudentResponse.findOne({
    studentId: student.student,
    assessmentId: testId,
    attempt: assessment.attempts,
  }).populate("assessmentId");

  studentResponse.completed = true;
  studentResponse.completedAt = Date.now();
  studentResponse.totalMarks = studentResponse.assessmentId.marks;
  studentResponse.totalQuestionsAttempted =
    studentResponse.assessmentId.totalStudentAttempted;
  studentResponse.correctAnswers = studentResponse.assessmentId.correctAnswers;
  let per =
    (parseInt(studentResponse.marks) /
      parseInt(studentResponse.assessmentId.totalMarks)) *
    100;
  console.log(parseInt(per), "percentage");
  studentResponse.percentage = isNaN(parseInt(per)) ? 0 : parseInt(per);

  await studentResponse.save();
}

function getTypeDir(type) {
  switch (type) {
    case "mcq":
      return "questions";
    case "findAnswer":
      return "findAnswers";
    default:
      return type;
  }
}

function updateStudentResponse(
  studentResponse,
  type,
  topicIndex,
  questionIndex,
  response,
  assessment
) {
  const currentTopic = studentResponse.topics[topicIndex];
  console.log(studentResponse.topics[topicIndex].compiler);
  switch (type) {
    case "mcq":
      currentTopic.questions[questionIndex].StudentAnswerIndex =
        parseInt(response);
      break;
    case "findAnswer":
      currentTopic.findAnswers[questionIndex].questions.forEach(
        (ques, index) => {
          ques.studentAnswer = response[index]?.studentAnswer || "";
        }
      );
      break;
    case "essay":
      currentTopic.essay[questionIndex].studentAnswer = response || "";
      break;
    case "video":
      currentTopic.video[questionIndex].long.forEach((long, index) => {
        long.studentAnswer = response.long[index] || "";
      });
      currentTopic.video[questionIndex].short.forEach((short, index) => {
        short.studentAnswer = response.short[index] || "";
      });
      currentTopic.video[questionIndex].questions.forEach((mcq, index) => {
        mcq.StudentAnswerIndex = response.mcq[index] || "";
      });
      break;
    case "compiler":
      currentTopic.compiler[questionIndex].code = response.code;
      currentTopic.compiler[questionIndex].codeLanguage = response.codeLanguage;
      currentTopic.compiler[questionIndex].testcase = response.testcase;
      break;
  }

  studentResponse.totalQuestionsAttempted += 1;
  studentResponse.correctAnswers = assessment.correctAnswers;
  studentResponse.totalMarks = assessment.marks;
  currentTopic.totalMarks = assessment.currentTopicMarks;

  // Ensure marks are numbers and handle percentage calculation
  let totalMarks = parseFloat(assessment.assessment.totalMarks) || 0;
  let marks = parseFloat(assessment.marks) || 0;

  if (totalMarks > 0) {
    studentResponse.percentage = (marks / totalMarks) * 100;
  } else {
    studentResponse.percentage = 0;
  }
}

function calculateMcqMarks(assessment, question, response) {
  if (parseInt(question.AnswerIndex) === parseInt(response)) {
    assessment.correctAnswers += 1;
    const level = question.QuestionLevel;
    let marks = 0;
    if (level === "beginner") {
      marks = 1;
      assessment.L1Correct += 1;
    } else if (level === "intermediate") {
      marks = 2;
      assessment.L2Correct += 1;
    } else if (level === "advanced") {
      marks = 3;
      assessment.L3Correct += 1;
    }
    assessment.marks += marks;
    assessment.currentTopicMarks += marks;
    console.log(`${level} correct`, assessment.marks);
  } else {
    if (assessment.negativeCount === 3) {
      assessment.marks -= 1;
      assessment.negativeCount = 0;
      assessment.currentTopicMarks -= 1;
    } else {
      assessment.negativeCount += 1;
    }
  }
}

function calculateCodeMarks(assessment, question, response) {
  const level = question.QuestionLevel;
  let marks = 0;
  let totalCases = question.testcase.length;
  let passed = 0;
  let passedCount = 0;

  response.testcase.forEach((testcase) => {
    console.log(testcase);
    if (testcase.passed) {
      passedCount += 1;
    }
  });

  if (level === "beginner") {
    let passedValue = 10 / totalCases;
    marks = passedCount * passedValue;
    if (marks < 5) {
      marks = 0;
    } else {
      assessment.correctAnswers += 1;
    }
    // assessment.L1Correct += 1;
  } else if (level === "intermediate") {
    let passedValue = 20 / totalCases;
    marks = passedCount * passedValue;
    // assessment.L2Correct += 1;
    if (marks < 10) {
      marks = 0;
    } else {
      assessment.correctAnswers += 1;
    }
  } else if (level === "advanced") {
    let passedValue = 30 / totalCases;
    marks = passedCount * passedValue;
    if (marks < 15) {
      marks = 0;
    } else {
      assessment.correctAnswers += 1;
    }
    // assessment.L3Correct += 1;
  }
  assessment.marks += marks;
  assessment.currentTopicMarks += marks;
}
// ====================================== get student result ===================

exports.getStudentResult = catchAsyncErrors(async (req, res, next) => {
  const { testId, studentId } = req.params;

  // diff student response getting need to find by id

  const student = await StudentResponse.findOne({
    studentId,
    assessmentId: testId,
  });

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  const isAdaptive = student.testType === "adaptive";

  let response = student.topics.map((topic) => {
    switch (topic.Type) {
      case "mcq":
        return {
          topic: topic.Heading,
          type: "mcq",
          questions: topic.questions,
        };
        break;

      case "findAnswer":
        return {
          topic: topic.Heading,
          type: "findAnswer",
          questions: topic.findAnswers,
        };
        break;
      case "essay":
        return {
          topic: topic.Heading,
          type: "essay",
          questions: topic.essay,
        };
        break;
      case "video":
        return {
          topic: topic.Heading,
          type: "video",
          questions: topic.video,
        };
        break;
      case "compiler":
        return {
          topic: topic.Heading,
          type: "compiler",
          questions: topic.compiler,
        };
        break;
      default:
        break;
    }
  });

  // only calculating for mcq questions for now -- in adaptive
  let mcqMarks = 0;
  let codingMarks = 0;
  let totalMCQandCodingQuestions = 0;

  response.forEach((topic) => {
    if (topic.type === "mcq") {
      topic.questions.forEach((question) => {
        if (question.AnswerIndex === question.StudentAnswerIndex) {
          mcqMarks += 1;
        }
        totalMCQandCodingQuestions += 1;
      });
      // } else if (topic.type === "compiler") {
      //   topic.questions.forEach((question) => {
      //     if (
      //       question.testcase.every(
      //         (testcase) => testcase.studentOutput === testcase.output
      //       )
      //     ) {
      //       codingMarks += 1;
      //     }
      //     totalMCQandCodingQuestions += 1;
      //   });
    }
  });
  // totalMCQandCodingQuestions =
  student.totalMarks = mcqMarks + codingMarks;

  student.marks = mcqMarks + codingMarks;
  const percentage =
    ((mcqMarks + codingMarks) / totalMCQandCodingQuestions) * 100;
  student.percentage = percentage;
  student.mcqMarks = mcqMarks;
  student.codingMarks = codingMarks;
  // student.totalMarks = totalMCQandCodingQuestions;

  // student.studentResponses.push(student._id);
  // assessment.studentResponses.push(student._id);

  // if(student.avgPercentage ){
  //   assessment.avgPercentage = (assessment.avgPercentage + percentage) / assessment.studentResponses.length;
  //   }
  // if student.testType === adaptive then send this

  response = {
    ...response,
    mcqMarks,
    codingMarks,
    totalMCQandCodingQuestions,
    percentage,
    // student
  };

  res.json({
    success: true,
    message: "Student Result",
    response,
  });

  // if student.testType === non-adaptive then send this
});

// ============================================ ADD MARKS TO NON ADAPTIVE TEST  ============================================
exports.addMarks = catchAsyncErrors(async (req, res, next) => {
  const { testId, studentId } = req.params;

  const { marks, topicIndex, questionIndex } = req.body;

  const student = await StudentResponse.findOne({
    studentId,
    assessmentId: testId,
  });
  const topic = student.topics[topicIndex];

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  switch (topic.Type) {
    // case "mcq":
    //   student.topics[topicIndex].questions[questionIndex].marks = marks;
    //   break;
    case "findAnswer":
      student.topics[topicIndex].findAnswers[questionIndex].marks = marks;
      break;
    case "essay":
      student.topics[topicIndex].essay[questionIndex].marks = marks;
      break;
    case "video":
      // if(student.topics[topicIndex].video[questionIndex].long){
      //   student.topics[topicIndex].video[questionIndex].long.marks = marks;
      // }
      // if(student.topics[topicIndex].video[questionIndex].short){
      //   student.topics[topicIndex].video[questionIndex].short.marks = marks;
      // }
      // if(student.topics[topicIndex].video[questionIndex].questions){
      //   student.topics[topicIndex].video[questionIndex].questions.marks = marks;
      // }
      student.topics[topicIndex].video[questionIndex].marks = marks;

      break;
    // case "compiler":
    //   student.topics[topicIndex].compiler[questionIndex].marks = marks;
    //   break;
    default:
      break;
  }

  await student.save();
  // const mcqMarks = student.topics[topicIndex].questions.forEach((question) => question.marks);
  // const codingMarks = student.topics[topicIndex].compiler.forEach((question) => question.marks);
  // const totalMCQandCodingQuestions = mcqMarks.length + codingMarks.length;
  const findAnswerMarks = student.topics[topicIndex].findAnswers.forEach(
    (question) => question.marks
  );
  const essayMarks = student.topics[topicIndex].essay.forEach(
    (question) => question.marks
  );
  const videoMarks = student.topics[topicIndex].video.forEach(
    (question) => question.marks
  );

  const totalMarks = findAnswerMarks + essayMarks + videoMarks + student.marks;
  student.totalMarks += totalMarks;

  await student.save();

  res.json({
    success: true,
    message: "Marks added",
    totalMarks: student.totalMarks,
    student,
  });
});

// ============================================ ADD MARKS TO NON ADAPTIVE TEST  ============================================
exports.addMarks = catchAsyncErrors(async (req, res, next) => {
  const { testId, studentId } = req.params;

  const { marks, topicIndex, questionIndex } = req.body;

  const student = await StudentResponse.findOne({
    studentId,
    assessmentId: testId,
  });
  const topic = student.topics[topicIndex];

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  switch (topic.Type) {
    // case "mcq":
    //   student.topics[topicIndex].questions[questionIndex].marks = marks;
    //   break;
    case "findAnswer":
      student.topics[topicIndex].findAnswers[questionIndex].marks = marks;
      break;
    case "essay":
      student.topics[topicIndex].essay[questionIndex].marks = marks;
      break;
    case "video":
      // if(student.topics[topicIndex].video[questionIndex].long){
      //   student.topics[topicIndex].video[questionIndex].long.marks = marks;
      // }
      // if(student.topics[topicIndex].video[questionIndex].short){
      //   student.topics[topicIndex].video[questionIndex].short.marks = marks;
      // }
      // if(student.topics[topicIndex].video[questionIndex].questions){
      //   student.topics[topicIndex].video[questionIndex].questions.marks = marks;
      // }
      student.topics[topicIndex].video[questionIndex].marks = marks;

      break;
    // case "compiler":
    //   student.topics[topicIndex].compiler[questionIndex].marks = marks;
    //   break;
    default:
      break;
  }

  await student.save();
  // const mcqMarks = student.topics[topicIndex].questions.forEach((question) => question.marks);
  // const codingMarks = student.topics[topicIndex].compiler.forEach((question) => question.marks);
  // const totalMCQandCodingQuestions = mcqMarks.length + codingMarks.length;
  const findAnswerMarks = student.topics[topicIndex].findAnswers.forEach(
    (question) => question.marks
  );
  const essayMarks = student.topics[topicIndex].essay.forEach(
    (question) => question.marks
  );
  const videoMarks = student.topics[topicIndex].video.forEach(
    (question) => question.marks
  );

  const totalMarks = findAnswerMarks + essayMarks + videoMarks + student.marks;

  // await student.save();

  res.json({
    success: true,
    message: "Marks added",
    totalMarks: student.totalMarks,
    student,
  });
});

// ========================================= GET TOTAL APPEARED STUDENTS /TEST-ID ==============================================

const getTotalAppearedStudents = catchAsyncErrors(async (req, res, next) => {
  // Fetch student responses for the given studentId and testId
  const studentResponses = await StudentResponse.find({
    studentId: req.query.studentId,
    assessmentId: req.query.testId,
  });

  const assessment = await Assessments.findById(req.query.testId);

  if (assessment) {
    const appearedStudents = new Set(
      studentResponses.map((response) => response.studentId)
    );

    appearedStudents.forEach((studentId) => {
      if (!assessment?.appearedStudents?.includes(studentId)) {
        assessment?.appearedStudents?.push(studentId);
      }
    });

    await assessment.save();
  }

  res.status(200).json({
    success: true,
    studentResponses,
    totalAppearedStudents: studentResponses.length,
  });
});
