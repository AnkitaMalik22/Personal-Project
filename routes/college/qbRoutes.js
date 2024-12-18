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



router.route("/recent/questions").get(authenticateMultiDatabase, getAllRecentQuestions);
router.route("/recent/question/:id").get(authenticateMultiDatabase, getRecentQuestionById);
router.route("/recent/question/:id").delete(authenticateMultiDatabase, deleteRecentQuestionById);

router.route("/topics/all").get(authenticateMultiDatabase, getTopicsQB );


module.exports = router;


