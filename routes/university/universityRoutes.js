// routes/universityRoutes.js

const express = require('express');
const router = express.Router();
const { registerUniversity, loginUniversity } = require('../../controllers/university/universityController');
const { isAuthenticatedUniversity } = require('../../middlewares/universityAuth');

// Register Route
router.post('/register', registerUniversity);

// Login Route
router.post('/login', loginUniversity);

// Profile Route
router.get('/profile', isAuthenticatedUniversity, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

router.get('/', (req, res) => {
  res.send("University API is running");
});

module.exports = router;