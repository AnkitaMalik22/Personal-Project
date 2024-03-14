const { Student } = require('../../models/student/studentModel');
const catchAsyncErrors = require('../../middlewares/catchAsyncErrors');
const sendToken = require('../../utils/jwtToken');
const ErrorHandler = require('../../utils/errorhandler');
const crypto = require('crypto');

const College = require('../../models/college/collegeModel');
const Assessments = require('../../models/college/assessment/assessments');
const StudentResponse = require('../../models/student/studentResponse');




// register dummy student

exports.registerStudent = catchAsyncErrors(async (req, res, next) => {
    const { FirstName, LastName, Email, Password, CollegeId } = req.body;
  console.log("dummy student")

    const student = await Student.create({
        FirstName,
        LastName,
        Email,
        Password,
        CollegeId,
    });
    console.log(student);

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
});


exports.getStudentDetails = catchAsyncErrors(async (req, res, next) => {
    const student = await Student.findById(req.body.id).populate({
        path: 'studentTests',
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
    // if (!student) {
    //     return next(new ErrorHandler('Student not found', 404));
    // }

    if (student.studentTests.includes(testId)) {
        return next(new ErrorHandler('Test already added', 400));
    }

    student.studentTests.push(testId);
    

    await student.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: 'Test added successfully'

    });
});

exports.getTestDetails = catchAsyncErrors(async (req, res, next) => {
    // const { testId } = req.params;

    // Find the assessment
    const testSections = await Assessments.findById(req.params.id).populate({
        path: 'studentResponses'
    });
    
    // Fetch all students
    const allStudents = await Student.find();
    
    // Iterate over each student response and add it to the respective student
    const populatedStudents = allStudents.map(student => {
        const response = testSections.studentResponses.find(response => response.studentId.toString() === student._id.toString());
       console.log(response._id, "response");
       
        if (response) {
            // Add the response to the student object
            student.response = response;
        } else {
            // If no response found, set it to null or an empty object
            student.response = null; // or {}
        }
     
        return student;
    });

//   populatedStudents.forEach(student => {
//     console.log(student.response, "student.response");
//     }
//     );
    
    res.status(200).json({
        success: true,
        students: populatedStudents
    });
    
});

exports.giveTest = catchAsyncErrors(async (req, res, next) => {
    const { testId, } = req.body;

    // Retrieve student and assessment based on provided IDs
    const student = await Student.findById(req.body.id);
    const assessment = await Assessments.findById(testId);

    if (!student || !assessment) {
        return next(new ErrorHandler('Student or Assessment not found', 404));
    }
    // student.studentTests.length > 0 ? student.studentTests.push(testId) : student.studentTests = [testId];
    // if(student.studentTests.length > 0){
    //     if (!student.studentTests.includes(testId)) {
    //         return next(new ErrorHandler('Test not started', 404));
    //     }
    // }else{
    //     return next(new ErrorHandler('Test not started', 404));
    // }

    if (!student.studentTests.includes(testId)) {
        return next(new ErrorHandler('Test not started', 404));
    }

    if(assessment.studentResponses.includes(student._id)){
        return next(new ErrorHandler('Test already submitted', 404));
    }


    const studentResponse = await StudentResponse.create({
        studentId: req.body.id,
        assessmentId: testId,
        ...req.body
    });

    student.studentResponses.push(studentResponse._id);


    // Update assessment with student's responses
    assessment.studentResponses.push(studentResponse._id);

    // Save changes to student and assessment
    await student.save({ validateBeforeSave: false });
    await assessment.save({ validateBeforeSave: false });



    // evaluate the student response ---- working only for mcq
    let mcqMarks = 0;
    // console.log(studentResponse.topics , "studentResponse.topics.questions");
    // console.log(studentResponse.topics[0], "studentResponse.topics.questions");

    if (studentResponse.topics[0] && studentResponse.topics[0].questions) {
        //    console.log(studentResponse.topics[0].questions[0], "studentResponse.topics[0].questions");
                studentResponse.topics[0].questions.forEach(async (question) => {
        
                    console.log(question.AnswerIndex, question.StudentAnswerIndex, );
        
                    if (question.AnswerIndex === question.StudentAnswerIndex) {
                        mcqMarks += 1;
                    }
                });
            }
        // studentResponse?.topics?.forEach(topic => {
        //     // [0].questions.forEach(async (question) => {

        //     //     console.log(question.AnswerIndex, question.StudentAnswerIndex, );
    
        //     //     if (question.AnswerIndex === question.StudentAnswerIndex) {
        //     //         mcqMarks += 1;
        //     //     }
        //     // });
        //     if(topic?.Type === 'mcq'){
        //         topic?.questions?.forEach(question => {
        //             if (question.AnswerIndex === question.StudentAnswerIndex) {
        //                 mcqMarks += 1;
        //             }
        //         });
        //     }
        // })
            
    

//     let codingMarks = 0;
//     if (studentResponse.topics[0] && studentResponse.topics[0].compiler) {

//    studentResponse.topics[0].compiler.testcase.forEach(test => {
//         if (test.studentOutput === test.expectedOutput) {
//             test.passed = true;
//             // if all the testcases are passed then increment the codingMarks
//             if (test.passed) {
//                 codingMarks += 1;
//             }else{
//                 codingMarks += 0;
//             }
//         }
//     });

//     }


 
    
    studentResponse.marks = mcqMarks + codingMarks;
    studentResponse.percentage = (mcqMarks + codingMarks) / (studentResponse.forEach(topic => topic.questions.length + topic.compiler.testcase.length) * 100);
    studentResponse.mcqMarks = mcqMarks;
    studentResponse.codingMarks = codingMarks;

    await studentResponse.save({ validateBeforeSave: false });

    // console.log(studentResponse);

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
    ).populate("questions")
        .populate("essay")
        .populate("video")
        .populate("findAnswers")
        .populate("compiler");



    res.status(200).json({
        success: true,
        studentResponse
    });
}
);

// repsonse of a student by response id
exports.getStudentResponseById = catchAsyncErrors(async (req, res, next) => {
    console.log(req.params.id);
    const studentResponse = await StudentResponse.findById(req
        .params.id);
        console.log(studentResponse);

    res.status(200).json({
        success: true,
        studentResponse
    });
}
);

// response by studentId and testId
exports.getStudentResponseByStudentIdAndTestId = catchAsyncErrors(async (req, res, next) => {
    const studentResponse = await StudentResponse.find(
        {
            studentId: req.query.studentId,
            assessmentId: req.query.testId
        }
    );

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


// ---------- evaluate student response ----------------

exports.evaluateResponse = catchAsyncErrors(async (req, res, next) => {
    const { responseId, marks } = req.body;

    const studentResponse = await StudentResponse.findById(responseId);

    if (!studentResponse) {
        return next(new ErrorHandler('Student Response not found', 404));
    }

    let mcqMarks = 0;
    studentResponse.questions.forEach(async (question) => {
        // const ques = await question.findById(question.questionId);
        // as for the topic question we wont have the questionId so we will have to find the question find()method

        if (question.AnswerIndex === question.correctAnswerIndex) {
            mcqMarks += 1;
        }
    });

    let codingMarks = 0;
    let totalTestCasesMatched;

    studentResponse.compiler.testcase.forEach(test => {
        if (test.studentOutput === test.expectedOutput) {
            test.passed = true;
        }
    });

    studentResponse.compiler.testcase.forEach(test => {
        if (test.passed) {
            codingMarks += 1;
        }
    });
    



    // studentResponse.compiler.forEach(async (compiler) => {
    //     const ques = await Compiler.findById(compiler.questionId);
    //   compiler.testcases.forEach(testcase => {
    // // if the req.body.code gives the same output as the testcase outputs then increment the codingMarks
    // //how to run the code and get the output of the code and compare it with the testcase output

    //   });
    // });


    // let essayMarks = 0;
    // studentResponse.essay.forEach(essay => {
    //     const ques = await Essay.findById(essay.questionId);
    //     essayMarks += req.body.essayMarks;

    // }

    // );

    // let videoMarks = 0;
    // studentResponse.video.forEach(video => {
    //     const ques = await Video.findById(video.questionId);
    //     videoMarks += req.body.videoMarks;



    studentResponse.marks = marks;


    await studentResponse.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        studentResponse
    });
}
);



// to add marks to the student response by the teacher

exports.updateStudentResponse = catchAsyncErrors(async (req, res, next) => {
    const { responseId } = req.params;
    const studentResponse = await StudentResponse
        .findById
        (responseId);

    if (!studentResponse) {
        return next(new ErrorHandler('Student Response not found', 404));
    }

    // update the student response
    studentResponse = req.body;
    await studentResponse.save({ validateBeforeSave: false });


    res.status(200).json({
        success: true,
        studentResponse
    });
}
);

















