const Section = require("../../models/college/assessment/sections");
const Question = require("../../models/college/assessment/questions");
const findAnswer = require("../../models/college/assessment/findAnswer");
const Essay = require("../../models/college/assessment/Essay");
const Video = require("../../models/college/assessment/Video");

//  ADMIN CAN CREATE TOPICS AND ADD QUESTIONS

// 1. Create a new topic

const createTopic = async (req, res) => {
  try {
    // add user id later

    const { Heading, Description, TotalQuestions, Time } = req.body;
    const section = new Section({
      ...req.body,
      CreatedByAdmin: true,
    });
    await section.save();
    return res.status(201).json({
      message: "Topic created successfully",
      section,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create topic",
      error: error.message,
    });
  }
};

const getTopicById = async (req, res) => {
  try {
    const { topicId } = req.params;
    const section = await Section.findById(topicId)
      .populate("questions")
      .populate("findAnswers")
      .populate("essay")
      .populate("video")
      .populate("compiler")
    if (!section) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }
    return res.status(200).json({
      message: "Topic found",
      section,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to get topic",
      error: error.message,
    });
  }
};

const updateTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const section = await Section.findByIdAndUpdate(
      topicId,
      {
        Heading: req.body.Heading,
        Description: req.body.Description,
        TotalQuestions: req.body.TotalQuestions,
        Time: req.body.Time,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!section) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    return res.status(200).json({
      message: "Topic updated successfully",
      section,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update topic",
      error: error.message,
    });
  }
};

// 2. Add questions to the topic

const addQuestionsToTopic = async (req, res) => {
  try {

    const { topicId,type } = req.params;

    // const { Title, Options, Answer, AnswerIndex, QuestionType, Status, TotalMarks } = req.body;
    let section;

    if (type === "mcq") {
      section = await Section.findById(topicId).populate("questions");
    } else if (type === "findAnswer") {
      section = await Section.findById(topicId).populate("findAnswers");
    } else if (type === "essay") {
      section = await Section.findById(topicId).populate("essay");
    } else if (type === "video") {
      section = await Section.findById(topicId).populate("video");
    }

    if (!section) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    if (section.questions?.length >= section.TotalQuestions) {
      return res.status(400).json({
        message: "Maximum questions limit reached",
      });
    }

    const questions = req.body.questions;
    let question;
    for (let i = 0; i < questions.length; i++) {
      if (type === "mcq") {
        question = await Question.create(questions[i]);
        section.questions.push(question._id);
      } else if (type === "findAnswer") {
         question =await findAnswer.create(questions[i]);
         section.findAnswers.push(question._id);
      } else if (type === "essay") {
       question = await Essay.create(questions[i]);
        section.essay.push(question._id);
        console.log(section.essay);
      } else if (type === "video") {
    question = await Video.create(questions[i]);
        section.video.push(question._id);
      }

      question.section = topicId;

      await section.save();
      await question.save();
    }

    // const question = new Question(req.body);

    return res.status(201).json({
      message: "Question added successfully",
      questions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to add question",
      error: error.message,
    });
  }
};

// view All Questions in a topic

// 3. View all topics --- ACCESSIBLE TO ALL COLLEGES & COMPANIES ---

const viewAllTopics = async (req, res) => {
  try {
    const sections = await Section.find().populate("questions").populate("findAnswers").populate("essay").populate("video");
    return res.status(200).json({
      message: "All topics",
      sections,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to view topics",
      error: error.message,
    });
  }
};

const viewAllTopicByAdmin = async (req, res) => {
  try {
    const sections = await Section.find({ CreatedByAdmin: true });
    return res.status(200).json({
      message: "All topics",
      sections,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to view topics",
      error: error.message,
    });
  }
};

// 4. View all questions in a topic

const viewAllQuestionsInTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const section = await Section.findById(topicId).populate("questions").populate("findAnswers").populate("essay").populate("video");
    if (!section) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }
    return res.status(200).json({
      message: "All questions in topic",
      section,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to view questions",
      error: error.message,
    });
  }
};

module.exports = {
  createTopic,
  getTopicById,
  updateTopic,
  addQuestionsToTopic,
  viewAllTopics,
  viewAllQuestionsInTopic,
};
