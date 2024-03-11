const {Student} = require('../../models/student/studentModel');
const catchAsyncErrors = require('../../middlewares/catchAsyncErrors');
const sendToken = require('../../utils/jwtToken');
const ErrorHandler = require('../../utils/errorhandler');
const crypto = require('crypto');

const College = require('../../models/college/collegeModel');
const Assessments = require('../../models/college/assessment/assessments');
const StudentResponse = require('../../models/student/studentResponse');



// register dummy student

exports.registerStudent = catchAsyncErrors(async (req, res, next) => {
    const { FirstName, LastName, Email, Password,CollegeId } = req.body;

    const student = await Student.create({
        FirstName,
        LastName,
        Email,
        Password,
        CollegeId,
    });

    sendToken(student, 200, res);
});

exports.loginStudent = catchAsyncErrors(async (req, res, next) => {
    const { Email, Password } = req.body;

    // checks if email and password is entered by user
    if (!Email || !Password) {
        return next(new ErrorHandler('Please enter email & password', 400));
    }

    // finding user in database
    const student = await Student.findOne({ Email }).select('+password');

    if (!student) {
        return next(new ErrorHandler('Invalid Email or Password', 401));
    }

    // checks if password is correct or not
    const isPasswordMatched = await student.comparePassword(Password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid Email or Password', 401));
    }

    sendToken(student, 200, res);
}  );


exports.getStudentDetails = catchAsyncErrors(async (req, res, next) => {
    const student = await Student.findById(req.body.id).populate({
        path : 'studentTests',
        // select : 'name'
    });


    res.status(200).json({
        success: true,
        student
    });
}
);

exports.getAllStudents = catchAsyncErrors(async (req, res, next) => {
    const students = await Student.find({
        CollegeId: req.params.id
    });

    res.status(200).json({
        success: true,
        students
    });
});

exports.addTest = catchAsyncErrors(async (req, res, next) => {

    // const student = await Student.findById(req.student.id);
    const student = await Student.findById(req.body.id);

    const { testId } = req.body;

    student.studentTests.push(testId);

    await student.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message : 'Test added successfully'

    });
});

exports.getTestDetails = catchAsyncErrors(async (req, res, next) => {
    const { testId } = req.body;

    const testSections = await Assessments.findById(testId).populate({
        path: 'topics',
    });


    // questions: [{
//   type: mongoose.Schema.Types.ObjectId,
//   ref: 'Questions',
// }],
// findAnswers: [{
//   type: mongoose.Schema.Types.ObjectId,
//   ref: 'FindAnswer',
// }],
// essay :[
//   {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Essay',
//   }
// ],
// video :[
//   {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Video',
//   }
// ],
// compiler:[
//   {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Compiler',
//   }
// ],

   

  


    res.status(200).json({
        success: true,
        testSections
      
    });
});

exports.giveTest = catchAsyncErrors(async (req, res, next) => {
    const { testId, answers } = req.body;

    // Retrieve student and assessment based on provided IDs
    const student = await Student.findById(req.body.id);
    const assessment = await Assessments.findById(testId);

    if (!student || !assessment) {
        return next(new ErrorHandler('Student or Assessment not found', 404));
    }
    // student.Assessments.length > 0 ? student.Assessments.push(testId) : student.Assessments = [testId];
if(student.studentTests.length > 0){
    if (!student.studentTests.includes(testId)) {
        return next(new ErrorHandler('Test not started', 404));
    }
}else{
    return next(new ErrorHandler('Test not started', 404));
}
   

  const studentResponse = await StudentResponse.create({
    studentId: req.body.id,
    assessmentId: testId,
    answers
    });
 
        student.studentResponses.push(studentResponse._id);
    

    // Update assessment with student's responses
    assessment.studentResponses.push(studentResponse._id);

    // Save changes to student and assessment
    await student.save({ validateBeforeSave: false });
    await assessment.save({ validateBeforeSave: false });

    console.log(studentResponse);

    res.status(200).json({
        success: true,
        response: assessment.studentResponses
    });
});



// repsonse of a student by test id

exports.getStudentResponse = catchAsyncErrors(async (req, res, next) => {
    const studentResponse = await StudentResponse.find(
        {
            studentId: req.body.id,
            assessmentId: req.body.testId
        }
    )


    res.status(200).json({
        success: true,
        studentResponse
    });
}
);

// repsonse of a student by response id
exports.getStudentResponseById = catchAsyncErrors(async (req, res, next) => {
    const studentResponse = await StudentResponse.findById(req
        .params.id);

    res.status(200).json({
        success: true,
        studentResponse
    });
}
);


exports.getAllStudents = catchAsyncErrors(async (req, res, next) => {
    const students = await Student.find({
        CollegeId: req.params.id
    });

    res.status(200).json({
        success: true,
        students
    });
}
);
















