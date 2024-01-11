const express = require('express');
const router = express.Router();
const assessmentsController = require('../../controllers/college/assessment/assessments');
const questionsController = require('../../controllers/college/assessment/questions');
const sectionsController = require('../../controllers/college/assessment/sections');
const answersController = require('../../controllers/college/assessment/answers');
const { isAuthenticatedUser } = require('../../middlewares/auth');

const { createAssessment, getAllAssessments, getAssessmentById, updateAssessmentById,deleteAssessmentById } = assessmentsController;
const { getAllQuestions, getQuestionById, createQuestion, updateQuestionById, deleteQuestionById } = questionsController;
const { getSectionsByAssessmentId, getSectionById, createSection, updateSection, deleteSection } = sectionsController;
const { setAnswer, getAnswerByQuestionId ,setAnswerIndex,addMarksLongAnswerStudent,updateMarksLongAnswerStudent, setLongAnswerStudent, getLongAnswerStudent, setAnswerIndexStudent, getAnswerUsingIndex, checkAnswerIndexStudent, addMarksMCQ, updateMarksMCQ } = answersController;

// ======================================================= ROUTES =======================================================


// Assessments Routes
router.get('/assessments', isAuthenticatedUser, getAllAssessments);
router.get('/assessments/:id', isAuthenticatedUser, getAssessmentById);
router.post('/assessments/create', isAuthenticatedUser, createAssessment);
router.put('/assessments/:id', isAuthenticatedUser, updateAssessmentById);
router.delete('/assessments/:id', isAuthenticatedUser, deleteAssessmentById);

// Sections Routes
router.post('sections/create', isAuthenticatedUser, createSection);
router.get('/sections/assessmentId', isAuthenticatedUser, getSectionsByAssessmentId);
router.get('/section/:id', isAuthenticatedUser, getSectionById);
router.put('/section/:id', isAuthenticatedUser, updateSection);
router.delete('/sections/:id', isAuthenticatedUser, deleteSection);

// Questions Routes
router.post('/questions/create/:sectionId', isAuthenticatedUser, createQuestion);
router.get('/questions/:sectionId', isAuthenticatedUser, getAllQuestions);
router.get('/question/:id', isAuthenticatedUser, getQuestionById);
router.put('/question/:id', isAuthenticatedUser, updateQuestionById);
router.delete('/questions/:id', isAuthenticatedUser, deleteQuestionById);

// Answers Routes FOR COLLEGE && COMPANY 
// Note : Need to implement authorized roles for college and company

// FOR MCQ
router.post('/answers/mcq/set/:questionId', isAuthenticatedUser, setAnswerIndex);
router.get('/answers/mcq/get/:questionId', isAuthenticatedUser, getAnswerUsingIndex);
// FOR LONG ANS
router.get('/answers/:questionId', isAuthenticatedUser, getAnswerByQuestionId);
router.post('/answers/set/:id', isAuthenticatedUser, setAnswer);





// Answers Routes FOR STUDENT

// FOR LONG ANS
router.post('/student/answers/long/set/:questionId', isAuthenticatedUser,setLongAnswerStudent);
router.get('/student/answers/long/get/:questionId', isAuthenticatedUser, getLongAnswerStudent);

// FOR MCQ
router.post('/student/answers/mcq/set/:questionId', isAuthenticatedUser, setAnswerIndexStudent);
router.get('/student/answers/mcq/check/:questionId', isAuthenticatedUser, checkAnswerIndexStudent);

// For Marks ----------- COLLEGE && COMPANY

router.get('/marks/long/add/:questionId', isAuthenticatedUser,addMarksLongAnswerStudent);
router.get('/marks/long/update/:questionId', isAuthenticatedUser,updateMarksLongAnswerStudent);

router.get('/marks/mcq/add/:questionId', isAuthenticatedUser, addMarksMCQ);
router.put('/marks/mcq/marks/update/:questionId', isAuthenticatedUser, updateMarksMCQ);






module.exports = router;
