const router = require('express').Router();



const { getAllStudents, getStudent, createStudent, loginStudent ,updateProfileStudent,resetPasswordStudent,forgotPasswordStudent, getStudentsByCollegeId, getStudentsByAssessmentId, getStudentsByJobId, logout, updateProfilePictureStudent, getResultByStudentId, getNewJobs, getRecommendedJobs, getYourAssessments} = require('../../controllers/student/studentController');



router.get('/all', getAllStudents);
router.get('/:id', getStudent);
router.post('/register', createStudent);
router.post('/login', loginStudent);
router.put('/update/:id', updateProfileStudent);
router.put('/update/avatar/:id', updateProfilePictureStudent);
router.put('/resetpassword/:id', resetPasswordStudent);
router.put('/forgotpassword', forgotPasswordStudent);
router.post('/logout', logout);

router.get('/college/:id', getStudentsByCollegeId);
router.get('assessments/:id', getStudentsByAssessmentId);
router.get('/job/:id', getStudentsByJobId);

// dashboard
router.get('/dashboard/asessments/:id', getYourAssessments);
router.get('/dashboard/result/:id', getResultByStudentId);
router.get('/dashboard/newjobs/:id', getNewJobs);
router.get('/dashboard/recommendedjobs/:id', getRecommendedJobs);




module.exports = router;
