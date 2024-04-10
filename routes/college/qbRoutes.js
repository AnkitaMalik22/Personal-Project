const express = require("express");
const router = express.Router();
const { isAuthenticatedCollege } = require("../../middlewares/auth");


const {
    getAllRecentQuestions,
    getRecentQuestionById,
    deleteRecentQuestionById,
} = require("../../controllers/college/qb/recentQuestionController");



router.route("/recent/questions").get(isAuthenticatedCollege, getAllRecentQuestions);
router.route("/recent/question/:id").get(isAuthenticatedCollege, getRecentQuestionById);
router.route("/recent/question/:id").delete(isAuthenticatedCollege, deleteRecentQuestionById);


module.exports = router;


