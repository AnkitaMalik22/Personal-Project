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

module.exports = router;
