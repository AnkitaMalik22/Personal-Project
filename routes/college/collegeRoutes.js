const express = require("express");
const router = express.Router();
const { isAuthenticatedCollege } = require("../../middlewares/auth");

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
  getRecentCompanies,
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
} = require("../../controllers/college/collegeController");
const {
  getAllAssessments,
} = require("../../controllers/college/assessment/assessments");
const uploadedStudents = require("../../models/student/uploadedStudents");
const {
  getAllStudents,
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
} = require("../../controllers/college/inbox/inboxController");
const { qrWare } = require("../../middlewares/qrWare");

// const videoUpload = require("../../utils/upload.js");
//inbox

router.route("/selectAuth").post(isAuthenticatedCollege, selectAuth);
router.route("/2fa/getSecretQr/:id").get(generateQr);
router.route("/2fa/verifyQr").post(isAuthenticatedCollege, verifyQr);
router.route("/register").post(registerCollege);
router.route("/login").post(loginCollege);
router.route("/me").get(isAuthenticatedCollege, qrWare, getCollegeDetails);
router.route("/password/reset/:token").put(resetPassword);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/update").put(isAuthenticatedCollege, updatePassword);
router.route("/logout").get(isAuthenticatedCollege, logout);
router.route("/logout/user/:token").post(isAuthenticatedCollege, logoutAUser);
router
  .route("/remove/logout/user/:token")
  .post(isAuthenticatedCollege, removeLoggedOutUsers);
router
  .route("/loggedin/users")
  .get(isAuthenticatedCollege, getAllLoggedInUsers);
router.route("/update").put(isAuthenticatedCollege, updateProfile);
router
  .route("/update/avatar")
  .put(isAuthenticatedCollege, updateProfilePictureCollege);

// 2FA - PHONE NUMBER VERIFICATION - OTP SMS

router.route("/otp/example").post(checkExampleOtp);
router.route("/otp/send").post(isAuthenticatedCollege, sendOtp);
router.route("/otp/verify").post(isAuthenticatedCollege, verifyOtp);

// upload students
router.post("/upload/students", isAuthenticatedCollege, uploadStudents);

// get uploaded students -- from excel
router.get("/upload/students/get", isAuthenticatedCollege, getUploadedStudents);

// get all registered students
router.get("/:id/students", isAuthenticatedCollege, getStudents);

// invite students
router.post("/invite/students", isAuthenticatedCollege, inviteStudents);
// approve students
router.post("/student/approve", isAuthenticatedCollege, approveStudents);

// pending students
router.get("/students/pending", isAuthenticatedCollege, getPendingStudents);

// getAll assessment of a particular college

router.get("/assessments/all", isAuthenticatedCollege, getAllAssessments);

// college create topics

router.post("/topics/create", isAuthenticatedCollege, createTopicCollege);

// college get all topics
router.get("/topics/all", isAuthenticatedCollege, getTopics);

//college add topics to assessment // currently doing using frontend
router.post("/add-topics/:id", isAuthenticatedCollege, addTopicstoAssessment);

//college add question to topic // currently doing using frontend
router.post(
  "/add-questions/:topicId/:type",
  isAuthenticatedCollege,
  addQuestionsToTopicCollege
);

router.post("/upload/video", isAuthenticatedCollege, uploadVideo);

// dashboard

// router.post("/dashboard/jobs", isAuthenticatedCollege, getTotalJobs);
router.post("/dashboard/jobs",getTotalJobs);
// router.get('/dashboard/students',isAuthenticatedCollege, getTotalStudents);
router.post(
  "/dashboard/assessments",
  isAuthenticatedCollege,
  getAllAssessments
);
// router.post("/dashboard/companies", isAuthenticatedCollege, getTotalCompanies);
router.post("/dashboard/companies", getTotalCompanies);
// router.post(
//   "/dashboard/companies/new",
//   isAuthenticatedCollege,
//   getRecentCompanies
// );
router.post(
  "/dashboard/companies/new", getRecentCompanies
);
router.post(
  "/dashboard/placed/students",
  isAuthenticatedCollege,
  getPlacedStudents
);

// ======================== INBOX ROUTES =======================================

router.route("/inbox/delete/:id").delete(isAuthenticatedCollege, deleteMail);
router.route("/inbox/search").post(isAuthenticatedCollege, searchMail);
router.route("/inbox/reply").post(isAuthenticatedCollege, sendReply);
router.route("/inbox/file").post(isAuthenticatedCollege, uploadAttachment);
router.route("/inbox/sendMail/:role").post(isAuthenticatedCollege, sendEMail);
router.route("/inbox/Mail").get(isAuthenticatedCollege, getEmail);
router
  .route("/inbox/bookmark/:id")
  .post(isAuthenticatedCollege, addMailBookmark);
router
  .route("/inbox/bookmark/:id")
  .delete(isAuthenticatedCollege, deleteBookmarkedMail);
router
  .route("/inbox/bookmarks")
  .get(isAuthenticatedCollege, getBookmarkedMails);
router.route("/inbox/mail").delete(isAuthenticatedCollege, deleteCollegeMail);

module.exports = router;
