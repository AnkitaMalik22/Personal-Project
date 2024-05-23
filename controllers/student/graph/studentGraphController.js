

const mongoose = require('mongoose');
const catchAsyncErrors = require('../../../middlewares/catchAsyncErrors');
const ErrorHandler = require('../../../utils/errorhandler');
const {Student} = require('../../../models/student/studentModel');
const StudentResponse = require('../../../models/student/studentResponse');
const CollegeAssessInvite = require('../../../models/student/assessmentInvitation');



// ===============================================| DASHBOARD GRAPH |==========================================================

// 1. total tests appeared by student => studentResponse.find({studentId: req.params.studentId}).count()
// 2. total tests selected by student => studentResponse.find({studentId: req.params.studentId, status: 'selected'}).count()
// 3. total pending results by student => studentResponse.find({studentId: req.params.studentId, status: 'pending'}).count()
// by day , week , month , year wise

// pending students = CollegeAssessInvite.find({assessmentId: req.params.assessmentId, attepmts :0})


exports.getStudentGraph = catchAsyncErrors(async (req, res, next) => {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
        return next(new ErrorHandler("Student not found", 404));
    }

    const studentId = new mongoose.Types.ObjectId(req.params.studentId);

    const daily = await aggregateResults(studentId, 'day');
    const weekly = await aggregateResults(studentId, 'week');
    const monthly = await aggregateResults(studentId, 'month');
    const quarterly = await aggregateResults(studentId, 'quarter');
    const yearly = await aggregateResults(studentId, 'year');

    res.status(200).json({
        success: true,
        daily,
        weekly,
        monthly,
        quarterly,
        yearly
    });
});

// ---------------------------------------------------- Aggregate Results ----------------------------------------------------

const aggregateResults = async (studentId, interval) => {
    const groupId = getGroupId(interval);

    // Retrieve the total number of assessments the student has been invited to
    const totalInvites = await CollegeAssessInvite.find({ student: studentId }).countDocuments();

    
    const results = await StudentResponse.aggregate([
        { $match: { studentId } },
        {
            $group: {
                _id: groupId,
                totalStudentsAppeared: { $sum: 1 },
                totalStudentsSelected: {
                    $sum: { $cond: [{ $eq: ["$status", "selected"] }, 1, 0] }
                },
                totalStudentsRejected:{
                    $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
                },
                totalMarks: {
                    $sum: "$totalMarks"
                }
            }
        },
        {
            $project: {
                _id: 0,
                time: "$_id",
                totalStudentsAppeared: 1,
                totalStudentsSelected: 1,
                totalStudentsRejected: 1,
                totalMarks: 1,
            }
        },
        { $sort: { time: 1 } }
    ]);

    return results;
};


// ---------------------------------------------- Get Group Id -------------------------------------------------------

const getGroupId = (interval) => {
    switch (interval) {
        case 'day':
            return { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        case 'week':
            return { $concat: [{ $dateToString: { format: "%Y-", date: "$createdAt" } }, { $toString: { $isoWeek: "$createdAt" } }] };
        case 'month':
            return { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        case 'quarter':
            return {
                $concat: [
                    { $dateToString: { format: "%Y", date: "$createdAt" } },
                    "-Q",
                    { $toString: { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } } }
                ]
            };
        case 'year':
            return { $dateToString: { format: "%Y", date: "$createdAt" } };
        default:
            throw new Error("Invalid interval");
    }
};


// ================================================ RESULT PAGE =================================================

// 1. YOUR SCORE => STUDENT RESPONSE . TOTAL MARKS
// 2. TOTAL MARKS => ASSESSMENT . TOTAL MARKS


exports.getStudentResult = catchAsyncErrors(async (req, res, next) => {
    const studentId = req.params.studentId;

    try {
        const invites = await CollegeAssessInvite.find({ student: studentId }).populate('assessments.assessment');

        const results = [];

        await Promise.all(invites.map(async invite => {
            await Promise.all(invite.assessments.map(async assessment => {
                const res = await StudentResponse.find({
                    assessmentId: assessment.assessment,
                    studentId: studentId
                });
                
                res.forEach(r => {
                    results.push({
                        assessmentName: assessment.assessment.name,
                        attemptNumber: r.attempt,
                        totalMarks: r.marks,
                        studentMarks: r.totalMarks,
                    });
                });
            }));
        }));
        
        // console.log(results);
        
        
        res.status(200).json({
            success: true,
            results
        });
        
    } catch (error) {
        return next(new ErrorHandler("Error fetching student results", 500));
    }
});

