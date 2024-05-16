const {
  sendResponse,
  startAssessment,
  sendResponseNonAdaptive,
  getStudentResult,
} = require("../../controllers/student/studentTestController");
const {
  getTestDetailsForStudent,
  getTestsForStudent,
} = require("../../controllers/student/studentTestController");
const {
  isAuthenticatedStudent,
  authorizeRoles,
} = require("../../middlewares/studentAuth");

const router = require("express").Router();

router.get("/", isAuthenticatedStudent, getTestsForStudent);
router.get("/:testId", isAuthenticatedStudent, getTestDetailsForStudent);
router.post("/start/:testId", isAuthenticatedStudent, startAssessment);
router.post("/response/:testId", isAuthenticatedStudent, sendResponse);
router.post(
  "/response/non-adaptive/:testId/:studentId",
  sendResponseNonAdaptive
);
router.get("/result/:testId/:studentId", getStudentResult);

module.exports = router;
