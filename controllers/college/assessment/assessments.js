const Assessments = require("../../../models/college/assessment/assessments");
const ErrorHandler = require("../../../utils/errorhandler");
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const College = require("../../../models/college/collegeModel");
const Company = require("../../../models/company/companyModel");
const { Student } = require("../../../models/student/studentModel");
const Section = require("../../../models/college/assessment/sections");
const RecentQuestions = require("../../../models/college/qb/RecentQuestions");
const sendEmail = require("../../../utils/sendEmail");
const Credit = require("../../../models/college/account/creditModel");
const CollegeAssessInv = require("../../../models/student/assessmentInvitation");
const ApprovedStudents = require("../../../models/college/student/Approved");
const studentResponse = require("../../../models/student/studentResponse");
const collegeTransaction = require("../../../models/college/account/collegeTransactionModel");
const Job = require("../../../models/company/jobModel");
const mongoose = require("mongoose");
const XLSX = require('xlsx');
const PaymentPlan = require("../../../models/college/account/planModel");
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



    const college = await College.findById(id);
    const company = await Company.findById(id);
    if (!college && !company) {
      return next(
        new ErrorHandler(
          "You are not authorized to create assessment. Please login as college or company",
          400
        )
      );
    }
    if (college) {
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
    const Duration = topics?.reduce((acc, topic) => acc + topic.Time, 0);
    const isAdaptive = req.body.level === "adaptive";
    const beginnerCodeMarks = 10;
    const interCodeMarks = 20;
    const advCodeMarks = 30;
    let newTopics = topics?.map((topic) => {
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
        let marksTopic = L1count * 1 + L2count * 2 + L3count * 3;
        if (totalL1Question === 2) {
          marksTopic = 3;
        } else if (totalL1Question === 1) {
          marksTopic = 1;
        }
        return {
          ...topic,
          topicMarks: marksTopic,
          L1count,
          L2count,
          L3count,
          totalL1Question,
          totalL2Question,
          totalL3Question,
        };
      } else if (req.body.level === "beginner") {
        if (topic.Type === "mcq") {
          return {
            ...topic,
            // only calculating mcqs for beginner , intermediate and advanced
            topicMarks: topic.questions.length,
            totalL1Question,
            totalL2Question,
            totalL3Question,
          };
        } else {
          return {
            ...topic,
            // only calculating mcqs for beginner , intermediate and advanced
            topicMarks: topic.compiler.length * 10,
            totalL1Question,
            totalL2Question,
            totalL3Question,
          };
        }
      } else if (req.body.level === "intermediate") {
        if (topic.Type === "mcq") {
          return {
            ...topic,
            // only calculating mcqs for beginner , intermediate and advanced
            topicMarks: topic.questions.length * 2,
            totalL1Question,
            totalL2Question,
            totalL3Question,
          };
        } else {
          return {
            ...topic,
            // only calculating mcqs for beginner , intermediate and advanced
            topicMarks: topic.compiler.length * 20,
            totalL1Question,
            totalL2Question,
            totalL3Question,
          };
        }
      } else if (req.body.level === "advanced") {
        if (topic.Type === "mcq") {
          return {
            ...topic,
            // only calculating mcqs for beginner , intermediate and advanced
            topicMarks: topic.questions.length * 3,
            totalL1Question,
            totalL2Question,
            totalL3Question,
          };
        } else {
          return {
            ...topic,
            // only calculating mcqs for beginner , intermediate and advanced
            topicMarks: topic.compiler.length * 30,
            totalL1Question,
            totalL2Question,
            totalL3Question,
          };
        }
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
      recentQuestion?.topics.push(...topics);

      await recentQuestion.save();
    }
    if (college) {
      await credit.save();
      await college.save();
    }
    if (company) {
      // find the jobId and push the assessment id in the job
      // const job = await Job.findById(req.body.jobId);
      // if (!job) {
      //   return next(new ErrorHandler("Job not found", 404));
      // }
      // assessment.job = req.body.jobId;

      // await  job.assessments.push({
      //   test: assessment._id,
      // });

      // await job.save();

      assessment.company = id;

    }
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

// ==================================================| Add Test to Job |=======================================================================



// ===================================================| Invite Student to Assessment |========================================================

const inviteStudentsToTest = catchAsyncErrors(async (req, res, next) => {
  try {
    const students = req.body;
    // console.log(students, "students");

    // console.log ("upload students called" , students , "students")

    const CollegeId = req.user.id;

    const assessmentId = req.params.id;

    const college = await College.findById(CollegeId);
    const assessment = await Assessments.findById(assessmentId).populate("invitedStudents");
    const credit = await Credit.findOne({ college: CollegeId });
    const plan = await PaymentPlan.findById(college.selectedPlan);

    const invitedStudentsByCollege = assessment.invitedStudents.filter((student) => {
      // console.log(student.CollegeId,CollegeId,student.CollegeId===CollegeId )
      return student.CollegeId.toString() === CollegeId
    });
    // console.log(assessment.invitedStudents);

    if (!college || !plan) {
      return next(new ErrorHandler("College not found or plan has expired", 404));
    }

    if (!assessment) {
      return next(new ErrorHandler("Assessment not found", 404));
    }
    if (students.length > 200) {
      res.status(400).json({ success: false, message: "Rate Limit Exceeded" })
    }
    if (students) {
      for (let i = 0; i < students.length; i++) {
        const { FirstName, LastName, Email, _id } = students[i];

        // send Email to attend the test
        if (assessment.invitedStudents.includes(_id)) {
          // console.log("Student already invited");
          // return next(new ErrorHandler("Student already invited", 404));
        } else {
          // console.log(assessment.invitedStudents.length + 1, credit.limit,"");
          console.log(invitedStudentsByCollege)
          if (
            plan.charges != "Not Allowed" &&
            invitedStudentsByCollege.length + 1 > credit.limit
          ) {

            //UNCOMMENT THIS AFTER DEMO 
            // if (credit.credit === 0) {
            //   return res
            //     .status(200)
            //     .json({ success: "true", message: i + " students invited" });
            // }

            // credit.credit -= 1;
            // await credit.save();
          } else if (invitedStudentsByCollege.length + 1 > credit.limit) {
            //UNCOMMENT THIS AFTER DEMO 

            // return res
            //   .status(429)
            //   .json({ success: "false", message: `cannot invite more than ${credit.limit} students with your current plan` });
          }
          assessment.invitedStudents.push(_id);
          invitedStudentsByCollege.push(_id);

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
            message: `Hello ${FirstName}!,You have been invited to the Test ${assessment.name} by ${college.FirstName} ${college.LastName}. Please click on the link to attend the test: https://skillaccess-student-iota.vercel.app/student/test/${assessmentId}?isAdaptive=${isAdaptive}. If you are not registered yet, please register first.`,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Students Invited successfully for the test",
    });
  } catch (error) {
    res.status(500).json({ success: "false", message: "something went wrong" });
  }
});

// ===================================================| Get All Assessments  |================================================================

// Get All Assessments -- // By College or Company //
const getAllAssessments = catchAsyncErrors(async (req, res, next) => {
  const { id, role } = req.user;
  let assessments = [];
  if (role === "company") {
    assessments = await Assessments.find({ company: id, job: { $exists: req.query.withJob === "true" ? true : false } })
      .sort({ createdAt: -1 })
      .populate("invitedStudents");
    console.log(assessments)
  } else {
    assessments = await Assessments.find({ createdBy: id })
      .sort({ createdAt: -1 })
      .populate("invitedStudents");
    console.log(assessments);
  }


  res.status(200).json({
    success: true,
    assessments,
  });
});

// ===================================================| Get Assessment by ID |========================================================

// Get Assessment by ID
const getAssessmentById = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;


    // const assessments = await College.findById(collegeId).populate("assessments");
    // const assessment = assessments.assessments.find(
    //   (assessment) => assessment._id == id
    // );

    const assessment = await Assessments.findById(id).populate({
      path: "studentResponses",
      populate: {
        path: "studentId",
        select: "FirstName LastName Email avatar Placed",
      },
      // only send those res who completed the test
      match: { completed: true },
    });

    if (!assessment) {
      return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
    }

    res.status(200).json(assessment);
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ success: "false", message: "something went wrong" });
  }

});

// Get Assessment by ID
const getAssessmentOverview = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const collegeId = req.user.id;

  // const assessments = await College.findById(collegeId).populate("assessments");
  // const assessment = assessments.assessments.find(
  //   (assessment) => assessment._id == id
  // );

  const assessment = await Assessments.findById(id).populate({
    path: "studentResponses",
    populate: {
      path: "studentId",
      select: "FirstName LastName Email avatar Placed",
    },
    // only send those res who completed the test
    match: { completed: true },
  });

  const startDate = new Date(assessment.startDate);
  const endDate = new Date(assessment.endDate);
  //arra to store the resopnses day-wise
  // Calculate the difference in days
  let dayDifference = Math.ceil(
    (endDate - startDate) / (1000 * 60 * 60 * 24)
  );
  if (dayDifference > 5) {
    dayDifference = 5;
  }

  let abs = assessment.invitedStudents.length;
  // Initialize the array with the desired object
  const arr = Array.from({ length: dayDifference + 1 }, () => ({
    selected: 0,
    rejected: 0,
    pending: 0,
    absent: abs,
  }));
  console.log(arr, "day array");
  assessment.studentResponses.forEach((elem) => {
    const completedDate = new Date(elem.completedAt);
    const day = Math.ceil((completedDate - startDate) / (1000 * 60 * 60 * 24));
    console.log(startDate, completedDate);
    const { selected, pending, rejected } = arr[day];
    if (parseInt(elem.attempt) === 1) {
      abs -= 1;
    }

    arr[day] = {
      selected: elem.status === "selected" ? selected + 1 : selected,
      pending: elem.status === "pending" ? pending + 1 : pending,
      rejected: elem.status === "rejected" ? rejected + 1 : rejected,
      absent: abs,
    };
  });

  if (!assessment || !arr || arr.length < 0) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }

  res.status(200).json({ success: true, overview: arr });
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
  })
    .sort({ endDate: -1 })
    .skip(req.query.skip || 0)
    .limit(req.query.limit || 20);

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
    const { id, role } = req.user;

    if (role === "company") {





      const assessment = await Assessments.findById(req.params.id).populate('invitedStudents');
      res.status(200).json({
        success: true,
        assessment,
        students: assessment.invitedStudents,
      });
    } else {
      const assessment = await Assessments.findById(req.params.id);

      const approved = await ApprovedStudents.findOne({ college: id }).populate(
        "students"
      )
      const filtered = approved.students.filter(
        (student) => !assessment.invitedStudents.includes(student._id)
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.status(200).json({
        success: true,
        students: filtered,

      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: "false", message: "something went wrong" });
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
            createdBy: new mongoose.Types.ObjectId(req.user.id),
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
            createdBy: new mongoose.Types.ObjectId(req.user.id),
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
            createdBy: new mongoose.Types.ObjectId(req.user.id),
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$startDate" },
              week: { $week: "$startDate" },
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
            createdBy: new mongoose.Types.ObjectId(req.user.id),
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
      console.log(req.user.id);
      assessments = await Assessments.aggregate([
        {
          $match: {
            startDate: {
              $gte: lastYear,
              $lte: now,
            },
            createdBy: new mongoose.Types.ObjectId(req.user.id),
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$startDate" },
              month: { $month: "$startDate" },
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



const getResultInExcel = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.id;

    const assessmentId = new mongoose.Types.ObjectId(id);

    const assessment = await Assessments.aggregate([
      { $match: { _id: assessmentId } },
      {
        $lookup: {
          from: 'studentresponses',
          localField: 'studentResponses',
          foreignField: '_id',
          as: 'studentResponses',
        },
      },
      { $unwind: "$studentResponses" },
      { $match: { "studentResponses.completed": true } },
      {
        $lookup: {
          from: 'students',
          localField: 'studentResponses.studentId',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: "$studentInfo" },
      {
        $project: {
          ID: "$studentResponses._id",
          StudentID: "$studentResponses.studentId",
          FirstName: "$studentInfo.FirstName",
          LastName: "$studentInfo.LastName",
          Email: "$studentInfo.Email",
          Placed: "$studentInfo.Placed",
          Status: "$studentResponses.status",
          Percentage: "$studentResponses.percentage",
          Marks: "$studentResponses.marks",
          TotalMarks: "$studentResponses.totalMarks",
          Time: "$studentResponses.time",
          TimeTaken: "$studentResponses.timeTaken",
          TotalQuestionsAttempted: "$studentResponses.totalQuestionsAttempted",
          CorrectAnswers: "$studentResponses.correctAnswers",
          Topics: "$studentResponses.topics"
        },
      },
    ]);

    if (!assessment || assessment.length === 0) {

      return next(new ErrorHandler(`Assessment not found with ID: ${id} || No responses found`, 404));
    }

    // Combine marks for non-unique topic headings
    const combinedAssessment = assessment.map(item => {
      const topicMarksMap = {};

      item.Topics.forEach(topic => {
        if (!topicMarksMap[topic.Heading]) {
          topicMarksMap[topic.Heading] = {
            Heading: topic.Heading,
            TotalMarks: 0
          };
        }
        topicMarksMap[topic.Heading].TotalMarks += topic.totalMarks; // Combine totalMarks
      });

      // Convert the topicMarksMap back to an array
      const combinedTopics = Object.values(topicMarksMap);

      return {
        ID: item.ID,
        StudentID: item.StudentID,
        FirstName: item.FirstName,
        LastName: item.LastName,
        Email: item.Email,
        Placed: item.Placed,
        Status: item.Status,
        Percentage: item.Percentage,
        Marks: item.Marks,
        TotalMarks: item.TotalMarks,
        Time: item.Time,
        TimeTaken: item.TimeTaken,
        TotalQuestionsAttempted: item.TotalQuestionsAttempted,
        CorrectAnswers: item.CorrectAnswers,
        Topics: combinedTopics,
      };
    });


    // Prepare headers
    const headers = [
      'First Name', 'Last Name', 'Email',
      'Placed', 'Status', 'Percentage', 'Marks', 'Total Marks',
      'Time', 'Time Taken', 'Total Questions Attempted', 'Correct Answers'
    ];

    // Collect unique topic headings for dynamic columns
    const topicHeadings = new Set();
    combinedAssessment.forEach(item => {
      item.Topics.forEach(topic => topicHeadings.add(topic.Heading));
    });

    // Add topic headings to the headers
    headers.push(...Array.from(topicHeadings));

    // Prepare data rows
    const dataRows = combinedAssessment.map(item => {
      const row = [

        item.FirstName,
        item.LastName,
        item.Email,
        item.Placed,
        item.Status,
        item.Percentage,
        item.Marks,
        item.TotalMarks,
        item.Time,
        item.TimeTaken,
        item.TotalQuestionsAttempted,
        item.CorrectAnswers,
      ];

      // Create a map for topic marks
      const topicMarks = {};
      item.Topics.forEach(topic => {
        topicMarks[topic.Heading] = topic.TotalMarks || 0; // Default to 0 if no marks
      });

      // Add topic marks to the row based on the headers
      Array.from(topicHeadings).forEach(heading => {
        row.push(topicMarks[heading] || 0); // Default to 0 if no marks
      });

      return row;
    });

    // Convert to worksheet
    const worksheetData = [headers, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', 'attachment; filename="data.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);

  } catch (error) {

    return next(new ErrorHandler("An error occurred while processing the request", 500));
  }
});


const now = new Date();
const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

module.exports = {
  getResultGraph,
  getResultInExcel,
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
  getAssessmentOverview,
};
