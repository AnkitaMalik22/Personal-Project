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
const path = require('path');
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
        //console.log("you cont have credits");
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
          //console.log(topic.totalL1Question, "+", acc);
          return acc + parseInt(topic.totalL1Question);
        } else if (topic.Type === "compiler") {
          //console.log(acc, topic.compiler.length, "-------------------");
          return acc + parseInt(topic.compiler.length) * beginnerCodeMarks;
        } else {
          return acc;
        }
      }, 0); // Initial value of accumulator set to 0
      //console.log(totalMarks);
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
      //console.log(totalMarks);
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

      //console.log(totalMarks);
    }

    // Need to calculate the marks of subjective questions also

    // const totalQuestionsCount = topics.reduce((acc, topic) => acc + topic.TotalQuestions, 0);

    let assessment = await Assessments.create({
      ...req.body,
      topics: newTopics,
     
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
      //console.log("recentQuestion not found", topics);

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
      assessment.createdBy= id,
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

    if(university){
      assessment.university=id;
    }
    await assessment.save();

    res.status(201).json({
      success: true,
      assessment,
      newTopics,
    });
  } catch (error) {
    //console.log(error);
  }
});

// ==================================================| Add Test to Job |=======================================================================



// ===================================================| Invite Student to Assessment |========================================================

const inviteStudentsToTest = catchAsyncErrors(async (req, res, next) => {
  try {
    const students = req.body;
    // //console.log(students, "students");

    // //console.log ("upload students called" , students , "students")
    const role = req.user.role;
    const userId = req.user.id;

    const assessmentId = req.params.id;
    let entity;

    if(req.user.role === "college"){
      entity = await College.findById(userId);
    }else{
      entity = await University.findById(userId)
    }

  
    const assessment = await Assessments.findById(assessmentId).populate("invitedStudents");
    // const credit = await Credit.findOne({ college: CollegeId });
    // const plan = await PaymentPlan.findById(college.selectedPlan);


    const invitedStudentsByCollege = assessment.invitedStudents.filter((student) => {
      // //console.log(student.CollegeId,CollegeId,student.CollegeId===CollegeId )
      //console.log(student);
      return student[role==="college" ? "CollegeId" : "universityId"].toString() === userId
    });
    // //console.log(assessment.invitedStudents);

    // if (!college || !plan) {
    //   return next(new ErrorHandler("College not found or plan has expired", 404));
    // }

    if (!assessment) {
      return next(new ErrorHandler("Assessment not found", 404));
    }
    if (students.length > 200) {
      res.status(400).json({ success: false, message: "Rate Limit Exceeded" })
    }
    if (students) {
      for (let i = 0; i < students.length; i++) {

        const { FirstName, LastName, Email, _id } = students[i];

        //console.log(students[i])
        // send Email to attend the test
        if (assessment.invitedStudents.includes(_id)) {
          // //console.log("Student already invited");
          // return next(new ErrorHandler("Student already invited", 404));
        } else {
          // //console.log(assessment.invitedStudents.length + 1, credit.limit,"");
          // //console.log(invitedStudentsByCollege)
          // if (
          //   plan.charges != "Not Allowed" &&
          //   invitedStudentsByCollege.length + 1 > credit.limit
          // ) {

            //UNCOMMENT THIS AFTER DEMO 
            // if (credit.credit === 0) {
            //   return res
            //     .status(200)
            //     .json({ success: "true", message: i + " students invited" });
            // }

            // credit.credit -= 1;
            // await credit.save();
          // } else if (invitedStudentsByCollege.length + 1 > credit.limit) {
            //UNCOMMENT THIS AFTER DEMO 

            // return res
            //   .status(429)
            //   .json({ success: "false", message: `cannot invite more than ${credit.limit} students with your current plan` });
          // }
          assessment.invitedStudents.push(_id);
          invitedStudentsByCollege.push(_id);

          await assessment.save();
          const cai = await CollegeAssessInv.findOneAndUpdate(
            { student: _id },
            {
              $set: { student: _id },
              $push: {
                assessments: { [role === "university" ? "university": "sender" ]: userId, assessment: assessmentId },
              },
            },
            {
              upsert: true,
            }
          );

          // //console.log(Email)

          let isAdaptive = assessment.level === "adaptive";
          let mail=  await sendEmail({
            email: Email,
            subject: "Invitation to join Test",
            html:`<!DOCTYPE html>
                  <html lang="en">
                  <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Test Invitation</title>
                      <style>
                          :root {
                              --primary-color: #6eb9be;
                              --primary-dark: #0D9AAC;
                              --text-color: #333;
                              --background-color: #F1F4F8;
                              --container-bg: #ffffff;
                              --border-color: #e0e0e0;
                          }
                            
                          body {
                              font-family: 'Arial', sans-serif;
                              line-height: 1.6;
                              color: var(--text-color);
                              background-color: var(--background-color);
                              margin: 0;
                              padding: 0;
                              background-image: url('https://www.skillaccess.in/images/banner-art.svg');
                              background-size: cover;
                          }
                            
                          .container {
                              max-width: 70%;
                              margin: 40px auto;
                              padding: 40px;
                              border: 1px solid var(--border-color);
                              border-radius: 12px;
                              background-color: var(--container-bg);
                              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                          }
                            
                          .logo {
                              display: block;
                              width: 20%;
                              margin: 0 auto 30px;
                          }
                            
                          .header {
                              font-size: 24px;
                              font-weight: bold;
                              margin-bottom: 20px;
                              color: var(--primary-dark);
                          }
                            
                          .button {
                              display: inline-block;
                              margin: 20px 0;
                              padding: 12px 24px;
                              color: white;
                              background-color: var(--primary-color);
                              text-decoration: none;
                              border-radius: 5px;
                              font-size: 16px;
                              font-weight: bold;
                              transition: background-color 0.3s ease;
                          }
                            
                          .button:hover {
                              background-color: var(--primary-dark);
                          }
                            
                          .footer {
                              margin-top: 40px;
                              padding-top: 20px;
                              border-top: 1px solid var(--border-color);
                              font-size: 14px;
                              color: #555;
                          }
                            
                          @media (max-width: 768px) {
                              .container {
                                  max-width: 80%;
                                  padding: 20px;
                                  margin: 20px;
                              }
                                  .logo {
                              display: block;
                              width: 40%;
                              margin: 0 auto 30px;
                          }
                          }
                      </style>
                  </head>
                  <body>
                      <div class="container">
                          <img class="logo" src="https://res.cloudinary.com/dic0ukpeu/image/upload/v1734001129/logoFinal_tldpct.png" alt="Skill Access Logo">
                            
                          <div class="header">Hello ${FirstName}!</div>
                            
                          <p>You have been invited to take the following test:</p>
                            
                          <p><strong>${assessment.name}</strong></p>
                            
                          <p>This invitation comes from ${role === "college" ? entity.FirstName : entity.name}.</p>
                            
                          <p>To attend the test, please click the button below:</p>
                            
                          <a href="${process.env.STUDENT_URL || "https://student.skillaccess.in"}/student/test/${assessmentId}?isAdaptive=${isAdaptive}" class="button">Start Test</a>
                          "${process.env.STUDENT_URL || "https://student.skillaccess.in"}/student/test/${assessmentId}?isAdaptive=${isAdaptive}"
                          <p><strong>Note:</strong> If you are not registered yet, please register first before accessing the test.</p>
                            
                          <div class="footer">
                              Best regards,<br>
                              The Skill Access Team
                          </div>
                      </div>
                  </body>
                  </html>

`
            // message: `Hello ${FirstName}!,You have been invited to the Test ${assessment.name} by ${role==="college" ? entity.FirstName : entity.name}. Please click on the link to attend the test: https://skillaccess-student-iota.vercel.app/student/test/${assessmentId}?isAdaptive=${isAdaptive}. If you are not registered yet, please register first.`,
          });

          //console.log(mail)
        }
      }
    }


    res.status(200).json({
      success: true,
      message: "Students Invited successfully for the test",
    });
  } catch (error) {
    //console.log(error)
    res.status(500).json({ success: "false", message: "something went wrong" });
  }
});

// ===================================================| Get All Assessments  |================================================================

// Get All Assessments -- // By College or Company //
const getAllAssessments = catchAsyncErrors(async (req, res, next) => {
  const { id, role } = req.user;
  let assessments = [];
  //console.log(role)
  if (role === "company") {
    assessments = await Assessments.find({ company: id, job: { $exists: req.query.withJob === "true" ? true : false } })
      .sort({ createdAt: -1 })
      .populate("invitedStudents");
    //console.log(assessments)
  } else if(role==="college"){
    assessments = await Assessments.find({ createdBy: id })
      .sort({ createdAt: -1 })
      .populate("invitedStudents");
    //console.log(assessments);
  }else{
    assessments = await Assessments.find({ university: id })
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
    //console.log(error);
    res.status(500).json({ success: "false", message: "something went wrong" });
  }

});

// Get Assessment by ID
const getAssessmentOverview = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const collegeId = req.user.id;

  const assessment = await Assessments.findById(id).populate({
    path: "studentResponses",
    populate: {
      path: "studentId",
      select: "FirstName LastName Email avatar Placed",
    },
    match: { completed: true },
  });

  if (!assessment) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }

  const startDate = new Date(assessment.startDate);
  const endDate = new Date(assessment.endDate);
  
  // Always use 5 days
  const MAX_DAYS = 5;
  let totalAbsent = assessment.invitedStudents.length;

  // Initialize array with default values
  const arr = Array.from({ length: MAX_DAYS }, () => ({
    selected: 0,
    rejected: 0,
    pending: 0,
    absent: totalAbsent
  }));

  // Track students who have attempted
  const attemptedStudents = new Set();

  assessment.studentResponses.forEach((elem) => {
    try {
      const completedDate = new Date(elem.completedAt);
      let day = Math.ceil((completedDate - startDate) / (1000 * 60 * 60 * 24));
      
      // Limit to 5 days, aggregate anything beyond into day 4
      day = Math.min(Math.max(day, 0), MAX_DAYS - 1);

      // Update absent count only once per student
      if (parseInt(elem.attempt) === 1 && !attemptedStudents.has(elem.studentId.toString())) {
        totalAbsent -= 1;
        attemptedStudents.add(elem.studentId.toString());
      }

      // Get current counts and update based on status
      const current = arr[day];
      if (elem.status === "selected") {
        current.selected += 1;
      } else if (elem.status === "rejected") {
        current.rejected += 1;
      } else if (elem.status === "pending") {
        current.pending += 1;
      }
      current.absent = totalAbsent;
      
    } catch (error) {
      console.error('Error processing response:', error);
    }
  });

  // Propagate absent count through the array
  for (let i = 0; i < MAX_DAYS; i++) {
    arr[i].absent = totalAbsent;
  }

  res.status(200).json({ 
    success: true, 
    overview: arr 
  });
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

      const query = { [role]: id };
      const populateOptions = {
        path: "students",
        select: "FirstName LastName Avatar _id createdAt batch Email" ,
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

      // //console.log(approved.students)
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
    //console.log(error);
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

  //console.log(req.user.role);

  switch (req.query.duration) {
    case "month":
      assessments = await Assessments.aggregate([
        {
          $match: {
            endDate: {
              $gte: lastYear,
              $lte: now,
            },
            [req.user.role==="university"? "university" : "createdBy"]: new mongoose.Types.ObjectId(req.user.id),
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
            [req.user.role==="university"? "university" : "createdBy"]: new mongoose.Types.ObjectId(req.user.id),
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
            [req.user.role==="university"? "university" : "createdBy"]: new mongoose.Types.ObjectId(req.user.id),
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
      //console.log("day");
      assessments = await Assessments.aggregate([
        {
          $match: {
            endDate: {
              $gte: lastYear,
              $lte: now,
            },
            [req.user.role==="university"? "university" : "createdBy"]: new mongoose.Types.ObjectId(req.user.id),
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
      //console.log(req.user.id);
      assessments = await Assessments.aggregate([
        {
          $match: {
            startDate: {
              $gte: lastYear,
              $lte: now,
            },
            [req.user.role==="university"? "university" : "createdBy"]: new mongoose.Types.ObjectId(req.user.id),
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
//console.log(assessments)
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

  if (percentile >= 90) {
    // console.log("rich")
    return `Exceptional performance! (${percentile}th Percentile)`;
  } else if (percentile >= 80) {
    return `Outstanding performance! (${percentile}th Percentile)`;
  } else if (percentile >= 70) {
    return `Very good performance. (${percentile}th Percentile)`;
  } else if (percentile >= 60) {
    return `Good performance. (${percentile}th Percentile)`;
  } else if (percentile >= 50) {
    return `Average performance. Needs some improvement. (${percentile}th Percentile)`;
  } else if (percentile >= 40) {
    return `Below average. Requires significant improvement. (${percentile}th Percentile)`;
  } else {
    // console.log("poor")
    return `Poor performance. Urgent intervention needed. (${percentile}th Percentile)`;
  }
};

const calculatePercentile = (score, sortedScores) => {
  // console.log(sortedScores.length)
  if (sortedScores.length === 0) return 0;
  if (sortedScores.length === 1) return 100;

  // Find how many scores are less than or equal to the current score
  const scoresBelow = sortedScores.filter(s => s <= score).length;
  
  // Calculate percentile using the "nearest-rank method"
  // Formula: P = (n_below / N) × 100
  // where n_below is the number of scores at or below the given score
  // and N is the total number of scores
  const percentile = ((scoresBelow - 1) / (sortedScores.length - 1)) * 100;
console.log(percentile);
  return Math.max(0, Math.min(100, Math.round(percentile)));
};

// Example usage with test cases
// const testCases = [
//   [4, [4]],                    // Single score
//   [20, [20]],                  // Single score
//   [0, [0]],                    // Single score
//   [70, [50, 60, 70, 80, 90]], // Middle score
//   [90, [50, 60, 70, 80, 90]], // Highest score
//   [50, [50, 60, 70, 80, 90]], // Lowest score
//   [75, [50, 60, 70, 75, 75, 80, 90]] // Duplicate scores
// ];

// testCases.forEach(([score, scores]) => {
//   console.log(`Score: ${score}, Array: [${scores}], Percentile: ${calculatePercentile(score, scores)}`);
// });




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
//     //console.error('Error generating report:', error);

//     res.status(500).json({
//       success: false,
//       message: 'Server error generating student report',
//       error: error.message,
//     });
//   }
// };



const generateStudentReportPdf = async (req, res) => {
  // console.log("heee")
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
      const comparisonArrow = percentage >= topic.averagePercengate ? '↑' : percentage < topic.averagePercengate ? '↓' : '-';

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


    
    // const overallAveragePercentage = studentResponseRes.topics.reduce((sum, topic) => sum + (topic.topicMarks > 0 ? (topic.totalMarks / topic.topicMarks) * 100 : 0), 0) / studentResponseRes.topics.length;
  
  const topics = studentResponseRes.topics;
    const totalMarksScored = topics.reduce((sum, topic) => 
      sum + (topic.totalMarks || 0), 
      0
    );
  
    // Then calculate maximum possible marks
    const totalMaximumMarks = topics.reduce((sum, topic) => 
      sum + (topic.topicMarks || 0), 
      0
    );
  
    // Finally calculate the overall percentage
  let overallPercentage = totalMaximumMarks > 0 
      ? (totalMarksScored / totalMaximumMarks) * 100 
      : 0;
  
   const  overallAveragePercentage= Math.round(overallPercentage * 100) / 100;
    
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

      // Save PDF locally
  const pdfFilePath = path.join(__dirname, 'reports', `assessment-report-.pdf`);
  fs.mkdirSync(path.dirname(pdfFilePath), { recursive: true });
  fs.writeFileSync(pdfFilePath, pdfBuffer);

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

    // console.log(uploadResponse)

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
        //console.error('Error closing browser:', browserCloseError);
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

  // Calculate topic-wise statistics
  let topicPercentages = test.topics.map((topic, topicIndex) => {
    const studentScores = test.studentResponses.map(response => 
      response.topics[topicIndex]?.totalMarks || 0
    );
    
    const maximumMarks = topic.topicMarks;
    const totalMarks = studentScores.reduce((sum, score) => sum + score, 0);
    const responseCount = test.studentResponses.length;
    
    const avgTopicMarks = responseCount > 0 ? totalMarks / responseCount : 0;
    const averageTopicPercentage = maximumMarks > 0 
      ? (avgTopicMarks / maximumMarks) * 100 
      : 0;

    return {
      topicName: topic.Heading,
      avgTopicMarks,
      maximumMarks,
      averageTopicPercentage,
      studentScores,
      totalMarks
    };
  });

  const processedResponses = await Promise.all(
    test.studentResponses.map(async (response) => {
      // Calculate student's performance for each topic with proper comment generation
      const studentTopics = response.topics.map((studentTopic, topicIndex) => {
        const topicStats = topicPercentages[topicIndex];
        const studentScore = studentTopic?.totalMarks || 0;
        const maximumMarks = topicStats.maximumMarks;
        
        const percentage = maximumMarks > 0 
          ? (studentScore / maximumMarks) * 100 
          : 0;

        const topicComment = generatePerformanceComment(
          studentScore,
          maximumMarks,
          topicStats.studentScores
        );

        // Return topic with all necessary fields for database update
        return {
          ...studentTopic._doc, // Spread the original document to keep existing fields
          totalMarks: studentScore,
          percentage: Math.round(percentage),
          maximumMarks,
          averageMarks: Math.round(topicStats.avgTopicMarks),
          averagePercentage: Math.round(topicStats.averageTopicPercentage),
          comment: topicComment // Ensure comment is included in the topic object
        };
      });

      // Calculate overall performance
      const totalStudentMarks = studentTopics.reduce(
        (sum, topic) => sum + (topic.totalMarks || 0), 
        0
      );
      const totalMaximumMarks = topicPercentages.reduce(
        (sum, topic) => sum + topic.maximumMarks, 
        0
      );
      const overallPercentage = totalMaximumMarks > 0 
        ? (totalStudentMarks / totalMaximumMarks) * 100 
        : 0;

      return {
        _id: response._id,
        studentId: response.studentId,
        name: `${response.studentId.FirstName} ${response.studentId.LastName}`,
        topics: studentTopics, // Now includes comments for each topic
        overallPercentage: Math.round(response.percentage || overallPercentage),
        totalStudentMarks,
        totalMaximumMarks
      };
    })
  );

  // Sort responses by overall percentage
  processedResponses.sort((a, b) => b.overallPercentage - a.overallPercentage);

  // Update all student responses with ranks and comments
  await Promise.all(
    processedResponses.map(async (response, index) => {
      const rank = index + 1;
      const overallComment = generatePerformanceComment(
        response.totalStudentMarks,
        response.totalMaximumMarks,
        processedResponses.map(r => r.totalStudentMarks)
      );

      // Update student response with complete information including topic comments
      await studentResponse.findByIdAndUpdate(
        response._id,
        {
          $set: {
            topics: response.topics, // Topics array now includes comments
            percentage: response.overallPercentage,
            comment: overallComment,
            rank,
            totalMarks: response.totalStudentMarks,
            maximumMarks: response.totalMaximumMarks
          }
        },
        { new: true }
      );

      return {
        ...response,
        rank,
        comment: overallComment
      };
    })
  );


  // Mark report as generated
  test.isReportGenerated = true;
  await test.save();

  // Prepare report data
  const reportData = {
    studentName: req.user.FirstName,
    organizationName: req.user.CollegeName,
    testName: test.name,
    submissionDate: new Date().toLocaleDateString(),
    totalScore: processedResponses[0].totalStudentMarks,
    maxScore: processedResponses[0].totalMaximumMarks,
    duration: test.duration,
    sections: topicPercentages.map(topic => ({
      name: topic.topicName,
      score: topic.avgTopicMarks.toFixed(2),
      maxScore: topic.maximumMarks,
      percent: topic.averageTopicPercentage.toFixed(2),
    }))
  };

  // Generate college report
  generateReportForCollege(req.params.id, req.user.Email, reportData);

  return res.status(200).json({ 
    success: true, 
    topStudents: processedResponses.slice(0, 3) 
  });
});
  
  
//   let selectedStudents = test.selectedStudents;
//   let pendingStudents = test.invitedStudents.filter(student => student.status === "pending"); 
//   let rejectedStudents = test.rejectedStudents;

//   let selectedStudents = test.selectedStudents;
//   let pendingStudents = test.invitedStudents.filter(student => student.status === "pending"); 
//   let rejectedStudents = test.rejectedStudents;



const generateReportForCollege = async (id,Email,reportData) => {

  const {
    studentName,
    organizationName,
    testName,
    submissionDate,
    totalScore,
    maxScore,
    duration,
    sections,


//   selectedStudents.sort((a, b) => b.percentage - a.percentage);
//   pendingStudents.sort((a, b) => b.percentage - a.percentage);
//   rejectedStudents.sort((a, b) => b.percentage - a.percentage);
   
//   selectedStudents.sort((a, b) => b.percentage - a.percentage);
//   pendingStudents.sort((a, b) => b.percentage - a.percentage);
//   rejectedStudents.sort((a, b) => b.percentage - a.percentage);

    
  } = reportData || {};
  
 
  const test = await Assessments.findById(id)
  .populate([
    {
      path: 'selectedStudents',
      select: 'status studentId timeTaken percentage topics totalMarks' ,
      populate: {
        path: 'studentId',
        select:"FirstName LastName"  // Populate the studentId within studentResponses
      },
    },
    {
      path: 'rejectedStudents',
      select: 'status studentId timeTaken percentage topics totalMarks',
      populate: {
        path: 'studentId',
        select:"FirstName LastName"  // Populate the studentId within studentResponses
      },
    },
    {
      path: 'studentResponses',
      match: { status: "pending" },  
      select: 'status studentId timeTaken percentage topics totalMarks',
      populate: {
        path: 'studentId',
        select:"FirstName LastName"  // Populate the studentId within studentResponses
      },
    },
  ])
  let selectedStudents = test.selectedStudents;
  let pendingStudents = test.studentResponses;
  let rejectedStudents = test.rejectedStudents;
  //console.log(test);

  selectedStudents.sort((a, b) => b.percentage - a.percentage);
  pendingStudents.sort((a, b) => b.percentage - a.percentage);
  rejectedStudents.sort((a, b) => b.percentage - a.percentage);

  const topStudents = selectedStudents.slice(0, 3);
  const topAveragePercentage = selectedStudents.reduce((sum, student) => sum + student.percentage, 0) / selectedStudents.length || 0;

  // Calculate statistics for the donut chart
  const totalEvaluated = selectedStudents.length + rejectedStudents.length + pendingStudents.length;
  const industryReady = selectedStudents.filter(s => s.percentage >= 25).length;
  const needsPractice = selectedStudents.filter(s => s.percentage >= 10 && s.percentage < 25).length;
  const needsTraining = totalEvaluated - industryReady - needsPractice;

  // Generate the report HTML with the provided template
  const reportHtml =`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${test.name} - Assessment Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        }

        @page {
            size: A4;
            margin: 0;
        }

        .svg-circle {
    width: 300px;
    height: 300px;
}


        body {
            background: white;
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
        }

        .container {
            padding: 20mm;
            max-width: 100%;
            height: 100%;
            position: relative;
        }

        .header {
            border-left: 4px solid #c41e3a;
            padding-left: 15px;
            margin-bottom: 30px;
        }

        .header h1 {
            font-size: 24px;
            color: #333;
            margin-bottom: 8px;
        }

        .header h2 {
            font-size: 18px;
            color: #555;
            font-weight: normal;
            margin-bottom: 8px;
        }

        .header h3 {
            color: #2b579a;
            font-size: 16px;
        }

        .header p {
            color: #666;
            margin-top: 15px;
            font-size: 14px;
        }

        .circles-container {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 30px 0;
        }

        .circle-wrapper {
            text-align: center;
        }

        .svg-circle {
            width: 120px;
            height: 120px;
        }

        .circle-text h2 {
            font-size: 32px;
            color: #333;
            margin-bottom: 5px;
        }

        .circle-text p {
            color: #666;
            font-size: 14px;
        }

        .columns {
            display: flex;
            gap: 30px;
            margin: 30px 0;
        }

        .column h3 {
            color: #333;
            font-size: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #c41e3a;
            margin-bottom: 12px;
        }

        .column ul li {
            margin-bottom: 6px;
            color: #555;
            font-size: 14px;
        }

        .stats-container {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .stat-number {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .footer {
            position: absolute;
            bottom: 20mm;
            left: 20mm;
            right: 20mm;
            display: flex;
            justify-content: space-between;
            color: #666;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 12px;
        }

        /* Chart styles */
        .chart-container {
            width: 300px;
            margin: 2rem auto;
        }

        canvas {
            display: block;
            margin: 0 auto;
        }

        .legend {
            margin-top: 2rem;
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
        }

        .legend-label {
            font-size: 14px;
            color: #666;
        }

        .legend-number {
            font-weight: bold;
        }
    </style>
    <!-- Include Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <div class="header">
            <h1>${test.name}</h1>
            <h2>${test.description || 'Assessment Report'}</h2>
            <h3>${test.categoryName || 'Assessment Category'}</h3>
            <p>Test executed on ${new Date(test.startDate).toLocaleDateString()}</p>
        </div>

       
        <!-- Circles Section -->
            <div class="circles-container">
                <div class="circle-wrapper">
                    <svg class="svg-circle" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#c41e3a" stroke-width="3"></circle>
                        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="20" fill="#333">
                            ${selectedStudents.length}
                        </text>
                    </svg>
                    <div class="circle-text">
                        <p>Selected</p>
                    </div>
                </div>
                <div class="circle-wrapper">
                    <svg class="svg-circle" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#c41e3a" stroke-width="3"></circle>
                        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="20" fill="#333">
                            ${totalEvaluated}
                        </text>
                    </svg>
                    <div class="circle-text">
                        <p>Attempts</p>
                    </div>
                </div>
            </div>


        <!-- Columns Section -->
        <div class="columns">
            <div class="column">
                <h3>Assessment Details</h3>
                <ul>
                    <li>Total Time: ${test.totalTime} minutes</li>
                    <li>Total Marks: ${test.totalMarks}</li>
                    <li>Total Questions: ${test.totalQuestionsCount}</li>
                    <li>Level: ${test.level}</li>
                    <li>Type: ${test.type}</li>
                </ul>
            </div>
            <div class="column">
                <h3>Topics Covered</h3>
                <ul>
                    ${test.topics.map(topic => `<li>${topic.Heading}</li>`).join('')}
                </ul>
            </div>
        </div>

        <!-- Chart Section -->
        <div class="chart-container">
            <canvas id="donutChart"></canvas>
        </div>
        <div class="legend">
            <div class="legend-item">
                <div class="legend-color" style="background: #4CAF50;"></div>
                <span class="legend-label">Industry Ready <span class="legend-number">${industryReady}</span></span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #FFA726;"></div>
                <span class="legend-label">Needs Practice <span class="legend-number">${needsPractice}</span></span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #757575;"></div>
                <span class="legend-label">Needs Training <span class="legend-number">${needsTraining}</span></span>
            </div>
        </div>

        <!-- Footer Section -->
        <div class="footer">
            <p>Private and Confidential</p>
            <p>© ${new Date().getFullYear()} Assessment Report</p>
        </div>
    </div>

    <script>
        // Wait for the document to load and then initialize the chart
   window.onload = function() {
    var ctx = document.getElementById('donutChart').getContext('2d');
    var donutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Industry Ready', 'Needs Practice', 'Needs Training'],
            datasets: [{
                data: [${industryReady}, ${needsPractice}, ${needsTraining}],
                backgroundColor: ['#4CAF50', '#FFA726', '#757575'],
                hoverBackgroundColor: ['#45a049', '#ff9c20', '#707070']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.raw;
                        }
                    }
                }
            },
            cutout: "80%"
        },
        // Improve resolution for high-DPI screens
        plugins: [{
            beforeRender: function(chart) {
                var canvas = chart.canvas;
                var ctx = canvas.getContext('2d');
                canvas.width = canvas.offsetWidth * window.devicePixelRatio;
                canvas.height = canvas.offsetHeight * window.devicePixelRatio;
                ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            }
        }]
    });
};

    </script>
</body>
</html>
`;

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  await page.setContent(reportHtml, { waitUntil: 'load' });
  await page.waitForSelector('#donutChart');  // Ensure the canvas is loaded
  await page.evaluate(() => {
    return new Promise(resolve => {
        setTimeout(resolve, 2000); // Adjust to match your animation duration
    });
});
await page.setViewport({ width: 1920, height: 1080 });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
  });

  await browser.close();

  // Save PDF locally
  // const pdfFilePath = path.join(__dirname, 'reports', `assessment-report-${test._id}.pdf`);
  // fs.mkdirSync(path.dirname(pdfFilePath), { recursive: true });
  // fs.writeFileSync(pdfFilePath, pdfBuffer);


  const uploadResponse = await new Promise((resolve, reject) => {
    const cloudinaryStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'image',
        access_control: [{ access_type: 'anonymous', }],
        resource_type: 'raw', // Correct resource type for PDF files
        public_id: `report_${Email}`,
        format: "pdf" // Optional: Unique public ID for the report
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    cloudinaryStream.end(pdfBuffer);
  });

let mail = await sendEmail({
  email: Email,
  subject: "Invitation to join Test",
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>College Assessment Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
            color: #333;
            line-height: 1.6;
        }

        .container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        .header {
            border-bottom: 2px solid #043345;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .header .logo {
            max-width: 150px;
            margin-bottom: 10px;
        }

        .header h1 {
            font-size: 26px;
            color: #043345;
        }

        .content {
            font-size: 14px;
        }

        .content p {
            margin: 10px 0;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        .table th, .table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }

        .table th {
            background-color: #f4f4f4;
            font-weight: bold;
        }

        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #666;
            text-align: center;
        }

        .footer a {
            color: #0D9AAC;
            text-decoration: none;
        }

        .note {
            font-size: 12px;
            color: #0AB8C8;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img class="logo" src="https://res.cloudinary.com/dic0ukpeu/image/upload/v1734001129/logoFinal_tldpct.png" alt="Skill Access Logo">
        </div>

        <div class="content">
            <p>Dear <strong>${organizationName || 'N/A'}</strong>,</p>
            <p>We are pleased to share the performance report for the assessment <strong>"${testName || 'N/A'}"</strong>, conducted on <strong>${submissionDate || 'N/A'}</strong>.</p>
            <p>The assessment consisted of <strong>${sections?.length || 0}</strong> sections and was attempted by <strong>${totalEvaluated}</strong> students from your institution.</p>
            <p>Below is the overall sectional performance report:</p>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>Section</th>
                    <th>Average Score</th>
                    <th>Average Percent</th>
                </tr>
            </thead>
            <tbody>
                ${sections?.map(section => `
                <tr>
                    <td>${section.name || 'N/A'}</td>
                    <td>${section.score || '0'} out of ${section.maxScore || '0'}</td>
                    <td>${section.percent || '0'}%</td>
                </tr>`).join('')}
            </tbody>
        </table>

        <div class="content">
            <p>Additionally, the top performers from the assessment are as follows:</p>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Student Name</th>
                    <th>Score</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${topStudents?.map((student, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${student.studentId.FirstName + " " + student.studentId.LastName || 'N/A'}</td>
                    <td>${student.totalMarks || '0'} out of ${test.totalMarks || '0'}</td>
                    <td>${student.percentage || '0'}%</td>
                </tr>`).join('')}
            </tbody>
        </table>

        <div class="content">
            <p><a href="${uploadResponse?.secure_url || '#'}" target="_blank">Click here</a> to download the detailed performance report.</p>
        </div>

        <div class="footer">
            <p>Best Regards,</p>
            <p>Skillaccess Team</p>
            <p class="note">This is a system-generated report. For any queries, please contact us.</p>
        </div>
    </div>
</body>
</html>`
});

  console.log("report sent")
};

const now = new Date();
const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

module.exports = {
  generateReportForCollege,
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
