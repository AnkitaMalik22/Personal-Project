const express = require("express");
const router = express.Router();
const { access } = require("../../controllers/auth/authController");
const {
  authenticateMultiDatabase,
} = require("../../middlewares/authMultiUser");

router.get("/access", authenticateMultiDatabase, access);

module.exports = router;
