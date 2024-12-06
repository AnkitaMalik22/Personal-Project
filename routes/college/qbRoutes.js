const express = require("express");
const router = express.Router();
const { isAuthenticatedCollege } = require("../../middlewares/auth");
const { authenticateMultiDatabase } = require("../../middlewares/authMultiUser")


const {
    getAllRecentQuestions,
    getRecentQuestionById,
    deleteRecentQuestionById,
} = require("../../controllers/college/qb/recentQuestionController");
const { getTopicsQB } = require("../../controllers/college/assessment/sections");
const { isAuthenticatedCompany } = require("../../middlewares/companyAuth");



router.route("/recent/questions").get(isAuthenticatedCollege, getAllRecentQuestions);
router.route("/recent/question/:id").get(isAuthenticatedCollege, getRecentQuestionById);
router.route("/recent/question/:id").delete(isAuthenticatedCollege, deleteRecentQuestionById);

router.route("/topics/all").get(authenticateMultiDatabase, getTopicsQB );


module.exports = router;


