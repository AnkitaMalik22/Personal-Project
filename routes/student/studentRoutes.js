const router = require("express").Router();

const {
  removeLoggedOutUsers,
  getAllLoggedInUsers,
  logoutAUser,
  getAllStudents,
  getStudent,
  createStudent,
  loginStudent,
  updateProfileStudent,
  resetPasswordStudent,
  forgotPasswordStudent,
  getStudentsByCollegeId,
  getStudentsByAssessmentId,
  getStudentsByJobId,
  logout,
  updateProfilePictureStudent,
  updatePassword,
  getResultByStudentId,
  getNewJobs,
  getRecommendedJobs,
  getYourAssessments,
  generateQr,
  verifyQr,
  selectAuth,
  checkInvitation,
} = require("../../controllers/student/studentController");
const {
  isAuthenticatedStudent,
  authorizeRoles,
} = require("../../middlewares/studentAuth");
const { isAuthenticatedCollege } = require("../../middlewares/auth");
const {
  uploadCV,
  updatePersonalInfo,
  updateEducation,
  updateSkills,
  updateLinks,
  editEducation,
  uploadMedia,
} = require("../../controllers/student/profileController");
const { qrWare } = require("../../middlewares/qrWare");
const { authenticateMultiDatabase } = require("../../middlewares/authMultiUser");

router
  .route("/qr")
  .get(isAuthenticatedStudent, generateQr)
  .post(isAuthenticatedStudent, verifyQr);
router.route("/selectAuth").put(isAuthenticatedStudent, selectAuth);
// router.get('/all', getAllStudents);
router.route("/me").get(isAuthenticatedStudent, qrWare, getStudent);
router.get("/check/invite",checkInvitation)
router.post("/register", createStudent);
router.post("/login", loginStudent);
router.put("/update", isAuthenticatedStudent, updateProfileStudent);
router.put(
  "/update/avatar",
  isAuthenticatedStudent,
  updateProfilePictureStudent
);
router.put("/password/reset/:token", resetPasswordStudent);
router.post("/password/forgotpassword", forgotPasswordStudent);
router.put("/password/update", isAuthenticatedStudent, updatePassword);
router.route("/logout").get(isAuthenticatedStudent, logout);
router.route("/logout/user/:token").post(isAuthenticatedStudent, logoutAUser);
router
  .route("/remove/logout/user/:token")
  .post(isAuthenticatedStudent, removeLoggedOutUsers);
router
  .route("/loggedin/users")
  .get(isAuthenticatedStudent, getAllLoggedInUsers);

router.post("/profile/update/cv", isAuthenticatedStudent, uploadCV);
router.put(
  "/profile/update/personal",
  isAuthenticatedStudent,
  updatePersonalInfo
);
// add
router.post(
  "/profile/update/education",
  isAuthenticatedStudent,
  updateEducation
);
router.post(
  "/profile/update/education/media",
  isAuthenticatedStudent,
  uploadMedia
);
router.post("/profile/edit/education", isAuthenticatedStudent, editEducation);
router.post("/profile/update/skill", isAuthenticatedStudent, updateSkills);
router.post("/profile/update/link", isAuthenticatedStudent, updateLinks);
router.put(
  "/profile/update/avatar",
  isAuthenticatedStudent,
  updateProfilePictureStudent
);

router.post(
  "/college/get/all",
  authenticateMultiDatabase,
  getStudentsByCollegeId
);
router.get("assessments/:id", getStudentsByAssessmentId);
router.get("/job/:id", getStudentsByJobId);

// dashboard
router.get("/dashboard/asessments", isAuthenticatedStudent, getYourAssessments);
router.get("/dashboard/result", isAuthenticatedStudent, getResultByStudentId);
router.get("/dashboard/newjobs", getNewJobs);
router.get("/dashboard/recommendedjobs", getRecommendedJobs);

module.exports = router;
