const Section = require("../../../models/college/assessment/sections");
const Assessment = require("../../../models/college/assessment/assessments");
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const Assessments = require("../../../models/college/assessment/assessments");
const College = require("../../../models/college/collegeModel");
const Question = require("../../../models/college/assessment/questions");
const findAnswer = require("../../../models/college/assessment/findAnswer");
const Essay = require("../../../models/college/assessment/Essay");
const Video = require("../../../models/college/assessment/Video");

// ===================================================| Create Section |===================================================================

exports.createSection = catchAsyncErrors(async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.user.id;

    // Find the assessment by ID
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    // Check if the user is authorized to create sections for the assessment
    if (assessment.college === userId) {
      const section = await Section.create(req.body);

      // Update assessment details
      assessment.AssessmentId = id;
      assessment.totalTime += section.Time;
      assessment.sections.push(section._id);
      section.createdByCompany = false;
      section.college = userId;
      await assessment.save();
    } else if (assessment.company === userId) {
      const section = await Section.create(req.body);

      // Update assessment details
      assessment.AssessmentId = id;
      assessment.totalTime += section.Time;
      assessment.sections.push(section._id);
      section.createdByCompany = true;
      section.company = userId;
      await assessment.save();
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.status(201).json(section);
  } catch (error) {
    console.error("Error creating section:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ===================================================| Get Section by ID |===================================================================

exports.getSectionsByAssessmentId = catchAsyncErrors(async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await Assessment.findById(assessmentId);
    // console.log(assessmentId);

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    const sections = await Assessment.findById(assessmentId).populate(
      "sections"
    );

    res.status(200).json(sections);
  } catch (error) {
    console.error("Error getting sections:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ===================================================| Get Section by ID |===================================================================

exports.getSectionById = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const section = await Section.findById(id);

    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }

    res.json(section);
  } catch (error) {
    console.error("Error getting section:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ===================================================| Update Section by ID |===============================================================

exports.updateSection = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }

    // Check if the user is authorized to update the section

    if (role === "college") {
      if (section.college != userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else if (role === "company") {
      if (section.company != userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await Section.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.json(section);
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ===================================================| Delete Section by ID |===============================================================

exports.deleteSection = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    const userId = req.user.id;
    const role = req.user.role;

    let section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }

    // Check if the user is authorized to delete the section

    if (role === "college") {
      if (section.college != userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else if (role === "company") {
      if (section.company != userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Delete the section
    await Section.findByIdAndDelete(id);

    const assessment = await Assessment.findById(section.AssessmentId);
    assessment.sections.pull(id);
    await assessment.save();

    res.json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ADD QUESTION BANK ID TO SECTION

// ----------------------------- CREATE TOPIC COLLGE-----------------------------

exports.createTopicCollege = async (req, res) => {
  try {
    // const { Heading, Description, TotalQuestions, Time } = req.body;
    const collegeId = req.user.id;
    console.log(collegeId, "collegeId")
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ error: "College not found" });
    }
    const section = await Section.create({
      ...req.body,
      college: collegeId,
      createdByCollege: true,
    });

    college.topics.push(section);

    await college.save();

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

//----------------------------- GET ALL TOPICS ------------------------------------
// TOPICS = ADMIN TOPICS + COLLEGE TOPICS
// FILTER TOPICS BY Type

exports.getTopics = async (req, res) => {
  try {
    console.log("called" , req.query.type)
    const type = req.query.type;
    const collegeId = req.user.id;
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ error: "College not found" });
    }

    let sections;
    let topics;
    let allTopics;

    // we need to also save section type in the database

    if (type === "mcq") {
      sections = await Section.find({ CreatedByAdmin: true }).populate(
        "questions"
      );

      topics = await Section.find({ college: collegeId }).populate("questions");
      allTopics = [...sections, ...topics];
      // remove the findAnswers, essay, video fields from the section

      allTopics = allTopics.map((section) => {
        const { findAnswers, essay, video, ...rest } = section._doc;
        return rest;
      });
    } else if (type === "findAnswer") {
      sections = await Section.find({ CreatedByAdmin: true }).populate(
        "findAnswers"
      );

      topics = await Section.find({ college: collegeId }).populate(
        "findAnswers"
      );
      allTopics = [...sections, ...topics];
      // remove the findAnswers, essay, video fields from the section

      allTopics = allTopics.map((section) => {
        const { findAnswers, essay, video, ...rest } = section._doc;
        return rest;
      });
    } else if (type === "essay") {
      sections = await Section.find({ CreatedByAdmin: true }).populate("essay");

      topics = await Section.find({ college: collegeId }).populate("essay");
      allTopics = [...sections, ...topics];
      // remove the findAnswers, essay, video fields from the section

      allTopics = allTopics.map((section) => {
        const { findAnswers, essay, video, ...rest } = section._doc;
        return rest;
      });
    } else if (type === "video") {
      sections = await Section.find({ CreatedByAdmin: true }).populate("video");

      topics = await Section.find({ college: collegeId }).populate("video");
      allTopics = [...sections, ...topics];
      // remove the findAnswers, essay, video fields from the section

      allTopics = allTopics.map((section) => {
        const { findAnswers, essay, video, ...rest } = section._doc;
        return rest;
      });
    } else {
      sections = await Section.find({ CreatedByAdmin: true })
        .populate("questions")
        .populate("essay")
        .populate("video")
        .populate("findAnswers");
      topics = await Section.find({ college: collegeId })
        .populate("questions")
        .populate("essay")
        .populate("video")
        .populate("findAnswers");

      allTopics = [...sections, ...topics];
    }

    // const allTopics = [...sections, ...topics];

    return res.status(200).json({
      message: "Topics found",
      topics: allTopics,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to get topics",
      error: error.message,
    });
  }
};

// Right Now We are updating from frontend but we need to update from backend

exports.addQuestionsToTopicCollege = async (req, res) => {
  try {
    const { topicId, type } = req.params;


    const collegeId = req.user.id;

    // console.log(collegeId, "collegeId" ,topicId,type)
    // const { Title, Options, Answer, AnswerIndex, QuestionType, Status, TotalMarks } = req.body;
    let section;

    section = await Section.findById(topicId);
    if (!section) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }
    let id = section.college.toString()

    console.log(collegeId , id)

    console.log(id === collegeId)


    if (id != collegeId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    

    // if (section.questions?.length >= section.TotalQuestions) {
    //   return res.status(400).json({
    //     message: "Maximum questions limit reached",
    //   });
    // }

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

    // if (section.questions?.length >= section.TotalQuestions) {
    //   return res.status(400).json({
    //     message: "Maximum questions limit reached",
    //   });
    // }

    const questions = req.body.questions;
    let question;
    for (let i = 0; i < questions.length; i++) {
      if (type === "mcq") {
        question = await Question.create(questions[i]);
        section.questions.push(question._id);
      } else if (type === "findAnswer") {
        question = await findAnswer.create(questions[i]);
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
    console.log(error)
    return res.status(500).json({
      message: "Unable to add question",
      error: error.message,
    });
  }
};


exports.addTopicstoAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { topics } = req.body;
    const assessment = await Assessment.findById
    (id);
    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    const collegeId = req.user.id;
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ error: "College not found" });
    }
    if (assessment.college != collegeId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
  if (assessment.sections.length == 0){
    assessment.sections = topics;
  }
  else{
    assessment.sections.push(...topics);
  }
  await assessment.save();
  return res.status(201).json({
    message: "Topics added to assessment successfully",
    assessment,
  });
}
catch (error) {
  return res.status(500).json({
    message: "Unable to add topics to assessment",
    error: error.message,
  });
}
}

// ------------------------
