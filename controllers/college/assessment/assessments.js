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
const cloudinary = require("cloudinary");
const fs = require('fs');

const puppeteer = require('puppeteer');
const University = require("../../../models/university/universityModel");
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
    const university = await University.findById(id);

    if (!college && !company && !university) {
      return next(
        new ErrorHandler(
          "You are not authorized to create assessments.",
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
    const createdByUniversity = role ==="university";

    if (role !== "college" && role !== "company" && role!=="university") {
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
      createdByUniversity
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
  console.log(role)
  if (role === "company") {
    assessments = await Assessments.find({ company: id, job: { $exists: req.query.withJob === "true" ? true : false } })
      .sort({ createdAt: -1 })
      .populate("invitedStudents");
    console.log(assessments)
  } else if(role==="college"){
    assessments = await Assessments.find({ createdBy: id })
      .sort({ createdAt: -1 })
      .populate("invitedStudents");
    console.log(assessments);
  }else{
    assessments = await Assessments.find({ createdBy: id })
    .sort({ createdAt: -1 })
    .populate("invitedStudents");
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

      // Extract skip and limit from query parameters
      const limit = parseInt(req.query.limit) || 10; // Default limit is 10
      const skip = parseInt(req.query.skip) || 0;   // Default skip is 0
      const batch = req.query.batch;
      const search = req.query.search;

      const query = { college: id };
      const populateOptions = {
        path: "students",
        select: "FirstName LastName Avatar _id createdAt batch" ,
        match: { _id: { $nin: assessment.invitedStudents } },
        options: {
          sort: { _id: -1 },
          skip: skip,  // Skip the first 'skip' documents
          limit: limit + 1, // Fetch one extra document to check for the next page
        },
      };


      if (batch) {
        populateOptions.match = { ...populateOptions.match, batch: batch };
      }
      if(search){
    
        populateOptions.match = { 
          ...populateOptions.match, 
          $or: [
            { FirstName: { $regex: search, $options: "i" } }, 
            { LastName: { $regex: search, $options: "i" } },
           {Email:{$regex: search,$options:"i"}}
          ] 
        };        
      }

      const approved = await ApprovedStudents.findOne(query).populate(populateOptions);
      let students = approved ? approved.students : [];

      // console.log(approved.students)
      // Check if there's a next page
      const hasNextPage = students.length > limit;

      // Trim the extra document if exists
      if (hasNextPage) {
        students.pop();
      }

      // Response
      res.status(200).json({
        success: true,
        students,
        skip,
        limit,
        hasNextPage,
        totalCount: students.length, // Optional: total students fetched
        assessment,
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

const generatePerformanceComment = (studentScore, maximumMarks, sortedScores) => {
  if (maximumMarks === 0) return "No marks allocated";

  const studentPercentage = (studentScore / maximumMarks) * 100;
  const percentile = calculatePercentile(studentScore, sortedScores);

  if (studentPercentage >= 90) {
    return `Exceptional performance! (${percentile}th Percentile)`;
  } else if (studentPercentage >= 80) {
    return `Outstanding performance! (${percentile}th Percentile)`;
  } else if (studentPercentage >= 70) {
    return `Very good performance. (${percentile}th Percentile)`;
  } else if (studentPercentage >= 60) {
    return `Good performance. (${percentile}th Percentile)`;
  } else if (studentPercentage >= 50) {
    return `Average performance. Needs some improvement. (${percentile}th Percentile)`;
  } else if (studentPercentage >= 40) {
    return `Below average. Requires significant improvement. (${percentile}th Percentile)`;
  } else {
    return `Poor performance. Urgent intervention needed. (${percentile}th Percentile)`;
  }
};

// Helper function to calculate percentile
const calculatePercentile = (score, sortedScores) => {
  const scoresBelow = sortedScores.filter(s => s <= score).length;
  return Math.round((scoresBelow / sortedScores.length) * 100);
};



// Helper function to calculate percentile

// Adjust the path as needed

// const generateStudentReportPdf = async (req, res) => {
//   try {
//     const studentResponseId = req.params.id;

//     // Fetch the student response
//     const studentResponseRes = await studentResponse.findById(studentResponseId)
//       .populate({
//         path: 'studentId',
//         select: 'FirstName LastName email',
//       });

//     if (!studentResponseRes) {
//       return res.status(404).json({ success: false, message: 'Student response not found' });
//     }

//     // Prepare data for report
//     const studentName = `${studentResponseRes.studentId.FirstName} ${studentResponseRes.studentId.LastName}`;

//     const topicsData = studentResponseRes.topics.map(topic => {
//       const studentScore = topic.totalMarks || 0;
//       const percentage = topic.topicMarks > 0 ? (studentScore / topic.topicMarks) * 100 : 0;

//       return {
//         topic: topic.Heading,
//         score: studentScore,
//         maxMarks: topic.topicMarks,
//         percentage: `${percentage.toFixed(2)}%`,
//         comment: topic.comment || 'No comment'
//       };
//     });

//     // Create HTML report using json2html
//     const reportHtml = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <title>Student Performance Report</title>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             line-height: 1.6;
//             max-width: 800px;
//             margin: 0 auto;
//             padding: 20px;
//           }
//           .header {
//             text-align: center;
//             margin-bottom: 30px;
//             border-bottom: 2px solid #333;
//             padding-bottom: 10px;
//           }
//           table {
//             width: 100%;
//             border-collapse: collapse;
//             margin-top: 20px;
//           }
//           th, td {
//             border: 1px solid #ddd;
//             padding: 10px;
//             text-align: left;
//           }
//           th {
//             background-color: #f2f2f2;
//             font-weight: bold;
//           }
//           .performance-table tr:nth-child(even) {
//             background-color: #f9f9f9;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="header">
//           <h1>Performance Report</h1>
//           <h2>${studentName}</h2>
//         </div>
//         ${json2html.render(topicsData, {
//           'tag': 'table',
//           'class': 'performance-table',
//           'children': [
//             {
//               'tag': 'thead',
//               'children': [
//                 {
//                   'tag': 'tr',
//                   'children': [
//                     {'tag': 'th', 'html': 'Topic'},
//                     {'tag': 'th', 'html': 'Score'},
//                     {'tag': 'th', 'html': 'Maximum Marks'},
//                     {'tag': 'html', 'html': 'Percentage'},
//                     {'tag': 'th', 'html': 'Comment'}
//                   ]
//                 }
//               ]
//             },
//             {
//               'tag': 'tbody',
//               'repeat': topicsData,
//               'children': [
//                 {
//                   'tag': 'tr',
//                   'children': [
//                     {'tag': 'td', 'html': '${topic}'},
//                     {'tag': 'td', 'html': '${score}'},
//                     {'tag': 'td', 'html': '${maxMarks}'},
//                     {'tag': 'td', 'html': '${percentage}'},
//                     {'tag': 'td', 'html': '${comment}'}
//                   ]
//                 }
//               ]
//             }
//           ]
//         })}
//       </body>
//       </html>
//     `;

//     // Upload HTML report to Cloudinary
//     const uploadResponse = await new Promise((resolve, reject) => {
//       const cloudinaryStream = cloudinary.uploader.upload_stream(
//         { 
//           folder: 'reports', 
//           resource_type: 'raw', 
//           public_id: `report_${studentResponseId}`,
//           format: 'html'
//         },
//         (error, result) => {
//           if (error) return reject(error);
//           resolve(result);
//         }
//       );

//       // Convert string to buffer
//       const htmlBuffer = Buffer.from(reportHtml, 'utf-8');
//       cloudinaryStream.end(htmlBuffer);
//     });

//     // Return the Cloudinary link for the HTML report
//     res.status(200).json({
//       success: true,
//       message: 'Report generated successfully',
//       reportUrl: uploadResponse.secure_url,
//     });

//   } catch (error) {
//     console.error('Error generating report:', error);

//     res.status(500).json({
//       success: false,
//       message: 'Server error generating student report',
//       error: error.message,
//     });
//   }
// };



const generateStudentReportPdf = async (req, res) => {
  let browser = null;
  try {
    const studentResponseId = req.params.id;

    // Fetch the student response
    const studentResponseRes = await studentResponse.findById(studentResponseId)
      .populate({
        path: 'studentId',
        select: 'FirstName LastName email',
      });

    if (!studentResponseRes) {
      return res.status(404).json({ success: false, message: 'Student response not found' });
    }

    const studentName = `${studentResponseRes.studentId.FirstName} ${studentResponseRes.studentId.LastName}`;
    const topicsHtml = studentResponseRes.topics.map(topic => {
      const studentScore = topic.totalMarks || 0;
      const percentage = topic.topicMarks > 0 ? (studentScore / topic.topicMarks) * 100 : 0;
      const performanceComment = topic.comment || 'No comment';
      const comparisonArrow = percentage > topic.averagePercengate ? '↑' : percentage < topic.averagePercengate ? '↓' : '-';
    
      return `
        <tr>
          <td>${topic.Heading}</td>
          <td>${studentScore} <span class="${comparisonArrow === '↑' ? 'up' : comparisonArrow === '↓' ? 'down' : ''}">${comparisonArrow}</span></td>
          <td>${topic.topicMarks}</td>
          <td>${percentage?.toFixed(1)|| 0}% <span class="${comparisonArrow === '↑' ? 'up' : comparisonArrow === '↓' ? 'down' : ''}">${comparisonArrow}</span></td>
          <td>${performanceComment}</td>
          <td>${topic.averagePercengate?.toFixed(1) || 0}%</td>
          <td>${topic.averageMarks}</td>
        </tr>
      `;
    }).join('');
    
    const overallAveragePercentage = studentResponseRes.topics.reduce((sum, topic) => sum + (topic.topicMarks > 0 ? (topic.totalMarks / topic.topicMarks) * 100 : 0), 0) / studentResponseRes.topics.length;
    
    const reportHtml = `<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Performance Report</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .generic-content {
              padding : 10px;
            }
            .report-container {
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background-color: #3498db;
                color: #ffffff;
                padding: 20px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
            }
            .header h2 {
                margin: 10px 0 0;
                font-size: 20px;
                font-weight: normal;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            th, td {
                padding: 12px 15px;
                text-align: left;
                border-bottom: 1px solid #e0e0e0;
            }
            thead {
                background-color: #f2f2f2;
            }
            th {
                font-weight: bold;
                text-transform: uppercase;
                font-size: 14px;
                color: #555;
            }
            tr:nth-child(even) {
                background-color: #f8f8f8;
            }
            tr:hover {
                background-color: #e8f4fd;
            }
            .up {
                color: green;
            }
            .down {
                color: red;
            }
            .footer {
                margin-top: 20px;
                padding: 10px;
                text-align: center;
                background-color: #f2f2f2;
                border-top: 1px solid #e0e0e0;
            }
            .footer p {
                margin: 5px 0;
            }
            .explanation {
                margin-top: 20px;
                padding: 20px;
                background-color: #eaf3fc;
                border-left: 5px solid #3498db;
            }
            .status {
                margin-top: 20px;
                padding: 15px;
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                background-color: ${studentResponseRes.status === 'Pass' ? '#d4edda' : '#f8d7da'};
                color: ${studentResponseRes.status === 'Pass' ? '#155724' : '#721c24'};
                border: 1px solid ${studentResponseRes.status === 'Pass' ? '#c3e6cb' : '#f5c6cb'};
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <div class="header">
                <h1>Performance Report</h1>
                <h2>${studentName}</h2>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Topic</th>
                        <th>Score</th>
                        <th>Maximum Marks</th>
                        <th>Your Test %</th>
                        <th>Remark</th>
                        <th>Avg Test%</th>
                        <th>Average Marks</th>
                    </tr>
                </thead>
                <tbody>
                    ${topicsHtml}
                </tbody>
            </table>
            <div class="status">
                Status: ${studentResponseRes.status}
            </div>
            <div class="footer">
                <p><strong>Overall Average Percentage:</strong> ${overallAveragePercentage.toFixed(2)}%</p>
                <p><strong>Rank:</strong> ${studentResponseRes.rank}</p>
                <p>${studentResponseRes.comment}</p>
                <p><em>Evaluation performed by SkillAccess.</em></p>
            </div>
            <div class="explanation">
                <h3>Report Explanation</h3>
                <ul>
                    <li><strong>Topic:</strong> The subject or area of the test.</li>
                    <li><strong>Score:</strong> The marks obtained by the student in this topic.</li>
                    <li><strong>Maximum Marks:</strong> The highest possible marks for this topic.</li>
                    <li><strong>Your Test %:</strong> The percentage score achieved in the topic.</li>
                    <li><strong>Remark:</strong> A brief comment on performance in the topic.</li>
                    <li><strong>Avg Test%:</strong> The average test percentage for all students.</li>
                    <li><strong>Average Marks:</strong> The average marks obtained by all students in this topic.</li>
                </ul>
            </div>
            <div class="generic-content">
                <h3>About This Report Card</h3>
                <p>This report card reflects the performance of ${studentName} in the conducted tests. It highlights strengths and areas for improvement, providing a comparative analysis with peers.</p>
                <p>Keep working hard and striving for excellence. Remember, every effort counts!</p>
            </div>
        </div>
    </body>
    </html>`;
    
    

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();

    // Set content and wait for full page load
    await page.setContent(reportHtml, { waitUntil: 'domcontentloaded' });

    // Ensure the PDF is generated with backgrounds
    const pdfBuffer = await page.pdf({
      format: 'A2',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });

    // Check the file created

    // Close the browser
    await browser.close();

    // Upload PDF to Cloudinary as a PDF
    const uploadResponse = await new Promise((resolve, reject) => {
      const cloudinaryStream = cloudinary.v2.uploader.upload_stream(
        {
          folder: 'image',
          access_control: [{ access_type: 'anonymous', }],
          resource_type: 'raw', // Correct resource type for PDF files
          public_id: `report_${studentResponseId}`,
          format: "pdf" // Optional: Unique public ID for the report
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      cloudinaryStream.end(pdfBuffer);
    });

    // Return the Cloudinary link for the PDF
    res.status(200).json({
      success: true,
      message: 'Report generated successfully',
      pdfUrl: uploadResponse,
    });

  } catch (error) {
    console.error('Error generating report:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (browserCloseError) {
        console.error('Error closing browser:', browserCloseError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Server error generating student report PDF',
      error: error.message,
    });
  }
};

const generateReport = catchAsyncErrors(async (req, res, next) => {
  const test = await Assessments.findById(req.params.id).populate({
    path: 'studentResponses',
    select: 'topics status studentId timeTaken percentage',
    populate: {
      path: 'studentId',
      select: 'FirstName LastName email',
    },
  });

  let topicPercentages = [];

  test.topics.forEach((topic, index) => {
    let totalMarks = 0;
    let maximumMarks = 0;
    let studentScores = [];
    let responseCount = test.studentResponses.length;

    // Collect individual student scores for percentile calculation
    test.studentResponses.forEach((response) => {
      maximumMarks = test.topics[index].topicMarks;
      const score = response.topics[index].totalMarks || 0;
      totalMarks += score;
      studentScores.push(score);
    });

    const avgTopicMarks = responseCount > 0 ? totalMarks / responseCount : 0;
    const averageTopicPercentage = maximumMarks > 0
      ? (avgTopicMarks / maximumMarks) * 100
      : 0;

    // Calculate percentiles
    const sortedScores = [...studentScores].sort((a, b) => a - b);

    topicPercentages.push({
      avgTopicMarks,
      maximumMarks,
      averageTopicPercentage,
      studentScores
    });
  });

  // Update student responses
  // await Promise.all(
  //   test.studentResponses.map(async (response) => {
  //     // Initialize topicUpdates to accumulate updates
  //     let topicUpdates = { $set: {} };

  //     topicPercentages.forEach((topic, topicIndex) => {
  //       const studentScore = response.topics[topicIndex]?.totalMarks || 0;
  //       const comment = generatePerformanceComment(
  //         studentScore,
  //         topic.maximumMarks,
  //         [...topic.studentScores].sort((a, b) => a - b)
  //       );

  //       const percentage =
  //         topic.maximumMarks > 0 ? (studentScore / topic.maximumMarks) * 100 : 0;

  //       // Accumulate updates for the current topic
  //       topicUpdates.$set[`topics.${topicIndex}.avgerageMarks`] = parseInt(topic.avgTopicMarks);
  //       topicUpdates.$set[`topics.${topicIndex}.averagePercengate`] = parseInt(topic.averageTopicPercentage);
  //       topicUpdates.$set[`topics.${topicIndex}.comment`] = comment;
  //       topicUpdates.$set[`topics.${topicIndex}.percentage`] = percentage;
  //     });

  //     // Update the student response with all accumulated updates
  //     await studentResponse.findByIdAndUpdate(response._id, topicUpdates);
  //   })
  // );
  // Calculate overall percentages and add them to the responses
  const responsesWithPercentages = await Promise.all(
    test.studentResponses.map(async (response) => {
      let totalStudentMarks = 0;
      let totalMaximumMarks = 0;
    let  topics = [];
      topicPercentages.forEach((topic, topicIndex) => {
        const studentScore = response.topics[topicIndex]?.totalMarks || 0;
        totalStudentMarks += studentScore;
        totalMaximumMarks += topic.maximumMarks;
        topics.push(topic);
      });

      

      const overallPercentage =
        totalMaximumMarks > 0 ? (totalStudentMarks / totalMaximumMarks) * 100 : 0;

      return {
       topics,
        _id: response._id,
        name: response.studentId.FirstName + " " + response.studentId.LastName,
        overallPercentage,
        totalStudentMarks,
        totalMaximumMarks,
      };
    })
  );

  console.log(topicPercentages)

  // Sort students by overall percentage to calculate rank
  responsesWithPercentages.sort((a, b) => b.overallPercentage - a.overallPercentage);

  // Update ranks and other data in the database
  await Promise.all(
    responsesWithPercentages.map(async (response, index) => {
      let topicUpdates = { $set: {} };


      topicPercentages.forEach((topic, topicIndex) => {
              const studentScore = response.topics[topicIndex]?.totalMarks || 0;
              const comment = generatePerformanceComment(
                studentScore,
                topic.maximumMarks,
                [...topic.studentScores].sort((a, b) => a - b)
              );
      
              const percentage =
                topic.maximumMarks > 0 ? (studentScore / topic.maximumMarks) * 100 : 0;
      
              // Accumulate updates for the current topic averageMarks
              topicUpdates.$set[`topics.${topicIndex}.averageMarks`] = parseInt(topic.avgTopicMarks);
              topicUpdates.$set[`topics.${topicIndex}.averagePercengate`] = parseInt(topic.averageTopicPercentage);
              topicUpdates.$set[`topics.${topicIndex}.comment`] = comment;
              topicUpdates.$set[`topics.${topicIndex}.percentage`] = percentage;
            });
      
           


      // Assign rank based on position in the sorted array
      const rank = index + 1;

      // Generate overall performance comment
      const overallComment = generatePerformanceComment(
        response.totalStudentMarks,
        response.totalMaximumMarks,
        topicPercentages.map((t) => t.avgTopicMarks).sort((a, b) => a - b)
      );

      // Prepare updates
      topicUpdates.$set.percentage = response.overallPercentage;
      topicUpdates.$set.comment = overallComment;
      topicUpdates.$set.rank = rank;
// console.log(topicUpdates);
      // Update the student response
     let student =  await studentResponse.findByIdAndUpdate(response._id, topicUpdates);
     console.log(student.topics[0].averageMarks);
    })
  );



  test.isReportGenerated = true;
  await test.save();
  return res.status(200).json({ success: true, topStudents: responsesWithPercentages.splice(0, 3) });

});

const now = new Date();
const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

module.exports = {
  generateStudentReportPdf,
  generateReport,
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
