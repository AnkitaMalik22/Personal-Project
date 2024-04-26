const express = require('express');
const router = express.Router();


const { viewAllQuestionsInTopic, addQuestionsToTopic ,createTopic,viewAllTopics ,viewAllTopicByAdmin, updateTopic, getTopicById, addCredit,getCredit} = require('../../controllers/admin/adminControllers');
const { isAuthenticatedCollege } = require('../../middlewares/auth');

router.post('/create-topic', createTopic);

router.put('/update-topic/:topicId',updateTopic);

router.post('/add-questions/:topicId/:type', addQuestionsToTopic);

router.get('/topic/:topicId',isAuthenticatedCollege, getTopicById);

router.get ('/get-all-topics',viewAllTopics);

// router.get ('/get-all-topics/f',viewAllTopicByAdmin);

router.get ('/get-all-questions/:topicId', viewAllQuestionsInTopic);

router.post('/add-credit/:id',addCredit);
router.get('/get-credit/:id',getCredit);



module.exports = router;
