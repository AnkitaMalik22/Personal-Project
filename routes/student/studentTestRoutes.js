const { saveStudentScreenshot } = require("../../controllers/student/studentScreenshotController");
const {
  sendResponse,
  startAssessment,
  sendResponseNonAdaptive,
  getStudentResult,
  endAssessment,
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
router.post("/end/:testId", isAuthenticatedStudent, endAssessment);

// upload student screenshot

router.post("/:id/screenshot", isAuthenticatedStudent, saveStudentScreenshot);
router.post("/response/:testId", isAuthenticatedStudent, sendResponse);
router.post( "/response/non-adaptive/:testId",
  isAuthenticatedStudent,
  sendResponseNonAdaptive
);
router.get("/result/:testId/:studentId", getStudentResult);

module.exports = router;
