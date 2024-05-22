const router = require("express").Router();

const {
  getEmailStudent,
  searchMail,
  sendEMail,
  deleteMail,
  sendReply,
  uploadAttachment,
  addMailBookmark,
  deleteBookmarkedMail,
} = require("../../controllers/student/inbox/inboxController");
const { isAuthenticatedStudent } = require("../../middlewares/studentAuth");

// router.get('/all', getAllStudents);
router.route("/sendMail").post(isAuthenticatedStudent, sendEMail);
router.route("/getMails").get(isAuthenticatedStudent, getEmailStudent);
router.route("/search").post(isAuthenticatedStudent, searchMail);
router.route("/delete/:id/:type").delete(isAuthenticatedStudent, deleteMail);
router.route("/reply").post(isAuthenticatedStudent, sendReply);
router.route("/file").post(isAuthenticatedStudent, uploadAttachment);
router
  .route("/bookmark/:id")
  .post(isAuthenticatedStudent, addMailBookmark)
  .delete(isAuthenticatedStudent, deleteBookmarkedMail);

module.exports = router;
