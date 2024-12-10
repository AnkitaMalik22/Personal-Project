const express = require("express");
const router = express.Router();


const {
  registerCollege,
  loginCollege,
  getCollegeDetails,
  forgotPassword,
  updatePassword,
  resetPassword,
  updateProfile,
  logout,
  updateProfilePictureCollege,
  getTotalJobs,
  getTotalCompanies,
  getPlacedStudents,
  getRecentDesignatedCompanies,
  uploadStudents,
  getStudents,
  inviteStudents,
  getUploadedStudents,
  logoutAUser,
  getAllLoggedInUsers,
  removeLoggedOutUsers,
  generateQr,
  verifyQr,
  sendOtp,
  verifyOtp,
  checkExampleOtp,
  selectAuth,
  getPendingStudents,
  approveStudents,
  rejectStudent,
  selectStudentTest,
  getSelectedStudents,
  getRejectedStudents,
  resultOverviewGraph,
} = require("../../controllers/college/collegeController");
const {
  getAllAssessments,
} = require("../../controllers/college/assessment/assessments");
const uploadedStudents = require("../../models/student/uploadedStudents");
const {
  getAllStudents,

  getStudentById,
} = require("../../controllers/student/studentController");

const {
  createTopicCollege,
  getTopics,
  addQuestionsToTopicCollege,
  addTopicstoAssessment,
  uploadVideo,
} = require("../../controllers/college/assessment/sections");
const {
  sendEMail,
  getEmail,
  uploadAttachment,
  sendReply,
  searchMail,
  addMailBookmark,
  getBookmarkedMails,
  deleteBookmarkedMail,

  deleteMail,
  deleteCollegeMail,
  markAsSeen,
} = require("../../controllers/college/inbox/inboxController");
const { qrWare } = require("../../middlewares/qrWare");
const { authenticateMultiDatabase } = require("../../middlewares/authMultiUser");

// const videoUpload = require("../../utils/upload.js");
//inbox

router.route("/selectAuth").post(authenticateMultiDatabase, selectAuth);
router.route("/2fa/getSecretQr/:id").get(authenticateMultiDatabase, generateQr);
router.route("/2fa/verifyQr").post(authenticateMultiDatabase, verifyQr);
router.route("/register").post(registerCollege);
router.route("/login").post(loginCollege);
router.route("/me").get(authenticateMultiDatabase, qrWare, getCollegeDetails);
router.route("/password/reset/:token").put(resetPassword);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/update").put(authenticateMultiDatabase, updatePassword);
router.route("/logout").get(authenticateMultiDatabase, logout);
router.route("/logout/user/:token").post(authenticateMultiDatabase, logoutAUser);
router
  .route("/remove/logout/user/:token")
  .post(authenticateMultiDatabase, removeLoggedOutUsers);
router
  .route("/loggedin/users")
  .get(authenticateMultiDatabase, getAllLoggedInUsers);
router.route("/update").put(authenticateMultiDatabase, updateProfile);
router
  .route("/update/avatar")
  .put(authenticateMultiDatabase, updateProfilePictureCollege);

// 2FA - PHONE NUMBER VERIFICATION - OTP SMS

router.route("/otp/example").post(checkExampleOtp);
router.route("/otp/send").post(authenticateMultiDatabase, sendOtp);
router.route("/otp/verify").post(authenticateMultiDatabase, verifyOtp);

// upload students
router.post("/upload/students", authenticateMultiDatabase, uploadStudents);

// get uploaded students -- from excel
router.get("/upload/students/get", authenticateMultiDatabase, getUploadedStudents);

// get all registered students
router.get("/:id/students", authenticateMultiDatabase, getStudents);

// GET STUDENT DETAILS-- ID
router.get("/student/:id", authenticateMultiDatabase, getStudentById);

// REJECT | SELECT STUDENT ------ FOR TEST
router.post(
  "/test/status/:testId/:responseId",
  authenticateMultiDatabase,
  selectStudentTest
);
// GET ALL SELECTED STUDENTS------ FOR TEST
router.get(
  "/test/students/selected/:testId",
  authenticateMultiDatabase,
  getSelectedStudents
);
// GET ALL REJECTED STUDENTS------ FOR TEST
router.get(
  "/test/students/rejected/:testId",
  authenticateMultiDatabase,
  getRejectedStudents
);

// invite students
// router.post("/invite/students", authenticateMultiDatabase, inviteStudents);
// approve students
router.post("/student/approve", authenticateMultiDatabase, approveStudents);
// reject student
router.post(
  "/student/reject/:studentId",
  authenticateMultiDatabase,
  rejectStudent
);

// pending students
router.get("/students/pending", authenticateMultiDatabase, getPendingStudents);

// getAll assessment of a particular college

router.get("/assessments/all", authenticateMultiDatabase, getAllAssessments);

// college create topics

router.post("/topics/create",authenticateMultiDatabase, createTopicCollege);

// college get all topics
router.get("/topics/all", authenticateMultiDatabase, getTopics);

//college add topics to assessment // currently doing using frontend
router.post("/add-topics/:id", authenticateMultiDatabase, addTopicstoAssessment);

//college add question to topic // currently doing using frontend
router.post(
  "/add-questions/:topicId/:type",
authenticateMultiDatabase,
  addQuestionsToTopicCollege
);

router.post("/upload/video", authenticateMultiDatabase, uploadVideo);

// dashboard

// router.post("/dashboard/jobs", authenticateMultiDatabase, getTotalJobs);

router.get("/dashboard/jobs", authenticateMultiDatabase, getTotalJobs);

// router.get('/dashboard/students',authenticateMultiDatabase, getTotalStudents);
router.post(
  "/dashboard/assessments",
  authenticateMultiDatabase,
  getAllAssessments
);
// router.post("/dashboard/companies", authenticateMultiDatabase, getTotalCompanies);
router.get("/dashboard/companies/new/:collegeId", getRecentDesignatedCompanies);
router.get("/dashboard/companies/:collegeId", getTotalCompanies);
// router.post(
//   "/dashboard/companies/new",
//   authenticateMultiDatabase,
//   getRecentCompanies
// );

router.post(
  "/dashboard/placed/students",
  authenticateMultiDatabase,
  getPlacedStudents
);

// ======================== INBOX ROUTES =======================================
router.route("/inbox/seen/:id").put(authenticateMultiDatabase, markAsSeen);

router.route("/inbox/delete/:id").delete(authenticateMultiDatabase, deleteMail);
router.route("/inbox/search").post(authenticateMultiDatabase, searchMail);
router.route("/inbox/reply").post(authenticateMultiDatabase, sendReply);
router.route("/inbox/file").post(authenticateMultiDatabase, uploadAttachment);
router.route("/inbox/sendMail/:role").post(authenticateMultiDatabase, sendEMail);
router.route("/inbox/Mail").get(authenticateMultiDatabase, getEmail);
router
  .route("/inbox/bookmark/:id")
  .post(authenticateMultiDatabase, addMailBookmark);
router
  .route("/inbox/bookmark/:id")
  .delete(authenticateMultiDatabase, deleteBookmarkedMail);
router
  .route("/inbox/bookmarks")
  .get(authenticateMultiDatabase, getBookmarkedMails);
router.route("/inbox/mail").delete(authenticateMultiDatabase, deleteCollegeMail);

// ===========================================================================

router.route("/result/graph").get(authenticateMultiDatabase, resultOverviewGraph);

module.exports = router;
