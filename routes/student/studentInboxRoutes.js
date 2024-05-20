const router = require("express").Router();

const {
  getEmailStudent,
} = require("../../controllers/student/inbox/inboxController");
const { isAuthenticatedStudent } = require("../../middlewares/studentAuth");

// router.get('/all', getAllStudents);
router.route("/getMails").get(isAuthenticatedStudent, getEmailStudent);

module.exports = router;
