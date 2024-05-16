

const Job = require("../../models/company/jobModel");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ErrorHandler = require("../../utils/errorhandler");
const Assessment = require("../../models/college/assessment/assessments");
const { Student } = require("../../models/student/studentModel");
const College = require("../../models/college/collegeModel");


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
     PlacedAt : Date.now(),
     CompanyPlaced : job.company,
     JobPlaced : job._id
    });
  
    res.status(200).json({
      success: true,
      message: "Student placed in job",
    });
  })
  
  // get All placed students from a college 
  exports.getAllPlacedStudents = catchAsyncErrors(async (req, res, next) => {
    const { collegeId } = req.params;
  
    try {
      const students = await Student.find({
        CollegeId: collegeId,
        Placed: true
      })
      .sort({ PlacedAt: -1 })
      .populate('JobPlaced')
      .populate('CompanyPlaced');
  
      res.status(200).json({
        success: true,
        students: students
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });
  
  