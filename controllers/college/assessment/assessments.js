const Assessments = require("../../../models/college/assessment/assessments");
const ErrorHandler = require("../../../utils/errorhandler");
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const College = require("../../../models/college/collegeModel");
const { Student } = require("../../../models/student/studentModel");
const Section = require("../../../models/college/assessment/sections");
const RecentQuestions = require("../../../models/college/qb/RecentQuestions");
const sendEmail = require("../../../utils/sendEmail");
const Credit = require("../../../models/college/account/creditModel")

// =========================================================================================================================================

// ===================================================| Create Assessment |===================================================================

// Create Assessment -- || College || Company || -- //

const createAssessment = catchAsyncErrors(async (req, res, next) => {
  const { role, id } = req.user;


let credit = await Credit.findOne({
    college: id,
  });

if(credit && credit.credit > 0)
{  credit.credit -=1 ; }else{
  console.log("you cont have credits")
  return next(
    new ErrorHandler(
      `You don't have enough credits to create assessment!`,
      400
    ))

}

  const college = await College.findById(id);
  if (!college) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  const assessments = await Assessments.find({ createdBy: id });

  if (assessments.length > 0) {
    let assessmentExists = false;
    assessments.forEach((assessment) => {
      if (assessment.name === req.body.name) {
        assessmentExists = true;
      }
    });

    if (assessmentExists) {
      return next(
        new ErrorHandler(
          `Assessment with name ${req.body.name} already exists`,
          400
        )
      );
    }
  }

  // const {testSections} = req.body;
  const { topics } = req.body;

  // if (college.topics) {
  //   college.topics.push(...topics);
  // } else {
  //   college.topics = topics;
  // }

  const createdByCompany = role === "company";

  if (role !== "college" && role !== "company") {
    return next(new ErrorHandler("Invalid user role", 400));
  }

  // calculate the total sections duration == test duration
  const Duration = topics.reduce((acc, topic) => acc + topic.Time, 0);

  // const totalQuestionsCount = topics.reduce((acc, topic) => acc + topic.TotalQuestions, 0);

  let assessment = await Assessments.create({
    ...req.body,
    createdBy: id,
    // college: id,
    // company: id,
    totalQuestionsCount: req.body.totalQuestions,
    totalTime: req.body.totalDuration,
    createdByCompany,
  });

  const recentQuestion = await RecentQuestions.findOne({ createdBy: id });

  if (!recentQuestion) {
    console.log("recentQuestion not found", topics);

    await RecentQuestions.create({
      createdBy: id,
      topics,
    });
  } else {
    console.log("recentQuestion found", topics);
    recentQuestion.topics = recentQuestion.topics || [];
    recentQuestion.topics.push(...topics);

    console.log("recentQuestion found", recentQuestion);

    await recentQuestion.save();
  }




  await credit.save();
  await college.save();
  await assessment.save();

  res.status(201).json({
    success: true,
    assessment,
  });
});

// ===================================================| Invite Student to Assessment |========================================================

const inviteStudentsToTest = catchAsyncErrors(async (req, res, next) => {
  try {
    const students = req.body;
    console.log(students, "students");

    // console.log ("upload students called" , students , "students")

    const CollegeId = req.user.id;

    const assessmentId = req.params.id;

    const college = await College.findById(CollegeId);
    const assessment = await Assessments.findById(assessmentId);

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    if (!assessment) {
      return next(new ErrorHandler("Assessment not found", 404));
    }

    if (students) {
      for (let i = 0; i < students.length; i++) {
        const { FirstName, LastName, Email } = students[i];

        //   // send Email to attend the test
        //  if(assessment.invitedStudents.includes(Email)){
        //   console.log("Student already invited")
        //   // return next(new ErrorHandler("Student already invited", 404));
        //   }else{
        //   assessment.invitedStudents.push(Email);
        //   await assessment.save();
        //   }

        sendEmail({
          email: Email,
          subject: "Invitation to join Test",
          message: `Hello ${FirstName}!,You have been invited to the Test ${assessment.name} by ${college.FirstName} ${college.LastName} college. Please click on the link to attend the test: https://skillaccessclient.netlify.app/student/login?CollegeId=${CollegeId}&test=${assessmentId}. If you are not registered yet, plearse register first.`,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Students Invited successfully for the test",
    });
  } catch (error) {
    console.log(error);
  }
});

// ===================================================| Get All Assessments  |================================================================

// Get All Assessments -- // By College or Company //
const getAllAssessments = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.user;
  let assessments = await Assessments.find({ createdBy: id });

  res.status(200).json({
    success: true,
    assessments,
  });
});

// ===================================================| Get Assessment by ID |========================================================

// Get Assessment by ID
const getAssessmentById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const collegeId = req.user.id;
  console.log(collegeId, id);

  // const assessments = await College.findById(collegeId).populate("assessments");
  // const assessment = assessments.assessments.find(
  //   (assessment) => assessment._id == id
  // );

  const assessment = await Assessments.findById(id).populate({
    path: "studentResponses",
    populate: { path: "studentId" }, // Replace "fieldNameToPopulate" with the field you want to populate
  });

  if (!assessment) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }

  res.json(assessment);
});

// ===================================================| Update Assessment by ID |========================================================

// Update Assessment by ID
const updateAssessmentById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  // check if created assessment is by the same user or not
  const a = await Assessments.findById(id);
  if (!a) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }
  if (a.createdByCompany) {
    if (a.company != req.user.id) {
      return next(
        new ErrorHandler(
          `You are not authorized to update this assessment`,
          401
        )
      );
    }
  }

  if (a.college != req.user.id) {
    return next(
      new ErrorHandler(`You are not authorized to update this assessment`, 401)
    );
  }

  const assessment = await Assessments.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  // if (!assessment) {
  //   return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  // }

  res.json(assessment);
});

// ===================================================| Delete Assessment by ID |========================================================

// Delete Assessment by ID
const deleteAssessmentById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  // check if created assessment is by the same user or not
  const a = await Assessments.findById(id);
  if (!a) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }
  // if (a.createdByCompany) {
  //   if (a.company != req.user.id) {
  //     return next(
  //       new ErrorHandler(
  //         `You are not authorized to delete this assessment`,
  //         401
  //       )
  //     );
  //   }
  // }

  if (a.createdBy != req.user.id) {
    return next(
      new ErrorHandler(`You are not authorized to delete this assessment`, 401)
    );
  }

  const assessment = await Assessments.findByIdAndDelete(id);
  const assessments = await Assessments.find({ createdBy: req.user.id });


  // if (!assessment) {
  //   return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  // }

  res.json({ message: "Assessment deleted successfully" , assessments});
});

// ===================================================| Start Assessment by ID |========================================================

const startAssessment = catchAsyncErrors(async (req, res, next) => {
  const { assessmentId, studentId } = req.params;

  const assessment = await Assessments.findById(assessmentId);

  const student = await Student.findById(studentId);

  if (!assessment) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }
  if (!student) {
    return next(new ErrorHandler(`Student not found with ID: ${id}`, 404));
  }
  if (student.OnGoingAssessment.toString() === assessmentId) {
    return next(new ErrorHandler(`Assessment already started`, 404));
  }

  student.OnGoingAssessment = assessmentId;

  await student.save();

  res.json({
    success: true,
    message: "Assessment Started",
    data: {
      assessment,
      student,
    },
  });
});

//  after the time is over client will send the request to end the assessment

// ===================================================| End Assessment by ID |========================================================

const endAssessment = catchAsyncErrors(async (req, res, next) => {
  const { assessmentId, studentId } = req.params;

  const assessment = await Assessments.findById(assessmentId);
  const student = await Student.findById(studentId);

  if (!assessment) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }
  if (!student) {
    return next(new ErrorHandler(`Student not found with ID: ${id}`, 404));
  }
  if (student.OnGoingAssessment.toString() !== assessmentId.toString()) {
    return next(new ErrorHandler(`Assessment not started`, 404));
  }

  student.OnGoingAssessment = null;

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

// ===================***********************

// const selectTopic = catchAsyncErrors(async (req, res, next) => {
//   const {sectionId } = req.params;

//  const section = await Section.findById(sectionId);

//   if (!section) {
//     return next(new ErrorHandler(`Section not found with ID: ${sectionId}`, 404));
//   }

//   college.sections.push(sect)

// =========================================================================================================================================

module.exports = {
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessmentById,
  deleteAssessmentById,
  startAssessment,
  endAssessment,
  inviteStudentsToTest,
};
