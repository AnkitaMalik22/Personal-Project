const express = require('express');
const router = express.Router();

const {
   approveUser,
   getColleges,
   getRequestedColleges,
   getCompanies
} = require('../../controllers/admin/approvalControllers');
const { isAuthenticatedCollege } = require('../../middlewares/auth');

router.get('/get-colleges', getColleges);
router.put('/approve-user/:type/:id', approveUser);

router.get('/requested/colleges', getRequestedColleges);
router.get('/companies/get', getCompanies);
module.exports = router;
