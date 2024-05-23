const express = require('express');
const router = express.Router();
const { getStudentGraph, getStudentResult } = require('../../controllers/student/graph/studentGraphController');

router.get('/:studentId', getStudentGraph);
router.get('/result/:studentId', getStudentResult);

module.exports = router;
