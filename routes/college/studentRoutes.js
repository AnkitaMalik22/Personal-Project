const express = require("express");
const router = express.Router();
const { isAuthenticatedCollege } = require("../../middlewares/auth");
const { getStudentTests } = require("../../controllers/college/student");

router.route("/tests/:id").get(isAuthenticatedCollege, getStudentTests);

module.exports = router;
