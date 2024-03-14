const router = require('express').Router();


const {registerStudent,loginStudent,getStudentDetails,getAllStudents,addTest,getTestDetails,giveTest, getStudentResponse, getStudentResponseById} = require('../../controllers/student/studentDummy');


router.route('/register').post(registerStudent);
router.route('/login').post(loginStudent);
router.route('/me/:id').get(getStudentDetails);

router.route('/all/:id').get(getAllStudents);
router.route('/add/test').post(addTest);
// router.route('/add/marks').post(addMarks);
router.route('/get/test-details/:id').get(getTestDetails);
router.route('/answer/test').post(giveTest);
router.route('/response/details').get(getStudentResponse);
router.route('/response/:id').get(getStudentResponseById);
router.route('/students/:id').get(getAllStudents);






module.exports = router;