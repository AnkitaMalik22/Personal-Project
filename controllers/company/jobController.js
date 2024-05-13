const Job = require("../../models/company/jobModel");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ErrorHandler = require("../../utils/errorhandler");
const Assessment = require("../../models/college/assessment/assessments");
const { Student } = require("../../models/student/studentModel");
const College = require("../../models/college/collegeModel");

// ============================================= JOB CONTROLLERS ====================================================

// --------------------------------------------- GET A JOB ----------------------------------------------------------

exports.getJob = catchAsyncErrors(async (req, res, next) => {
  const { jobId } = req.params;
  console.log(jobId);

  const job = await Job.findById(jobId);

  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  res.status(200).json({
    success: true,
    job,
  });
});

// --------------------------------------------- CREATE A JOB --------------------------------------------------------

exports.createJob = catchAsyncErrors(async (req, res, next) => {
  const { companyId } = req.params;
  const job = await Job.create({
    ...req.body,
    company: companyId,
  });

  res.status(201).json({
    success: true,
    job,
  });
});

// --------------------------------------------- UPDATE A JOB --------------------------------------------------------

exports.updateJob = catchAsyncErrors(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);

  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }
  if (job.company !== req.user.id) {
    return next(
      new ErrorHandler("You are not authorized to update this job", 401)
    );
  }

  await Job.updateOne(req.body);

  res.status(200).json({
    success: true,
    job,
  });
});

// --------------------------------------------- DELETE A JOB --------------------------------------------------------

exports.deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);

  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  if (job.company !== req.user.id) {
    return next(
      new ErrorHandler("You are not authorized to update this job", 401)
    );
  }

  await Job.remove();

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
});

// --------------------------------------------- GET ALL JOBS / Student -------------------------------------------------------

exports.getAllJobsStudent = catchAsyncErrors(async (req, res, next) => {
  const { studentId } = req.params;

  const jobs = await Job.find({
    Student: { $in: [studentId] },
  });

  res.status(200).json({
    success: true,
    jobs,
  });
});

// --------------------------------------------- GET All JOBS / College -------------------------------------------------------

exports.getAllJobsCollege = catchAsyncErrors(async (req, res, next) => {
  const { collegeId } = req.params;

  const jobs = await Job.find({
    College: { $in: [collegeId] },
  });

  res.status(200).json({
    success: true,
    jobs,
  });
});

// --------------------------------------------- GET ALL JOBS / Company -------------------------------------------------------

exports.getAllJobsCompany = catchAsyncErrors(async (req, res, next) => {
  const { companyId } = req.params;

  const jobs = await Job.find({
    company: companyId,
  });

  res.status(200).json({
    success: true,
    jobs,
  });
});

// --------------------------------------------- Create Assessment For Job / Company -------------------------------------------------------

exports.createAssessmentForJob = catchAsyncErrors(async (req, res, next) => {
  const { jobId } = req.params;
  const createdByCompany = true;
  const assessment = await Assessment.create({
    ...req.body,
    job: jobId,
    createdByCompany,
    company: req.user.id,
  });

  res.status(201).json({
    success: true,
    assessment,
  });
});

// create Section , test -- comes from college/assessment/ ..

// --------------------------------------------- GET ALL ASSESSMENTS / Company -------------------------------------------------------

exports.getAllAssessmentsCompany = catchAsyncErrors(async (req, res, next) => {
  const { companyId } = req.params;

  const assessments = await Assessment.find({
    company: companyId,
  });

  res.status(200).json({
    success: true,
    assessments,
  });
});

// --------------------------------------------- GET ALL ASSESSMENTS / Student -------------------------------------------------------

exports.getAllAssessmentsStudent = catchAsyncErrors(async (req, res, next) => {
  const { studentId } = req.params;

  const assessments = await Assessment.find({
    Student: { $in: [studentId] },
  });

  res.status(200).json({
    success: true,
    assessments,
  });
});

// =============================================  APPLY JOB ====================================================

// --------------------------------------------- APPLY JOB / COLLEGE -------------------------------------------------------
// College -- add student /invite student  in the job
// job id ,college id
// only student's authorized college can invite
// save jobId --> student.Assessments
// on select student  -- push studentId to a array and send in backend
// save studentIds / colllege Id --> Job.Students || Job.Colleges

exports.addStudentToJob = catchAsyncErrors(async (req, res, next) => {
  const { jobId } = req.params;
  const {  studentIds } = req.body;
    const collegeId = req.user.id;

    if(req.user.role !== 'college'){
        return next(new ErrorHandler("You are not authorized to invite students", 401));
    }

  const college = await College.findById(collegeId);
  const job = await Job.findById(jobId);

  // check for each student if he is authorized to apply for this job

  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }
  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  if (studentIds.length === 0) {
    return next(new ErrorHandler("Students not found", 404));
  }

  if (studentIds.length > 0) {
    studentIds.forEach(async (studentId) => {
      const student = await Student.findById(studentId);
      if (!student) {
        return next(new ErrorHandler("Student not found", 404));
      }
      if (student.CollegeId !== collegeId) {
        return next(new ErrorHandler("Student not authorized", 404));
      }

      // if student already applied for this job
      if (student.Assessments.includes(jobId)) {
        return next(
          new ErrorHandler("Student already applied for this job", 404)
        );
      } else {
        await Student.findByIdAndUpdate(studentId, {
          $push: {
            Assessments: jobId,
          },
        });

        //student dont need to accept invite or apply, college direcly apply for job by inviting

        await sendEmail({
          email: student.Email,
          subject: "You have been invited to apply for a job",
          message: `We enrolled you in a job.
                
                <h3>Job Details</h3>
                <ul>
                <li>Job Title: ${job.JobTitle}</li>
                <li>Job Description: ${job.JobDescription}</li>
                <li>Job Location: ${job.JobLocation}</li>
               </ul>
               
               `,
        });
      }
    });
  }


  await Job.findByIdAndUpdate(jobId, {
    $push: {
      Student: studentIds,
      College: collegeId,
    },
  });

  res.status(200).json({
    success: true,
    message: "Students added to job",
  });
});
// --------------------------------------------- APPLY JOB / STUDENT -------------------------------------------------------

// Student -- apply for job
// job id ,student id
// save jobId --> student.Assessments
// save studentId --> Job.Students || Job.Colleges

exports.applyJob = catchAsyncErrors(async (req, res, next) => {
  const { jobId} = req.params;
  let studentId = req.user.id;

  const student = await Student.findById(studentId);

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  const job = await Job.findById(jobId);

  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  if (student.Assessments.includes(jobId)) {
    return next(new ErrorHandler("Student already applied for this job", 404));
  }

  await Student.findByIdAndUpdate(studentId, {
    $push: {
      Assessments: jobId,
    },
  });

  await Job.findByIdAndUpdate(jobId, {
    $push: {
      Student: studentId,
    },
  });

  res.status(200).json({
    success: true,
    message: "Student applied for job",
  });
});

// =============================================== JOB FILTERS ===========================================

//Get job my SEniority Level
// Get Job by location
// Get Job by Type -- Full-Time , Part-Time , Internship, Casual , Contract
// Get Job by Salary Range

exports.getFilteredJobs = async (req, res, next) => {
  try {
    let query = {};

    if (req.query.seniorityLevel) {
      query.SeniorityLevel = { $in: req.query.seniorityLevel };
    }

    if (req.query.location) {
      query.JobLocation = { $in: req.query.location };
    }

    if (req.query.employmentType) {
      query.EmploymentType = { $in: req.query.employmentType };
    }

    if (req.query.minSalary && req.query.maxSalary) {
      query.SalaryFrom = { $gte: req.query.minSalary };
      query.SalaryTo = { $lte: req.query.maxSalary };
    }

    console.log(query);
    const jobs = await Job.find(query);

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

// =============================================== JOB SEARCH =========================================== //

exports.searchJobs = async (req, res, next) => {
  const searchQuery = req.query.search;
  try {
    const searchResults = await Job.find({
      JobTitle: { $regex: new RegExp(searchQuery, "i") },
    });

    res.json({ success: true, jobs: searchResults });
  } catch (error) {
    next(error);
  }
};

// Place Student in a Job

exports.placeStudentInJob = catchAsyncErrors(async (req, res, next) => {
  const { jobId, studentId } = req.params;

  const job = await Job.findById(jobId);

  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  const student = await Student.findById(studentId);

  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  await Job.findByIdAndUpdate(jobId, {
    $push: {
      PlacedStudents: studentId,
    },
  });

  await Student.findByIdAndUpdate(studentId, {
   Placed : true,
   CompanyPlaced : job.company,
   JobPlaced : job._id
  });

  res.status(200).json({
    success: true,
    message: "Student placed in job",
  });
})

