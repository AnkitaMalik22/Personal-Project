const express = require('express');
const router = express.Router();
const { makePayment, getAllPayments } = require('../../controllers/college/account/paymentController');
const { isAuthenticatedCollege } = require('../../middlewares/auth');



router.post('/make-payment',isAuthenticatedCollege,makePayment);
router.get('/get-all',isAuthenticatedCollege,getAllPayments);

module.exports = router;