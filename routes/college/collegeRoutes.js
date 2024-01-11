const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../../middlewares/auth");

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
router.route("/me").get(isAuthenticatedUser, getCollegeDetails);
router.route("/password/reset/:token").put(resetPassword);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/update").put(isAuthenticatedUser, updatePassword);
router.route("/logout").get(logout);
router.route("/update/:id").put(isAuthenticatedUser, updateProfile);
router.route ("/update/avatar/:id").put(isAuthenticatedUser, updateProfilePictureCollege);

module.exports = router;
