const express = require("express");
const router = express.Router();
const assessmentsController = require("../../controllers/college/assessment/assessments");
const questionsController = require("../../controllers/college/assessment/questions");
const sectionsController = require("../../controllers/college/assessment/sections");
const answersController = require("../../controllers/college/assessment/answers");
const {
  isAuthenticatedStudent,
  // isAuthenticatedCompany,
  authorizeRoles,
} = require("../../middlewares/auth");
const { isAuthenticatedCompany } = require("../../middlewares/companyAuth");
const {
  getResultGraph,
  getStudentsForTest,
  getRecentAssessments,
  removeRecentAssessment,
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessmentById,
  deleteAssessmentById,
  startAssessment,
  endAssessment,
  inviteStudentsToTest,
  getAssessmentOverview,getResultInExcel
} = assessmentsController;
const {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestionById,
  deleteQuestionById,
  getAllRecentQuestions,
} = questionsController;
const {
  getSectionsByAssessmentId,
  getSectionById,
  createSection,
  updateSection,
  deleteSections,
} = sectionsController;
const {
  setAnswer,
  getAnswerByQuestionId,
  setAnswerIndex,
  addMarksLongAnswerStudent,
  updateMarksLongAnswerStudent,
  setLongAnswerStudent,
  getLongAnswerStudent,
  setAnswerIndexStudent,
  getAnswerUsingIndex,
  checkAnswerIndexStudent,
  addMarksMCQ,
  updateMarksMCQ,
} = answersController;

const {
  addBookmark,
  getBookmarkById,
  getAllBookmarks,
  removeBookmark,
} = require("../../controllers/college/assessment/bookmark");
const { authenticateMultiDatabase } = require("../../middlewares/authMultiUser");
// ======================================================= ROUTES =======================================================



// Assessments Routes

router.get("/publish-report/:id",assessmentsController.generateReport);
router.get("/report/pdf/:id",assessmentsController.generateStudentReportPdf);

router.route("/result/graph").get(authenticateMultiDatabase, getResultGraph)

router.route("/students/:id").get(authenticateMultiDatabase, getStudentsForTest);
router.route("/recent").get(authenticateMultiDatabase, getRecentAssessments);
router
  .route("/recent/:id")
  .delete(authenticateMultiDatabase, removeRecentAssessment);
router.get(
  "/",
 authenticateMultiDatabase,
  getAllAssessments
);

router.get(
  "/download/:id",
  authenticateMultiDatabase, getResultInExcel
);
router.get(
  "/:id",
  authenticateMultiDatabase,
  getAssessmentById
);
router.get(
  "/overview/:id",
  authenticateMultiDatabase,
  getAssessmentOverview
);
router.post(
  "/create",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  createAssessment
);
router.put(
  "/:id",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  updateAssessmentById
);
router.delete(
  "/:id",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  deleteAssessmentById
);

// Start Assessment && End Assessment
router.post(
  "/start/:assessmentId/:studentId",
  isAuthenticatedStudent,
  // authorizeRoles("student"),
  startAssessment
);
router.post(
  "/end/:assessmentId/:studentId",
  isAuthenticatedStudent,
  // authorizeRoles("student"),
  endAssessment
);

// Sections Routes
router.post(
  "/sections/create",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  createSection
);
router.get(
  "/sections/assessmentId",
  authenticateMultiDatabase,
  getSectionsByAssessmentId
);
router.get(
  "/section/:id",
  authenticateMultiDatabase,
  getSectionById
);
router.put(
  "/section/:id",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  updateSection
);
router.post(
  "/sections",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  deleteSections
);

// Questions Routes
router.post(
  "/questions/create/:sectionId",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  createQuestion
);
router.get(
  "/questions/:sectionId",
  authenticateMultiDatabase,
  getAllQuestions
);
router.get(
  "/question/:id",
  authenticateMultiDatabase,
  getQuestionById
);
router.put("/question/:id", updateQuestionById);
router.delete(
  "/questions/:id",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  deleteQuestionById
);

// Answers Routes FOR COLLEGE && COMPANY
// Note : Need to implement authorized roles for college and company

// FOR MCQ
router.post(
  "/answers/mcq/set/:questionId",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  setAnswerIndex
);
router.get(
  "/answers/mcq/get/:questionId",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  getAnswerUsingIndex
);
// FOR LONG ANS
router.get(
  "/answers/:questionId",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  getAnswerByQuestionId
);
router.post(
  "/answers/set/:id",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  setAnswer
);

// =============================Answers Routes FOR STUDENT==========================================

// FOR LONG ANS
router.post(
  "/student/answers/long/set/:questionId",
  isAuthenticatedStudent,
  setLongAnswerStudent
);
router.get(
  "/student/answers/long/get/:questionId",
  isAuthenticatedStudent,
  getLongAnswerStudent
);

// FOR MCQ
router.post(
  "/student/answers/mcq/set/:questionId",
  isAuthenticatedStudent,
  setAnswerIndexStudent
);
router.get(
  "/student/answers/mcq/check/:questionId",
  isAuthenticatedStudent,
  checkAnswerIndexStudent
);

// For Marks ----------- COLLEGE && COMPANY

router.get(
  "/marks/long/add/:questionId",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  addMarksLongAnswerStudent
);
router.get(
  "/marks/long/update/:questionId",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  updateMarksLongAnswerStudent
);

router.get(
  "/marks/mcq/add/:questionId",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  addMarksMCQ
);
router.put(
  "/marks/mcq/marks/update/:questionId",
  authenticateMultiDatabase ,
  // authorizeRoles("college", "company"),
  updateMarksMCQ
);

//  BOOKMARKS ROUTES

router.post("/bookmarks/add", authenticateMultiDatabase, addBookmark);
router.get("/bookmarks/:id", authenticateMultiDatabase, getBookmarkById);
router.delete("/bookmarks/:id", authenticateMultiDatabase, removeBookmark);

router.get("/get/bookmarks", authenticateMultiDatabase, getAllBookmarks);

// RECENT USED QUESTIONS

router.get("/recent/questions", authenticateMultiDatabase, getAllRecentQuestions);

// INVITE STUDENTS TO ASSESSMENT
router.post(
  "/invite/students/:id",
  authenticateMultiDatabase,
  inviteStudentsToTest
);

module.exports = router;
