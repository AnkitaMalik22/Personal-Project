const Job = require("../../models/company/jobModel");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ErrorHandler = require("../../utils/errorhandler");
const Assessment = require("../../models/college/assessment/assessments");




exports.addTestToJob = catchAsyncErrors(async (req, res, next) => {
    const { jobId, testId } = req.params;
    const { testStartDate, testEndDate } = req.body; 

    // Find job and test in parallel for better performance
    const job = await Job.findById(jobId);

    if (!job) {
        return next(new ErrorHandler("Job not found", 404));
    }

    const test = await Assessment.findOne({ 
        _id: testId,
        $or: [
            { createdByCompany: true },
            { company: job.company } 
        ]
    }).select('_id name totalTime totalMarks');

    test.job =jobId;
    await test.save();

    if (!job) {
        return next(new ErrorHandler("Job not found", 404));
    }

    if (!test) {
        return next(new ErrorHandler("Assessment not found or not authorized", 404));
    }

    // Validate dates if provided
    // if (testStartDate && testEndDate) {
    //     const start = new Date(testStartDate);
    //     const end = new Date(testEndDate);
        
    //     if (end <= start) {
    //         return next(new ErrorHandler("End date must be after start date", 400));
    //     }
    // }

    // Check if test is already added to job
    const testExists = job.assessments.some(assessment => 
        assessment.test.toString() === testId
    );

    if (testExists) {
        return next(new ErrorHandler("Test already added to this job", 400));
    }

    // Add test to job using $push for atomic operation
    const updatedJob = await Job.findByIdAndUpdate(
        jobId,
        {
            $push: {
                assessments: {
                    test: testId,
                    testStartDate: testStartDate || null,
                    testEndDate: testEndDate || null,
                    shortlistedStudents: []
                }
            }
        },
        {
            new: true,
            runValidators: true
        }
    ).populate({
        path: 'assessments.test',
        select: 'name totalTime totalMarks'
    });

    res.status(200).json({
        success: true,
        message: "Test added to job successfully",
        job: updatedJob
    });
});


exports.removeTestFromJob = catchAsyncErrors(async (req, res, next) => {
    const { jobId, testId } = req.params;

    const job = await Job.findByIdAndUpdate(
        jobId,
        { $pull: { assessments: { test: testId } } },
        { new: true }
    );

    if (!job) {
        return next(new ErrorHandler("Job not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Test removed from job successfully",
        job
    });
});


exports.getJobTests = catchAsyncErrors(async (req, res, next) => {
    const { jobId } = req.params;

    const job = await Job.findById(jobId).populate({ assessments : { test: 1 } });

    if (!job) {
        return next(new ErrorHandler("Job not found", 404));
    }

    res.status(200).json({
        success: true,
        job
    });
}
);

exports.getAllJobTestsByCollege = catchAsyncErrors(async (req, res, next) => {
    const { collegeId } = req.params;

    const jobs = await Job.find({ college: collegeId }).populate({ path: 'assessments.test', select: 'name totalTime totalMarks' });
    // all tests of all jobs of a college
   const tests = jobs.map(job => job.assessments.map(assessment => assessment.test));



    res.status(200).json({
        success: true,
        tests,
    });
}
);

exports.getAllJobTestsByCompany = catchAsyncErrors(async (req, res, next) => {
 const companyId = req.user.id;
//  console.log("----------------------called----------------------");

    const jobs = await Job.find({ company: companyId })

    const tests = jobs.map(job => job.assessments.map(assessment => assessment.test));

    res.status(200).json({
        success: true,
        tests,
    });
}
);
