const express = require('express');
const router = express.Router();


const { viewAllQuestionsInTopic, addQuestionsToTopic ,createTopic,viewAllTopics ,viewAllTopicByAdmin, updateTopic, getTopicById} = require('../../controllers/admin/adminControllers');

router.post('/create-topic', createTopic);

router.put('/update-topic/:topicId',updateTopic);

router.post('/add-questions/:topicId/:type', addQuestionsToTopic);

router.get('/topic/:topicId', getTopicById);

router.get ('/get-all-topics',viewAllTopics);

// router.get ('/get-all-topics/f',viewAllTopicByAdmin);

router.get ('/get-all-questions/:topicId', viewAllQuestionsInTopic);





module.exports = router;
