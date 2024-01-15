const router = require('express').Router();



const { getAllStudents, getStudent, createStudent, loginStudent ,updateProfileStudent,resetPasswordStudent,forgotPasswordStudent, getStudentsByCollegeId, getStudentsByAssessmentId, getStudentsByJobId, logout, updateProfilePictureStudent, getResultByStudentId, getNewJobs, getRecommendedJobs, getYourAssessments} = require('../../controllers/student/studentController');
const { isAuthenticatedStudent } = require('../../middlewares/auth');



router.get('/all', getAllStudents);
router.get('/me', isAuthenticatedStudent,getStudent);
router.post('/register', createStudent);
router.post('/login', loginStudent);
router.put('/update',isAuthenticatedStudent, updateProfileStudent);
router.put('/update/avatar',isAuthenticatedStudent, updateProfilePictureStudent);
router.put('/resetpassword', resetPasswordStudent);
router.put('/forgotpassword', forgotPasswordStudent);
router.post('/logout', logout);

router.get('/college/:id', getStudentsByCollegeId);
router.get('assessments/:id', getStudentsByAssessmentId);
router.get('/job/:id', getStudentsByJobId);


// dashboard
router.get('/dashboard/asessments',isAuthenticatedStudent, getYourAssessments);
router.get('/dashboard/result',isAuthenticatedStudent, getResultByStudentId);
router.get('/dashboard/newjobs', getNewJobs);
router.get('/dashboard/recommendedjobs', getRecommendedJobs);




module.exports = router;
