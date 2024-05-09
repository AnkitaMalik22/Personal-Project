const { sendResponse } = require('../../controllers/student/studentTestController');
const { getTestDetailsForStudent ,getTestsForStudent} = require('../../controllers/student/studentTestController');

const router = require('express').Router();


router.get('/:studentId',getTestsForStudent);
router.get('/:testId/:studentId',getTestDetailsForStudent);
router.get('/response/:testId/:studentId',sendResponse);


module.exports = router;