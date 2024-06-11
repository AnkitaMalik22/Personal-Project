const Assessments = require("../../../models/college/assessment/assessments");
const ErrorHandler = require("../../../utils/errorhandler");
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const College = require("../../../models/college/collegeModel");
const { Student } = require("../../../models/student/studentModel");
const Section = require("../../../models/college/assessment/sections");
const RecentQuestions = require("../../../models/college/qb/RecentQuestions");
const sendEmail = require("../../../utils/sendEmail");
const Credit = require("../../../models/college/account/creditModel");
const CollegeAssessInv = require("../../../models/student/assessmentInvitation");
const ApprovedStudents = require("../../../models/college/student/Approved");
const studentResponse = require("../../../models/student/studentResponse");
const collegeTransaction = require("../../../models/college/account/collegeTransactionModel");

// =========================================================================================================================================

// ===================================================| Create Assessment |===================================================================

// Create Assessment -- || College || Company || -- //

const createAssessment = catchAsyncErrors(async (req, res, next) => {
  try {
    const { role, id } = req.user;

    let credit = await Credit.findOne({
      college: id,
    });

    const newTransaction = new collegeTransaction({
      creditUsed: 1,
      for: "assessment creation",
      collegeId: id,
      date: new Date().toISOString(),
    });

    await newTransaction.save();

    if (credit && credit.credit > 0) {
      credit.credit -= 1;
    } else {
      console.log("you cont have credits");
      return next(
        new ErrorHandler(
          `You don't have enough credits to create assessment!`,
          400
        )
      );
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
    const isAdaptive = req.body.level === "adaptive";
    const beginnerCodeMarks = 10;
    const interCodeMarks = 20;
    const advCodeMarks = 30;
    let newTopics = topics.map((topic) => {
      if (!topic.questions) {
        return {
          ...topic,
          topicMarks: 0,
          L1count: 0,
          L2count: 0,
          L3count: 0,
          totalL1Question: 0,
          totalL2Question: 0,
          totalL3Question: 0,
        };
      }
      const totalL1Question = topic.questions.filter(
        (question) => question.QuestionLevel === "beginner"
      ).length;
      const L1count = Math.ceil(totalL1Question / 3);

      const totalL2Question = topic.questions.filter(
        (question) => question.QuestionLevel === "intermediate"
      ).length;

      const L2count = Math.ceil(totalL2Question / 2);

      const totalL3Question = topic.questions.filter(
        (question) => question.QuestionLevel === "advanced"
      ).length;
      const L3count = totalL3Question > 1 ? Math.ceil(totalL3Question - 1) : 1;

      // let L3count = topic.questions.length - L1count - L2count;

      if (isAdaptive) {
        return {
          ...topic,
          topicMarks: L1count * 1 + L2count * 2 + L3count * 3,
          L1count,
          L2count,
          L3count,
          totalL1Question,
          totalL2Question,
          totalL3Question,
        };
      } else if (req.body.level === "beginner") {
        return {
          ...topic,
          // only calculating mcqs for beginner , intermediate and advanced
          topicMarks: topic.questions.length,
          totalL1Question,
          totalL2Question,
          totalL3Question,
        };
      } else if (req.body.level === "intermediate") {
        return {
          ...topic,
          // only calculating mcqs for beginner , intermediate and advanced
          topicMarks: topic.questions.length * 2,
          totalL1Question,
          totalL2Question,
          totalL3Question,
        };
      } else if (req.body.level === "advanced") {
        return {
          ...topic,
          // only calculating mcqs for beginner , intermediate and advanced
          topicMarks: topic.questions.length * 3,
          totalL1Question,
          totalL2Question,
          totalL3Question,
        };
      }
    });

    let totalMarks = 0;

    if (req.body.level === "adaptive") {
      totalMarks = newTopics.reduce((acc, topic) => acc + topic.topicMarks, 0);
    } else if (req.body.level === "beginner") {
      totalMarks = newTopics.reduce((acc, topic) => {
        if (topic.Type === "mcq") {
          console.log(topic.totalL1Question, "+", acc);
          return acc + parseInt(topic.totalL1Question);
        } else if (topic.Type === "compiler") {
          console.log(acc, topic.compiler.length, "-------------------");
          return acc + parseInt(topic.compiler.length) * beginnerCodeMarks;
        } else {
          return acc;
        }
      }, 0); // Initial value of accumulator set to 0
      console.log(totalMarks);
    } else if (req.body.level === "intermediate") {
      totalMarks = newTopics.reduce((acc, topic) => {
        if (topic.Type === "mcq") {
          return acc + parseInt(topic.totalL2Question) * 2;
        } else if (topic.Type === "compiler") {
          return acc + parseInt(topic.compiler.length) * interCodeMarks;
        } else {
          return acc;
        }
      }, 0);
      console.log(totalMarks);
    } else if (req.body.level === "advanced") {
      totalMarks = newTopics.reduce((acc, topic) => {
        if (topic.Type === "mcq") {
          return acc + parseInt(topic.totalL3Question) * 3;
        } else if (topic.Type === "compiler") {
          return acc + topic.compiler.length * advCodeMarks;
        } else {
          return acc; // Return the accumulator unchanged if the type doesn't match
        }
      }, 0);

      console.log(totalMarks);
    }

    // Need to calculate the marks of subjective questions also

    // const totalQuestionsCount = topics.reduce((acc, topic) => acc + topic.TotalQuestions, 0);

    let assessment = await Assessments.create({
      ...req.body,
      topics: newTopics,
      createdBy: id,
      // college: id,
      // company: id,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      totalQuestionsCount: req.body.totalQuestions,
      totalTime: req.body.totalDuration,
      totalMarks,
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
      recentQuestion.topics = recentQuestion.topics || [];
      recentQuestion.topics.push(...topics);

      await recentQuestion.save();
    }

    await credit.save();
    await college.save();
    await assessment.save();

    res.status(201).json({
      success: true,
      assessment,
      newTopics,
    });
  } catch (error) {
    console.log(error);
  }
});

// ===================================================| Invite Student to Assessment |========================================================

const inviteStudentsToTest = catchAsyncErrors(async (req, res, next) => {
  try {
    const students = req.body;
    // console.log(students, "students");

    // console.log ("upload students called" , students , "students")

    const CollegeId = req.user.id;

    const assessmentId = req.params.id;

    const college = await College.findById(CollegeId);
    const assessment = await Assessments.findById(assessmentId);
    const credit = await Credit.findOne({ college: CollegeId });
    console.log(credit);
    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    if (!assessment) {
      return next(new ErrorHandler("Assessment not found", 404));
    }

    if (students) {
      for (let i = 0; i < students.length; i++) {
        const { FirstName, LastName, Email, _id } = students[i];

        // send Email to attend the test
        if (assessment.invitedStudents.includes(_id)) {
          console.log("Student already invited");
          // return next(new ErrorHandler("Student already invited", 404));
        } else {
          console.log(assessment.invitedStudents.length + 1, credit.limit);

          if (
            credit.limit === 400 &&
            assessment.invitedStudents.length + 1 > credit.limit
          ) {
            if (credit.credit === 0) {
              return res
                .status(200)
                .json({ success: "true", message: i + " students invited" });
            }

            credit -= 1;
            await credit.save();
          } else if (assessment.invitedStudents.length + 1 > credit.limit) {
            return res
              .status(200)
              .json({ success: "true", message: i + "students invited" });
          }
          assessment.invitedStudents.push(_id);

          await assessment.save();
          await CollegeAssessInv.findOneAndUpdate(
            { student: _id },
            {
              $set: { student: _id },
              $push: {
                assessments: { sender: CollegeId, assessment: assessmentId },
              },
            },
            {
              upsert: true,
            }
          );

          let isAdaptive = assessment.level === "adaptive";
          sendEmail({
            email: Email,
            subject: "Invitation to join Test",
            message: `Hello ${FirstName}!,You have been invited to the Test ${assessment.name} by ${college.FirstName} ${college.LastName} college. Please click on the link to attend the test: https://skillaccess-student-iota.vercel.app/student/test/${assessmentId}?isAdaptive=${isAdaptive}. If you are not registered yet, please register first.`,
          });
        }
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
    populate: { path: "studentId" },
    // only send those res who completed the test
    match: { completed: true },
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

  res.json({ message: "Assessment deleted successfully", assessments });
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

const getRecentAssessments = catchAsyncErrors(async (req, res, next) => {
  const id = req.user.id;
  const assessment = await Assessments.find({
    createdBy: id,
    $or: [{ visible: true }, { visible: { $exists: false } }],
    endDate: { $lt: Date.now() },
  }).sort({ endDate: -1 });

  if (!assessment) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }

  res.status(200).json({ success: true, assessment });
});

const removeRecentAssessment = catchAsyncErrors(async (req, res, next) => {
  const id = req.user.id;
  const assessment = await Assessments.findByIdAndUpdate(req.params.id, {
    visible: false,
  });

  if (!assessment) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }

  res.status(200).json({ success: true, assessment });
});

const getStudentsForTest = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.user;

    const assessment = await Assessments.findById(req.params.id);
    const approved = await ApprovedStudents.findOne({ college: id }).populate(
      "students"
    );

    const filtered = approved.students.filter(
      (student) => !assessment.invitedStudents.includes(student._id)
    );
    res.status(200).json({
      success: true,
      assessment,
      students: filtered,
    });
  } catch (error) {
    console.log(error);
  }
});

const getResultGraph = catchAsyncErrors(async (req, res, next) => {
  const now = new Date();
  const lastYear = new Date(
    now.getFullYear() - 1,
    now.getMonth(),
    now.getDate()
  );

  let assessments;

  console.log(req.query.duration);

  switch (req.query.duration) {
    case "month":
      assessments = await Assessments.aggregate([
        {
          $match: {
            endDate: {
              $gte: lastYear,
              $lte: now,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$endDate" },
              month: { $month: "$endDate" },
            },
            records: { $push: "$$ROOT" },
          },
        },
      ]);

      break;
    case "quater":
      assessments = await Assessments.aggregate([
        {
          $match: {
            endDate: {
              $gte: lastYear,
              $lte: now,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$endDate" },
              quarter: { $ceil: { $divide: [{ $month: "$endDate" }, 3] } },
            },
            records: { $push: "$$ROOT" },
          },
        },
      ]);
      break;
    case "week":
      assessments = await Assessments.aggregate([
        {
          $match: {
            endDate: {
              $gte: lastYear,
              $lte: now,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$endDate" },
              week: { $week: "$endDate" },
            },
            records: { $push: "$$ROOT" },
          },
        },
      ]);

      break;
    case "day":
      console.log("day");
      assessments = await Assessments.aggregate([
        {
          $match: {
            endDate: {
              $gte: lastYear,
              $lte: now,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$endDate" },
              month: { $month: "$endDate" },
              day: { $dayOfMonth: "$endDate" },
            },
            records: { $push: "$$ROOT" },
          },
        },
      ]);
      break;
    default:
      assessments = await Assessments.aggregate([
        {
          $match: {
            endDate: {
              $gte: lastYear,
              $lte: now,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$endDate" },
              month: { $month: "$endDate" },
            },
            records: { $push: "$$ROOT" },
          },
        },
      ]);
      break;
  }

  // Populate the nested studentResponses field
  await studentResponse.populate(assessments, {
    path: "records.studentResponses",
    select: "status",
  });

  assessments.forEach((assessment) => {
    let totalPlaced = 0; // Initialize total fulfilled count for the assessment
    let totalAppearedCount = 0; // Initialize total appeared count for the assessment

    assessment.records.forEach((record) => {
      const fulfilledCount = record.studentResponses.reduce(
        (count, response) => count + (response.status === "selected" ? 1 : 0),
        0
      );
      record.topics = [];
      record.fulfilledCount = fulfilledCount;
      totalPlaced += fulfilledCount; // Add to the total fulfilled count

      const appearedCount = record.studentResponses.length;
      record.appearedCount = appearedCount;
      totalAppearedCount += appearedCount; // Add to the total appeared count
    });
    assessment.totalPlaced = totalPlaced; // Assign the total fulfilled count to the assessment
    assessment.totalAppearedCount = totalAppearedCount; // Assign the total appeared count to the assessment
  });

  return res.json({ assessments });
});
const now = new Date();
const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

module.exports = {
  getResultGraph,
  getStudentsForTest,
  removeRecentAssessment,
  getRecentAssessments,
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessmentById,
  deleteAssessmentById,
  startAssessment,
  endAssessment,
  inviteStudentsToTest,
};
