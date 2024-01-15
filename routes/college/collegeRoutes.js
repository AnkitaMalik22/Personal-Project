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
} = require("../../controllers/college/collegeController");

router.route("/register").post(registerCollege);
router.route("/login").post(loginCollege);
router.route("/me").get(isAuthenticatedCollege, getCollegeDetails);
router.route("/password/reset/:token").put(resetPassword);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/update").put(isAuthenticatedCollege, updatePassword);
router.route("/logout").get(logout);
router.route("/update/:id").put(isAuthenticatedCollege, updateProfile);
router.route ("/update/avatar/:id").put(isAuthenticatedCollege, updateProfilePictureCollege);

module.exports = router;
