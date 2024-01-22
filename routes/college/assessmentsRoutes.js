const express = require('express');
const router = express.Router();
const assessmentsController = require('../../controllers/college/assessment/assessments');
const questionsController = require('../../controllers/college/assessment/questions');
const sectionsController = require('../../controllers/college/assessment/sections');
const answersController = require('../../controllers/college/assessment/answers');
const { isAuthenticatedStudent,isAuthenticatedCollege,isAuthenticatedCompany, authorizeRoles } = require('../../middlewares/auth');

const { createAssessment, getAllAssessments, getAssessmentById, updateAssessmentById,deleteAssessmentById,startAssessment,endAssessment } = assessmentsController;
const { getAllQuestions, getQuestionById, createQuestion, updateQuestionById, deleteQuestionById } = questionsController;
const { getSectionsByAssessmentId, getSectionById, createSection, updateSection, deleteSection } = sectionsController;
const { setAnswer, getAnswerByQuestionId ,setAnswerIndex,addMarksLongAnswerStudent,updateMarksLongAnswerStudent, setLongAnswerStudent, getLongAnswerStudent, setAnswerIndexStudent, getAnswerUsingIndex, checkAnswerIndexStudent, addMarksMCQ, updateMarksMCQ } = answersController;

// ======================================================= ROUTES =======================================================


// Assessments Routes
router.get('/', isAuthenticatedCollege || isAuthenticatedCompany,
 getAllAssessments);
router.get('/:id', isAuthenticatedCollege || isAuthenticatedCompany || isAuthenticatedStudent, 
getAssessmentById);
router.post('/create', isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), createAssessment);
router.put('/:id', isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), updateAssessmentById);
router.delete('/:id', isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), deleteAssessmentById);

// Start Assessment && End Assessment
router.post('/start/:assessmentId/:studentId', isAuthenticatedStudent,authorizeRoles('student'), startAssessment);
router.post('/end/:assessmentId/:studentId', isAuthenticatedStudent,authorizeRoles('student'), endAssessment);


// Sections Routes
router.post('/sections/create', isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), createSection);
router.get('/sections/assessmentId',isAuthenticatedCollege || isAuthenticatedCompany || isAuthenticatedStudent, getSectionsByAssessmentId);
router.get('/section/:id',isAuthenticatedCollege || isAuthenticatedCompany || isAuthenticatedStudent, getSectionById);
router.put('/section/:id', isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), updateSection);
router.delete('/sections/:id',isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), deleteSection);

// Questions Routes
router.post('/questions/create/:sectionId', isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), createQuestion);
router.get('/questions/:sectionId', isAuthenticatedCollege || isAuthenticatedCompany || isAuthenticatedStudent, getAllQuestions);
router.get('/question/:id',isAuthenticatedCollege || isAuthenticatedCompany || isAuthenticatedStudent, getQuestionById);
router.put('/question/:id',  isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), updateQuestionById);
router.delete('/questions/:id', isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), deleteQuestionById);

// Answers Routes FOR COLLEGE && COMPANY 
// Note : Need to implement authorized roles for college and company

// FOR MCQ
router.post('/answers/mcq/set/:questionId', isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), setAnswerIndex);
router.get('/answers/mcq/get/:questionId',  isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), getAnswerUsingIndex);
// FOR LONG ANS
router.get('/answers/:questionId',  isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), getAnswerByQuestionId);
router.post('/answers/set/:id',  isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), setAnswer);





// =============================Answers Routes FOR STUDENT==========================================

// FOR LONG ANS
router.post('/student/answers/long/set/:questionId',isAuthenticatedStudent,setLongAnswerStudent);
router.get('/student/answers/long/get/:questionId',isAuthenticatedStudent, getLongAnswerStudent);

// FOR MCQ
router.post('/student/answers/mcq/set/:questionId',isAuthenticatedStudent, setAnswerIndexStudent);
router.get('/student/answers/mcq/check/:questionId',isAuthenticatedStudent, checkAnswerIndexStudent);

// For Marks ----------- COLLEGE && COMPANY

router.get('/marks/long/add/:questionId',  isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'),addMarksLongAnswerStudent);
router.get('/marks/long/update/:questionId',  isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'),updateMarksLongAnswerStudent);

router.get('/marks/mcq/add/:questionId',  isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), addMarksMCQ);
router.put('/marks/mcq/marks/update/:questionId',  isAuthenticatedCollege || isAuthenticatedCompany,authorizeRoles('college','company'), updateMarksMCQ);






module.exports = router;
