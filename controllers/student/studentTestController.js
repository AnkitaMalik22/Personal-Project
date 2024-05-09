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



exports.sendResponse = catchAsyncErrors(async (req, res, next) => {
  try {
    
  
  const { testId, studentId } = req.params;
  const { topicId, questionId, response,questionIndex,topicIndex } = req.body;

  const student = await CollegeAssessInv.findOne({
      student: studentId,
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

  // return res.send(assessment)

  const topic = assessment.assessment.topics.find(
      (topic) => topic._id.toString() === topicId
  );

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

    if(question.QuestionLevel === 'beginner'){
      assessment.marks += 1;
    }else if(question.QuestionLevel === 'intermediate'){
      assessment.marks += 2;
    }
    else if(question.QuestionLevel === 'advanced'){
      assessment.marks += 3;
    }
 
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
  

  // Save the student's response
  const studentResponse = await StudentResponse.findOneAndUpdate(
      {
          studentId,
          assessmentId: testId,
          "topics._id": topicId,
          "topics.questions._id": questionId,
      },
      {
          $set: {
              "topics.$.questions.$[ques].AnswerIndex": response,
          },
      },
      {
          arrayFilters: [{ "ques._id": questionId }],
          new: true,
      }
  );

  // Check if the assessment needs to move to the next level
  if (assessment.marks === topic.questions.length / 3) {
      // Move to the next level
      assessment.level += 1;
      assessment.marks = 0;
  }

  await student.save();


  const totalL1Marks = Math.ceil(topic.questions.filter(
    (question) => question.QuestionLevel === 'beginner'
).length);

const totalL2Marks = Math.ceil(topic.questions.filter(
    (question) => question.QuestionLevel === 'intermediate'
).length);

const totalL3Marks = Math.ceil(topic.questions.filter(
    (question) => question.QuestionLevel === 'advanced'
).length);

let nextQuestion = null;

assessment.currentQuestionIndex = questionIndex;
assessment.currentTopicIndex = topicIndex;

if (assessment.assessment.topics.length === student.currentTopicIndex) {
    // All topics completed
    console.log("All topics completed");
    assessment.active = false;
}

if (topic.questions.length === student.currentQuestionIndex) {
  console.log("All questions completed 1");
    // Move to the next topic if the student has answered all questions for the current topic
    const nextTopicIndex = topicIndex + 1;
    if (nextTopicIndex < assessment.topics.length) {
        nextQuestion = assessment.topics[nextTopicIndex].questions[0];
    }
}

if (totalL1Marks >= topic.L1count && totalL2Marks >= topic.L2count && totalL3Marks >= topic.L3count) {
  console.log("All questions completed 2");
    // Send the next topic L1 questions if the student has achieved the required marks for all levels
    const nextTopicIndex = topicIndex + 1;
    if (nextTopicIndex < assessment.assessment.topics.length) {
        nextQuestion = assessment.topics[nextTopicIndex].questions[0];
    }
} else if (totalL1Marks >= topic.L1count) {
  console.log("All L1 questions completed ");
    // Send the same topic level 2 questions if the student has achieved the required marks for level 1
    const nextQuestionIndex = topic.totalL1Question + 1;
    if (nextQuestionIndex < topic.questions.length) {
        nextQuestion = topic.questions[nextQuestionIndex];
    }
} else if (totalL2Marks >= topic.L2count) {
  console.log("All L2 questions completed ");
    // Send the same topic level 3 questions if the student has achieved the required marks for level 2
    const nextQuestionIndex =topic.totalL2Question +1;
if (nextQuestionIndex < topic.questions.length) {
  nextQuestion = topic.questions[nextQuestionIndex];
}
    
} else if (totalL3Marks >= topic.L3count) {
  console.log("All L3 questions completed ");
    // Send the next topic level 1 questions if the student has achieved the required marks for level 3
    const nextTopicIndex = topicIndex + 1;
    if (nextTopicIndex < assessment.topics.length) {
        nextQuestion = assessment.assessment.topics[nextTopicIndex].questions[0];
    }
}



// Return the next question to the client
// return nextQuestion;


  // await studentResponse.save();
  res.json({
      success: true,
      message: "Question sent",
     data :{
      totalL1Marks,
      totalL2Marks,
      totalL3Marks,
     },
     nextQuestion : nextQuestion
});

} catch (error) {
    console.log("Error" , error)
}

});




