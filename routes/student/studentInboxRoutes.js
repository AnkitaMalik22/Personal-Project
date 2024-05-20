const router = require("express").Router();

const {
  getEmailStudent,
  searchMail,
} = require("../../controllers/student/inbox/inboxController");
const { isAuthenticatedStudent } = require("../../middlewares/studentAuth");

// router.get('/all', getAllStudents);
router.route("/getMails").get(isAuthenticatedStudent, getEmailStudent);
router.route("/search").post(isAuthenticatedStudent, searchMail);

module.exports = router;
