const { getTestDetailsForStudent ,getTestsForStudent} = require('../../controllers/student/studentTestController');

const router = require('express').Router();


router.get('/:studentId',getTestsForStudent);
router.get('/:testId/:studentId',getTestDetailsForStudent);


module.exports = router;