const express = require('express');
const router = express.Router();

const {
   approveUser,
   getColleges,
} = require('../../controllers/admin/approvalControllers');
const { isAuthenticatedCollege } = require('../../middlewares/auth');

router.get('/get-colleges', getColleges);
router.put('/approve-user/:type/:id', approveUser);

module.exports = router;
