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
  getRecentCompanies
} = require("../../controllers/college/collegeController");
const { getAllAssessments } = require("../../controllers/college/assessment/assessments");


router.route("/register").post(registerCollege);
router.route("/login").post(loginCollege);
router.route("/me").get(isAuthenticatedCollege, getCollegeDetails);
router.route("/password/reset/:token").put(resetPassword);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/update").put(isAuthenticatedCollege, updatePassword);
router.route("/logout").get(logout);
router.route("/update").put(isAuthenticatedCollege, updateProfile);
router.route ("/update/avatar").put(isAuthenticatedCollege, updateProfilePictureCollege);


// dashboard

router.post('/dashboard/jobs',isAuthenticatedCollege, getTotalJobs);
// router.get('/dashboard/students',isAuthenticatedCollege, getTotalStudents);
router.post('/dashboard/assessments',isAuthenticatedCollege, getAllAssessments );
router.post('/dashboard/companies',isAuthenticatedCollege, getTotalCompanies);
router.post ('/dashboard/companies/new',isAuthenticatedCollege, getRecentCompanies);
router.post('/dashboard/placed/students',isAuthenticatedCollege, getPlacedStudents);
module.exports = router;
