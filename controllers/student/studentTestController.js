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
    })
      .populate({
        path: "assessments.assessment",

        // deselect: "",

        select: "-studentResponses -totalQuestionsCount",
      })
      .populate("assessments.sender");

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    let assessment = student.assessments.find(
      (assessment) => assessment.assessment._id == testId
    );

    assessment.assessment.topics.forEach((topic, index) => {
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
  try {
    const { testId, timeout } = req.params;
    const { adaptive } = req.query;
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
    // console.log(assessment);

    if (!assessment) {
      return next(new ErrorHandler("Test not found", 404));
    }

    if (student.active) {
      return next(new ErrorHandler("Assessment already started", 404));
    }
    if (assessment.assessment.totalAttempts <= assessment.attempts) {
      return next(new ErrorHandler("test attempts exceeded", 429));
    }
    student.OnGoingAssessment = testId;
    assessment.active = true;
    assessment.startedAt = Date.now();
    assessment.attempts += 1;
    assessment.currentQuestionIndex = 0;
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

    const studentResponse = await StudentResponse.create({
      studentId: studentId,
      assessmentId: testId,
      topics: assessment.assessment.topics,
      attempt: assessment.attempts,
      testType: adaptive ? "adaptive" : "non-adaptive",
    });

    assessment.response = studentResponse._id;
    test.studentResponses.push(studentResponse._id);
// -------------------------------------------------------
    const std = await Student.findById(studentId);
    std.studentResponses.push(studentResponse._id);

    await std.save()
// -------------------------------------------------------
    await test.save();

    await student.save();

    // await studentResponse.save();

    // send the first question

    if (adaptive) {
      res.json({
        success: true,
        message: "Assessment started",
        count: 1,
        topic: { ...assessment.assessment.topics[0], questions: [] },
        firstQuestion: assessment.assessment.topics[0].questions[0],
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
        firstQuestion = assessment.assessment.topics[0].compiler[0];
      }

      res.json({
        success: true,
        message: "Assessment started",
        firstQuestion,
        data: {
          assessment,
          // student,
        },
        // studentResponse
      });
    }
  } catch (error) {
    console.log(error);
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

  assessment.active = false;
  assessment.completed = true;
  assessment.completedAt = Date.now();
  assessment.currentQuestionIndex = 0;
  assessment.currentTopicIndex = 0;
  assessment.totalQuestionsAttempted = 0;

  assessment.L1Correct = 0;
  assessment.L2Correct = 0;
  assessment.L3Correct = 0;
  await student.save();


// --------------------- update the avgPercentage of the assessment -------------------

  const test = await Assessments.findById(testId).populate("studentResponses");
let avgPercentage = test.avgPercentage

// duplicate student responses remove
// let studentResponses = test.studentResponses.map((response) => response.studentId);

let totalStudentResponses = test.studentResponses.length;
let totalMarks = 0;

assessment.studentResponses.forEach((response) => {
  totalMarks += response.totalMarks;
});

avgPercentage = (totalMarks / (totalStudentResponses * test.totalQuestionsCount)) * 100;

test.avgPercentage = avgPercentage;
await test.save();

// -----------------------------------------------------------------------------------







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

// route  :/api/student/test/response/:testId
// method :get

exports.sendResponse = catchAsyncErrors(async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { response } = req.body;
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
      assessment.active = false;

      assessment.L1Correct = 0;
      assessment.L2Correct = 0;
      assessment.L3Correct = 0;
      await student.save();

      // return next(new ErrorHandler("Topic not found", 404));
      return res.json({
        success: true,
        message: "Test Completed",
      });
    }
    // ==========================================================
    //find the question from topic
    const question = topic.questions[questionIndex];
    // console.log(questionIndex);
    if (!question) {
      return next(new ErrorHandler("Question not found", 404));
    }

    //----------------------------------------------------------handle marks -------------------------------------------------------------------------------//
    if (question.AnswerIndex === response) {
      // console.log("Correct Answer");
      if (question.QuestionLevel === "beginner") {
        assessment.marks += 1;
        assessment.L1Correct += 1;
        // console.log("L1 correct", assessment.L1Correct);
      } else if (question.QuestionLevel === "intermediate") {
        assessment.marks += 2;
        assessment.L2Correct += 1;
        // console.log("L2 correct", assessment.L2Correct);
      } else if (question.QuestionLevel === "advanced") {
        assessment.marks += 3;
        assessment.L3Correct += 1;
        // console.log("L3 correct", assessment.L3Correct);
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
    let totalCompleted = assessment.totalQuestionsAttempted;
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
    let check = false;
    // console.log(
    //   "All questions completed ",
    //   assessment.totalQuestionsAttempted,
    //   topic.totalL1Question
    // );
    // totalL1question = l1correct + l2correct + l3correct
    console.log(
      "All questions completed ",
      assessment.totalQuestionsAttempted,
      topic.totalL1Question
    );
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
        console.log("All topics completed");
        assessment.currentTopicIndex = 0;

        assessment.active = false;
        await student.save();

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
      const nextQuestionIndex = topic.totalL1Question + 1;

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
      const nextQuestionIndex = topic.totalL1Question + topic.totalL2Question;
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

        assessment.L1Correct = 0;
        assessment.L2Correct = 0;
        assessment.L3Correct = 0;

        // console.log("Next topic index l3", nextTopicIndex);
      }
      if (nextTopicIndex === assessment.assessment.topics.length) {
        if (nextTopicIndex === assessment.assessment.topics.length) {
          assessment.currentQuestionIndex = 0;
          assessment.currentTopicIndex = 0;
          assessment.totalQuestionsAttempted = 0;

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
    const studentResponse = await StudentResponse.findOne({
      studentId: studentId,
      assessmentId: testId,
      attempt: assessment.attempts,
    });
    // console.log(studentResponse);
    // UPDATE THE STUDENT RESPONSE
    studentResponse.topics[topicIndex].questions[
      questionIndex
    ].StudentAnswerIndex = response;

    // for showing result to student -- show attemted=== true questions
    studentResponse.topics[topicIndex].questions[
      questionIndex
    ].attempted = true;
    studentResponse.totalMarks = assessment.marks;

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
      studentResponse:
        studentResponse.topics[topicIndex].questions[questionIndex],
    });
    // ==================================================================================================
  } catch (error) {
    console.log("Error", error);
  }
});

// ===============================================  NON ADAPTIVE || SEND STUDENT RESPONSE AND GET NEXT QUESTION ==============================

// need to save the response in student response schema

// exports.sendResponseNonAdaptive = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { testId, studentId } = req.params;
//     const { response } = req.body;

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

//     const topicIndex = assessment.currentTopicIndex;
//     const topic = assessment.assessment?.topics[topicIndex];

//     if (!topic) {
//       assessment.currentTopicIndex = 0;
//       assessment.currentQuestionIndex = 0;
//       assessment.active = false;

//       await student.save();

//       return res.json({
//       success: true,
//       message: "Test Completed -- No Next Topic Found",
//       });
//     }

//     const questionIndex = assessment.currentQuestionIndex;
//     const findAnswerIndex = assessment.findAnsIndex;
//     const essayIndex = assessment.essayIndex;
//     const videoIndex = assessment.videoIndex;
//     const codingIndex = assessment.codingIndex;

//     const type = topic.Type;
//     let question = {};

//     //   assessment.currentQuestionIndex += 1;
//     //   assessment.currentTopicIndex += 1;

//     // await student.save();
//     // console.log("Question index", questionIndex);

//     // const mcq = topic.questions[questionIndex];
//     // const findAnswer = topic.findAnswers[questionIndex];
//     // const essay = topic.essay[questionIndex];
//     // const video = topic.video[questionIndex];
//     // const compiler = topic.compiler[questionIndex];

//     // return res.json({
//     //   success: true,
//     //   questionIndex: questionIndex,
//     //   // topic: topic,
//     //   compiler:topic.compiler[0],
//     //   mcq:assessment.assessment.topics[topicIndex].questions[0],
//     //   findAnswer:assessment.assessment.topics[topicIndex].findAnswers[0],
//     //   essay:assessment.assessment.topics[topicIndex].essay[0],
//     //   video:assessment.assessment.topics[topicIndex].video[0],
//     //   compiler:assessment.assessment.topics[topicIndex].compiler[0],

//     //   message: "Question sent",
//     // });

//     if (type === "mcq") {
//       question = topic.questions[questionIndex];
//       console.log("mcq", question, questionIndex);
//     } else if (type === "findAnswer") {
//       question = topic.findAnswers[findAnswerIndex];
//       console.log("findAnswer", question , questionIndex);
//     } else if (type === "essay") {
//       question = topic.essay[essayIndex];
//       console.log("essay", question,questionIndex);
//     } else if (type === "video") {
//       question = topic.video[videoIndex];
//       console.log("video", question,questionIndex);
//     } else if (type === "compiler") {
//       question = topic.compiler[codingIndex];
//       console.log("compiler", question,questionIndex);
//     }

//     if (!question) {
//       // assessment.currentTopicIndex = 0;
//       // assessment.currentQuestionIndex = 0;
//       // assessment.active = false;

//       // await student.save();
//       // console.log("qq" , questionIndex , assessment.currentQuestionIndex,assessment.currentTopicIndex)

//       // return res.json({
//       //   success: true,
//       //   message: "Test  Completed -- No Next Question Found",
//       // }); // return res.json({
//       //   success: true,
//       //   message: "Test  Completed -- No Next Question Found",
//       // });
//       // return next(new ErrorHandler("Question not found", 404));

//     }

//     let nextQuestion = {};
//     const totalQuestions = topic.questions.length;

//     // if (type === "mcq" && assessment.totalQuestionsAttempted >= totalQuestions) {
//     //   assessment.currentQuestionIndex = 0;
//     //   assessment.currentTopicIndex = topicIndex + 1;
//     //   assessment.totalQuestionsAttempted = 0;
//     // } else {
//     //   nextQuestion = topic.questions[questionIndex + 1];
//     // }

//     assessment.totalQuestionsAttempted += 1;

//     if (student.currentTopicIndex > assessment.assessment.topics.length) {
//       console.log("All topics completed");
//       res.json({
//         success: true,
//         message: "Test Completed -- All Topics Completed",
//       });
//       assessment.active = false;
//     }

//     // const studentResponse = await StudentResponse.findOne({
//     //   studentId: studentId,
//     //   assessmentId: testId,
//     // });

//     if (type === "mcq") {
//       if (question?.AnswerIndex === response) {
//         if (question.QuestionLevel === "beginner") {
//           assessment.marks += 1;
//         } else if (question.QuestionLevel === "intermediate") {
//           assessment.marks += 2;
//         } else if (question.QuestionLevel === "advanced") {
//           assessment.marks += 3;
//         }
//       } else {
//         if (assessment.negativeCount === 3) {
//           assessment.marks -= 1;
//           assessment.negativeCount = 0;
//         } else {
//           assessment.negativeCount += 1;
//         }
//       }
//     }

//     if (type === "mcq") {
//       if (assessment.totalQuestionsAttempted >topic.questions.length) {
//         assessment.currentQuestionIndex = 0;
//         assessment.currentTopicIndex = topicIndex + 1;
//         assessment.totalQuestionsAttempted = 0;
//         console.log("Next question mcq",questionIndex,assessment.totalQuestionsAttempted,topic.questions.length);

//       } else {

//         nextQuestion = topic.questions[questionIndex + 1];
//         console.log("Next question mcq 2",  topic.questions.length,questionIndex);
//       }
//     } else if (type === "findAnswer") {
//       if (assessment.totalQuestionsAttempted > topic.findAnswers.length) {
//         assessment.findAnsIndex = 0;
//         assessment.currentTopicIndex = topicIndex + 1;
//         assessment.totalQuestionsAttempted = 0;
//         console.log("Next question findAnswer",findAnswerIndex);
//       } else {
//         nextQuestion = topic.findAnswers[findAnswerIndex + 1];
//         console.log("Next question findAnswer 2", nextQuestion);
//       }
//     } else if (type === "essay") {
//       if (assessment.totalQuestionsAttempted >topic.essay.length) {
//         assessment.essayIndex= 0;
//         assessment.currentTopicIndex = topicIndex + 1;
//         assessment.totalQuestionsAttempted = 0;
//         console.log("Next question essay",essayIndex);
//       } else {
//         nextQuestion = topic.essay[essayIndex + 1];
//         console.log("Next question  essay 2", nextQuestion);
//       }
//     } else if (type === "video") {
//       if (assessment.totalQuestionsAttempted > topic.video.length) {
//         assessment.videoIndex= 0;
//         assessment.currentTopicIndex = topicIndex + 1;
//         assessment.totalQuestionsAttempted = 0;
//         console.log("Next question video", videoIndex);
//       } else {
//         nextQuestion = topic.video[videoIndex+ 1];
//         console.log("Next question video 2", nextQuestion);
//       }
//     } else if (type === "compiler") {
//       if (assessment.totalQuestionsAttempted >topic.compiler.length) {
//         assessment.codingIndex = 0;
//         assessment.currentTopicIndex = topicIndex + 1;
//         assessment.totalQuestionsAttempted = 0;
//         console.log("Next question compiler", codingIndex)
//       } else {
//         nextQuestion = topic.compiler[codingIndex + 1];
//         console.log("Next question compiler 2", nextQuestion);
//       }
//     }

//     const studentResponse = await StudentResponse.findOne({
//       studentId: studentId,
//       assessmentId: testId,
//     });

//     if (type === "mcq") {
//       // studentResponse.topics[topicIndex].questions[
//       //   questionIndex
//       // ].StudentAnswerIndex = response;
//     } else if (type === "essay") {
//       // studentResponse.topics[topicIndex].findAnswers[
//       //   questionIndex
//       // ].studentAnswer = response;
//     } else if (type === "findAnswer") {
//       const i = 0;
//       // studentResponse.topics[topicIndex].findAnswers[
//       //   questionIndex
//       // ].questions.forEach((ques) => {
//       //   if (ques.question === question.question) {
//       //     ques.studentAnswer = response[i];
//       //     i++;
//       //   }
//       // });
//     } else if (type === "video") {
//       let i = 0;
//       let j = 0,
//         k = 0;

//       if (response.long) {
//         studentResponse.topics[topicIndex].video[questionIndex].long =
//           response.long[i];
//         i++;
//       }
//       if (response.short) {
//         studentResponse.topics[topicIndex].video[questionIndex].short =
//           response.short[j];
//         j++;
//       }
//       if (response.mcq) {
//         studentResponse.topics[topicIndex].video[questionIndex].mcq =
//           response.mcq[k];
//         k++;
//       }
//     } else if (type === "compiler") {
//       // const testcases = question.testcases;
//       // for (let i = 0; i < testcases.length; i++) {
//       //   studentResponse.topics[topicIndex].compiler[questionIndex].testcase[
//       //     i
//       //   ].studentOutput = response[i];
//       // }
//     }

//     await studentResponse.save();

//     assessment.currentQuestionIndex += 1;

//     console.log("Next question", nextQuestion);

//     nextQuestion = { ...nextQuestion, AnswerIndex: null };

//     await student.save();

//     let studentRes = {};

//     if (type === "mcq") {
//       studentRes = studentResponse.topics[topicIndex].questions[questionIndex];
//     } else if (type === "findAnswer") {
//       studentRes =
//         studentResponse.topics[topicIndex].findAnswers[questionIndex];
//     } else if (type === "essay") {
//       studentRes = studentResponse.topics[topicIndex].essay[questionIndex];
//     } else if (type === "video") {
//       studentRes = studentResponse.topics[topicIndex].video[questionIndex];
//     } else if (type === "compiler") {
//       studentRes = studentResponse.topics[topicIndex].compiler[questionIndex];
//     }

//     res.json({
//       success: true,
//       message: "Question sent",
//       questionIndex: questionIndex,
//       topicIndex : topicIndex,
//       nextQuestion: nextQuestion,
//       topic: topic.Heading,
//       studentResponse: studentRes,

//     });
//   } catch (error) {
//     console.log("Error", error);
//   }
// });
exports.sendResponseNonAdaptive = catchAsyncErrors(async (req, res, next) => {
  try {
    const { testId, studentId } = req.params;
    const { response } = req.body;

    const student = await CollegeAssessInv.findOne({
      student: studentId,
    })
      .populate("assessments.assessment")
      .populate("assessments.assessment.questions")
      .populate("assessments.assessment.findAnswers")
      .populate("assessments.assessment.essay")
      .populate("assessments.assessment.video")
      .populate("assessments.assessment.compiler");

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const assessment = student.assessments.find(
      (assessment) => assessment.assessment?._id.toString() === testId
    );

    if (!assessment) {
      return next(new ErrorHandler("Test not found", 404));
    }

    if (!assessment.active) {
      return next(new ErrorHandler("Assessment not started", 404));
    }

    const topicIndex = assessment.currentTopicIndex;
    const topic = assessment.assessment?.topics[topicIndex];

    if (!topic) {
      assessment.currentTopicIndex = 0;
      assessment.currentQuestionIndex = 0;
      assessment.active = false;

      await student.save();

      return res.json({
        success: true,
        message: "Test Completed -- No Next Topic Found",
      });
    }

    const questionIndex = assessment.currentQuestionIndex;
    const type = topic.Type;
    let question = {};

    switch (type) {
      case "mcq":
        question = topic.questions[questionIndex];
        break;
      case "findAnswer":
        question = topic.findAnswers[questionIndex];
        break;
      case "essay":
        question = topic.essay[questionIndex];
        break;
      case "video":
        question = topic.video[questionIndex];
        break;
      case "compiler":
        question = topic.compiler[questionIndex];
        break;
      default:
        break;
    }

    if (!question) {
      console.log("Question not found");
      return res.json({
        success: true,
        message: "Test Completed -- No Next Question Found",
      });
    }

    let nextQuestion = {};
    const totalQuestions = topic.questions.length;

    assessment.totalQuestionsAttempted += 1;

    if (assessment.totalQuestionsAttempted >= totalQuestions) {
      assessment.currentQuestionIndex = 0;
      assessment.currentTopicIndex = topicIndex + 1;
      assessment.totalQuestionsAttempted = 0;
      console.log("Next topic");
    } else {
      switch (
        type

        // NO NEED TO SEND NEXT QUESTION IN NON ADAPTIVE STUDENT WILL GET NEXT QUESTION FROM CLIENT
        // case "mcq":
        //   nextQuestion = topic.questions[questionIndex + 1];
        //   break;
        // case "findAnswer":
        //  nextQuestion = topic.findAnswers[questionIndex + 1];
        //   break;
        // case "essay":
        //   nextQuestion = topic.essay[questionIndex + 1];
        //   break;
        // case "video":
        //   nextQuestion = topic.video[questionIndex + 1];
        //   break;
        // case "compiler":
        //   nextQuestion = topic.compiler[questionIndex + 1];
        //   break;
        // default:
        //   break;
      ) {
      }

      // console.log("Next question", nextQuestion);
    }

    // Handle student's response

    await student.save();
    // ----------------------------------------------- SAVE STUDENT RESPONSE ------------------------------------------------
    // const studentResponse = await StudentResponse.findOne({
    //   studentId: studentId,
    //   assessmentId: testId,
    // });
    const studentResponse = await StudentResponse.findById(assessment.response);
    switch (type) {
      case "mcq":
        studentResponse.topics[topicIndex].questions[
          questionIndex
        ].StudentAnswerIndex = response;
        console.log(
          "mcq",
          studentResponse.topics[topicIndex].questions[questionIndex]
            .StudentAnswerIndex
        );
        break;
      case "findAnswer":
        // "response" : [
        //   {

        //     "studentAnswer": "The capital of France is Paris"
        //   },
        //   {

        //     "studentAnswer": "The capital of Spain is Madrid"
        //   }
        // ]
        studentResponse.topics[topicIndex].findAnswers[
          questionIndex
        ].questions.forEach((ques, index) => {
          ques.studentAnswer = response[index].studentAnswer;
        });

        console.log(
          "findAnswer",
          studentResponse.topics[topicIndex].findAnswers[questionIndex]
            .questions
        );

        break;
      case "essay":
        // "response" : "The capital of France is Paris"
        studentResponse.topics[topicIndex].essay[questionIndex].studentAnswer =
          response;
        break;
      case "video":
        // "response" : {
        //   "long": [
        //     "The capital of France is Paris",
        //     "The capital of Spain is Madrid"
        //   ],
        //   "short": [
        //     "The capital of France is Paris",
        //     "The capital of Spain is Madrid"
        //   ],
        //   "mcq": [
        //     0,
        //     1
        //   ]

        studentResponse.topics[topicIndex].video[questionIndex].long.forEach(
          (long, index) => {
            // long = response.long[index];
            long.studentAnswer = response.long[index];
          }
        );
        studentResponse.topics[topicIndex].video[questionIndex].short.forEach(
          (short, index) => {
            short.studentAnswer = response.short[index];
          }
        );
        studentResponse.topics[topicIndex].video[
          questionIndex
        ].questions.forEach((mcq, index) => {
          mcq.StudentAnswerIndex = response.mcq[index];
        });

        break;
      case "compiler":
        // "response" : [
        //   {
        //     "studentOutput": "Hello World"
        //   },
        //   {
        //     "studentOutput": "Hello World"
        //   }
        // ]

        studentResponse.topics[topicIndex].compiler[
          questionIndex
        ].testcase.forEach((testcase, index) => {
          testcase.studentOutput = response[index];
        });
        break;
      default:
        break;
    }
    await studentResponse.save();

    // -----------------------------------------------END  SAVE STUDENT RESPONSE ------------------------------------------------

    res.json({
      success: true,
      message: "Question sent",
      questionIndex: questionIndex,
      topicIndex: topicIndex,
      // nextQuestion: nextQuestion,
      topic: topic.Heading,
      studentResponse: question,
      result: studentResponse,
    });
  } catch (error) {
    console.log("Error", error);
  }
});

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
    } else if (topic.type === "compiler") {
      topic.questions.forEach((question) => {
        if (
          question.testcase.every(
            (testcase) => testcase.studentOutput === testcase.output
          )
        ) {
          codingMarks += 1;
        }
        totalMCQandCodingQuestions += 1;
      });
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

  // await student.save();

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
