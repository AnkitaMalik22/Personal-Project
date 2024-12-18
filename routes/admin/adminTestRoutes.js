const express = require("express");
const router = express.Router();

const {
  viewAllQuestionsInTopic,
  addQuestionsToTopic,
  createTopic,
  viewAllTopics,
  viewAllTopicByAdmin,
  updateTopic,
  getTopicById,
  addCredit,
  getCredit,
  addPlansAdmin,
  selectPlanCollege,
  getAllCollegeTransactions,
  getAllPlans,
  getAllTransactions,
  cancelPlanCollege,
  requestSelectedPlan,
  getSelectedPlan,
} = require("../../controllers/admin/adminControllers");
const { isAuthenticatedCollege } = require("../../middlewares/auth");
const { authenticateMultiDatabase } = require("../../middlewares/authMultiUser");

router.post("/create-topic", createTopic);

router.put("/update-topic/:topicId", updateTopic);

router.post("/add-questions/:topicId/:type", addQuestionsToTopic);

router.get("/topic/:topicId", authenticateMultiDatabase, getTopicById);

router.get("/get-all-topics", viewAllTopics);
 
// router.get ('/get-all-topics/f',viewAllTopicByAdmin);

router.get("/get-all-questions/:topicId", viewAllQuestionsInTopic);

router.post("/add-credit/:id", addCredit);
router.get("/get-credit/:id", getCredit);
router.post("/add-plan", addPlansAdmin);
router.post("/request-plan/:id", isAuthenticatedCollege, requestSelectedPlan);
router.get("/all-plans", getAllPlans);
router.get("/selected-plans/:id", getSelectedPlan);
router.get(
  "/all-transactions",
  isAuthenticatedCollege,
  getAllCollegeTransactions
);
router.post("/cancel-plan/:id", isAuthenticatedCollege, cancelPlanCollege);

module.exports = router;
