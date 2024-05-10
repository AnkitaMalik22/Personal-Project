const { sendResponse, startAssessment } = require('../../controllers/student/studentTestController');
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
router.post("/start/:testId/:studentId",isAuthenticatedStudent,startAssessment);
router.get("/response/:testId/:studentId", sendResponse);

module.exports = router;
