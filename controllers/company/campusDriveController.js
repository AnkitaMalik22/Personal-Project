const ErrorHandler = require("../../utils/errorhandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const Company = require("../../models/company/companyModel");
const CampusDrive = require("../../models/company/campusDriveModel");
const College = require("../../models/college/collegeModel");
const Student = require("../../models/student/studentModel");
const Assessment = require("../../models/college/assessment/assessments");
const StudentResponse = require("../../models/student/studentResponseModel");
const sendToken = require("../../utils/jwtToken");
const sendEmail = require("../../utils/sendEmail");



// Create a new campus drive
// Route: /api/company/campusdrive/new
exports.newCampusDrive = catchAsyncErrors(async (req, res, next) => {
  const company = await Company.findById(req.user.id);
    if (!company) {
        return next(new ErrorHandler("Company not found", 404));
    }
    req.body.company = req.user.id;
    const campusDrive = await CampusDrive.create(req.body);
    res.status(200).json({
        success: true,
        campusDrive,
    });
})

// Get all campus drives of a company
// Route: /api/company/campusdrive
exports.getCampusDrives = catchAsyncErrors(async (req, res, next) => {
  
const userRole = req.user.role;
const user = req.user;
let campusDrives;

if (userRole === 'company') {
    const company = await Company.findById(req.user.id).populate('campusDrives');
    if (!company) {
        return next(new ErrorHandler("Company not found", 404));
    }
    campusDrives = company.campusDrives;
}
if(userRole === 'college') {
    const college = await College.findById(req.user.id).populate('campusDrives');
    if (!college) {
        return next(new ErrorHandler("College not found", 404));
    }
    campusDrives = college.campusDrives;
}
else {
    return next(new ErrorHandler("You are not authorized to access this route", 401));
}

    res.status(200).json({
        success: true,
        campusDrives,
    });
}
)
// Get a campus drive by id
// Route: /api/company/campusdrive/:id

exports.getCampusDrive = catchAsyncErrors(async (req, res, next) => {
    const campusDrive = await CampusDrive.findById(req.params.id);
    if (!campusDrive) {
        return next(new ErrorHandler("Campus drive not found", 404));
    }
    res.status(200).json({
        success: true,
        campusDrive,
    });
}
)


// Update a campus drive by id
// Route: /api/company/campusdrive/:id
exports.updateCampusDrive = catchAsyncErrors(async (req, res, next) => {
    let campusDrive = await CampusDrive.findById(req.params.id);
    if (!campusDrive) {
        return next(new ErrorHandler("Campus drive not found", 404));
    }
    campusDrive = await CampusDrive.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    res.status(200).json({
        success: true,
        campusDrive,
    });
}
)


// Delete a campus drive by id
// Route: /api/company/campusdrive/:id

exports.deleteCampusDrive = catchAsyncErrors(async (req, res, next) => {
    const campusDrive = await CampusDrive.findById(req.params.id);
    if (!campusDrive) {
        return next(new ErrorHandler("Campus drive not found", 404));
    }
    await campusDrive.deleteOne();
    // delete all student responses for this campus drive
    await StudentResponse.deleteMany({campusDrive: req.params.id});

    // delete all assessments for this campus drive
    const assessments = await Assessment.find({campusDrive: req.params.id});

    for (let i = 0; i < assessments.length; i++) {
        await assessments[i].deleteOne();
    }
    // remove from college and company
    const college = await College.findById(campusDrive.assignedTo);
    college.campusDrives.pull(req.params.id);
    await college.save();
    const company = await Company.findById(campusDrive.company);
    company.campusDrives.pull(req.params.id);
    await company.save();


    
    res.status(200).json({
        success: true,
        message: "Campus drive deleted successfully",
    });
})

// add colleges to a campus drive

// Route: /api/company/campusdrive/:id/colleges

exports.addCollegesToCampusDrive = catchAsyncErrors(async (req, res, next) => {

    const campusDrive = await CampusDrive.findById(req.params.id).populate('company').select('company.name');
    if (!campusDrive) {
        return next(new ErrorHandler("Campus drive not found", 404));
    }
    const colleges = req.body.colleges;
    for (let i = 0; i < colleges.length; i++) {
        const college = await College.findById(colleges[i]);
        if (!college) {
            return next(new ErrorHandler("College not found", 404));
        }
        campusDrive.colleges.push(colleges[i]);
        college.campusDrives.push(req.params.id);
        await college.save();

        sendEmail({
            email: college.email,
            subject: `Campus Drive Invitation from ${campusDrive.company.name}`,
            message: `You have been invited to a campus drive by ${campusDrive.company.name}. Please login to your account to view the details.`,
        });


    }
    await campusDrive.save();
    res.status(200).json({
        success: true,
        message: "Colleges added successfully",
    });
})


// assign Test to a campus drive
// Route: /api/company/campusdrive/:id/test

exports.assignTestToCampusDrive = catchAsyncErrors(async (req, res, next) => {
    const campusDrive = await CampusDrive.findById(req.params.id);
    const college = await College.findById(req.body.college);
    if (!campusDrive) {
        return next(new ErrorHandler("Campus drive not found", 404));
    }
    const assessment = await Assessment.findById(req.body.test);
    if (!assessment) {
        return next(new ErrorHandler("Assessment not found", 404)); 
    }

    assessment.campusDrive = req.params.id;

    campusDrive.tests.push({
        test: req.body.test,
        assignedTo: college._id,
        students: [],
    });

    college.campusDrives.push(req.params.id);
    
    // for (let i = 0; i < college.students.length; i++) {
    //     const student = await Student.findById(college.students[i]);
    //     campusDrive.tests[0].students.push({
    //         student: college.students[i],
    //         status: "pending",
    //     });
    //     await campusDrive.tests[0].save();
    // }
    await assessment.save();
    await college.save();
    await campusDrive.save();
    res.status(200).json({
        success: true,
        message: "Test assigned successfully",
    });

})

// Get all students of a college for a campus drive
// Route: /api/company/campusdrive/:id/college/:collegeId/students

// exports.getStudentsOfCollege = catchAsyncErrors(async (req, res, next) => {
//     const campusDrive = await CampusDrive.findById(req.params.id);
//     if (!campusDrive) {
//         return next(new ErrorHandler("Campus drive not found", 404));
//     }
//     const college = await College.findById(req.params.collegeId);
//     if (!college) {
//         return next(new ErrorHandler("College not found", 404));
//     }
//     const students = await Student.find({college: req.params.collegeId});
//     res.status(200).json({
//         success: true,
//         students,
//     });
// });

// Get all students of a college for a campus drive
// Route: /api/company/campusdrive/:id/college/:collegeId/students

// get all student responses for a campus drive
// Route: /api/company/campusdrive/:id/studentresponses

exports.getStudentResponses = catchAsyncErrors(async (req, res, next) => {
    const query = {
        campusDrive: req.params.id,
        limit: req.query.limit,
        page: req.query.page,
       
        gte: req.query.gte,
        lt: req.query.lt,
        college: req.query.college,
        status: req.query.status,

    };
    const campusDrive = await CampusDrive.findById(req.params.id).populate({ path: 'tests.students.studentResponse' });

    if (!campusDrive) {
        return next(new ErrorHandler("Campus drive not found", 404));
    }

    const allStudentResponses = await campusDrive.tests.map((test) => test.students.map((student) => student.studentResponse));
    // const studentResponses = await StudentResponse.find({campusDrive: req.params.id});

    res.status(200).json({
        success: true,
        allStudentResponses,
        
    });
});







