const express = require("express");
const router = express.Router();
const assessmentsController = require("../../controllers/college/assessment/assessments");
const questionsController = require("../../controllers/college/assessment/questions");
const sectionsController = require("../../controllers/college/assessment/sections");
const answersController = require("../../controllers/college/assessment/answers");
const { authorizeRoles } = require("../../middlewares/auth");
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
  getAssessmentOverview,
  getResultInExcel,
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
  getAnswerUsingIndex,
  addMarksMCQ,
  updateMarksMCQ,
} = answersController;

const {
  addBookmark,
  getBookmarkById,
  getAllBookmarks,
  removeBookmark,
} = require("../../controllers/college/assessment/bookmark");

// ======================================================= ROUTES =======================================================


router.get("/1", isAuthenticatedCompany, (req, res) => {
  res.send("Test route for company middleware");
});

// Assessments Routes
router.route("/result/graph").get(isAuthenticatedCompany, getResultGraph);

router.route("/students/:id").get(isAuthenticatedCompany, getStudentsForTest);
router.route("/recent").get(isAuthenticatedCompany, getRecentAssessments);
router
  .route("/recent/:id")
  .delete(isAuthenticatedCompany, removeRecentAssessment);
router.get("/", isAuthenticatedCompany, getAllAssessments);

router.get("/download/:id", isAuthenticatedCompany, getResultInExcel);
router.get("/:id", isAuthenticatedCompany, getAssessmentById);
router.get("/overview/:id", isAuthenticatedCompany, getAssessmentOverview);
router.post(
  "/create",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  createAssessment
);
router.put(
  "/:id",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  updateAssessmentById
);
router.delete(
  "/:id",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  deleteAssessmentById
);

// Sections Routes
router.post(
  "/sections/create",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  createSection
);
router.get(
  "/sections/assessmentId",
  isAuthenticatedCompany,
  getSectionsByAssessmentId
);
router.get("/section/:id", isAuthenticatedCompany, getSectionById);
router.put(
  "/section/:id",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  updateSection
);
router.post(
  "/sections",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  deleteSections
);

// Questions Routes
router.post(
  "/questions/create/:sectionId",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  createQuestion
);
router.get("/questions/:sectionId", isAuthenticatedCompany, getAllQuestions);
router.get("/question/:id", isAuthenticatedCompany, getQuestionById);
router.put("/question/:id", updateQuestionById);
router.delete(
  "/questions/:id",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  deleteQuestionById
);

// Answers Routes FOR COLLEGE && COMPANY
// Note : Need to implement authorized roles for college and company

// FOR MCQ
router.post(
  "/answers/mcq/set/:questionId",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  setAnswerIndex
);
router.get(
  "/answers/mcq/get/:questionId",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  getAnswerUsingIndex
);
// FOR LONG ANS
router.get(
  "/answers/:questionId",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  getAnswerByQuestionId
);
router.post(
  "/answers/set/:id",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  setAnswer
);

// For Marks ----------- COLLEGE && COMPANY

router.get(
  "/marks/long/add/:questionId",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  addMarksLongAnswerStudent
);
router.get(
  "/marks/long/update/:questionId",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  updateMarksLongAnswerStudent
);

router.get(
  "/marks/mcq/add/:questionId",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  addMarksMCQ
);
router.put(
  "/marks/mcq/marks/update/:questionId",
  isAuthenticatedCompany,
  authorizeRoles("college", "company"),
  updateMarksMCQ
);

//  BOOKMARKS ROUTES

router.post("/bookmarks/add", isAuthenticatedCompany, addBookmark);
router.get("/bookmarks/:id", isAuthenticatedCompany, getBookmarkById);
router.delete("/bookmarks/:id", isAuthenticatedCompany, removeBookmark);

router.get("/get/bookmarks", isAuthenticatedCompany, getAllBookmarks);

// RECENT USED QUESTIONS

router.get("/recent/questions", isAuthenticatedCompany, getAllRecentQuestions);

// INVITE STUDENTS TO ASSESSMENT
router.post(
  "/invite/students/:id",
  isAuthenticatedCompany,
  inviteStudentsToTest
);

router.post("/topics/create", isAuthenticatedCompany, sectionsController.createTopicCollege);

router.get("/topics/all", isAuthenticatedCompany, sectionsController.getTopics);

//college add topics to assessment // currently doing using frontend
// router.post("/add-topics/:id", isAuthenticatedCollege, addTopicstoAssessment);


router.post(
  "/add-questions/:topicId/:type",
  isAuthenticatedCompany,
  sectionsController.addQuestionsToTopicCollege
);



module.exports = router;
