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
  getUploadedStudents
} = require("../../controllers/college/collegeController");
const { getAllAssessments } = require("../../controllers/college/assessment/assessments");
const uploadedStudents = require("../../models/student/uploadedStudents");
const { getAllStudents } = require("../../controllers/student/studentController");


router.route("/register").post(registerCollege);
router.route("/login").post(loginCollege);
router.route("/me").get(isAuthenticatedCollege, getCollegeDetails);
router.route("/password/reset/:token").put(resetPassword);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/update").put(isAuthenticatedCollege, updatePassword);
router.route("/logout").get(logout);
router.route("/update").put(isAuthenticatedCollege, updateProfile);
router.route ("/update/avatar").put(isAuthenticatedCollege, updateProfilePictureCollege);


// upload students
router.post('/upload/students',isAuthenticatedCollege, uploadStudents);

// get uploaded students -- from excel
router.get('/upload/students/get',isAuthenticatedCollege, getUploadedStudents);

// get all registered students
router.get('/students',isAuthenticatedCollege, getStudents );

// invite students
router.post('/invite/students',isAuthenticatedCollege, inviteStudents);



// dashboard

router.post('/dashboard/jobs',isAuthenticatedCollege, getTotalJobs);
// router.get('/dashboard/students',isAuthenticatedCollege, getTotalStudents);
router.post('/dashboard/assessments',isAuthenticatedCollege, getAllAssessments );
router.post('/dashboard/companies',isAuthenticatedCollege, getTotalCompanies);
router.post ('/dashboard/companies/new',isAuthenticatedCollege, getRecentCompanies);
router.post('/dashboard/placed/students',isAuthenticatedCollege, getPlacedStudents);
module.exports = router;
