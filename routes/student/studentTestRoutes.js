const {
  sendResponse,
  startAssessment,
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

module.exports = router;
