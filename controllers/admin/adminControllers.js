const Section = require("../../models/college/assessment/sections");
const Question = require("../../models/college/assessment/questions");
const findAnswer = require("../../models/college/assessment/findAnswer");
const Essay = require("../../models/college/assessment/Essay");
const Video = require("../../models/college/assessment/Video");
const ErrorHandler = require("../../utils/errorhandler");
const College = require("../../models/college/collegeModel");
const Credit = require("../../models/college/account/creditModel");
const PaymentPlan = require("../../models/college/account/planModel");
const Transaction = require("../../models/college/account/Transactions");

//  ADMIN CAN CREATE TOPICS AND ADD QUESTIONS

// 1. Create a new topic

// ----------------- ADD CREDIT TO COLLEGE ------------------


const selectPlanCollege = async (req, res) => {
  try {
    // Find the college by user ID
    const college = await College.findById(req.user.id);
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    // Retrieve the plan ID from request parameters
    const planId = req.params.id;
    const newPlan = await PaymentPlan.findById(planId);
    if (!newPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Check if the college already has a different plan selected
    if (college.selectedPlan && college.selectedPlan.toString() !== planId) {
      const currentPlan = await PaymentPlan.findById(college.selectedPlan);
      if (currentPlan) {
        // Remove the college from the current plan's members list
        currentPlan.members = currentPlan.members.filter(member => member.toString() !== college._id.toString());
        await currentPlan.save();
      }
    }

    // Assign the new plan to the college
    if (!newPlan.members.includes(college._id)) {
      newPlan.members.push(college._id);
    }

    // Update the college's selected plan
    college.selectedPlan = newPlan._id;

    const transaction = await Transaction.create({
      user: college._id,
      planName: newPlan.planName,
      date : new Date(),
      price: newPlan.price,
      credit: newPlan.credit,
      limit: newPlan.limit,
      charges: newPlan.charges,
    });
  
    await newPlan.save();
    await college.save();

    return res.status(200).json({
      message: "Plan selection updated successfully",
      plan: newPlan
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Unable to select plan",
      error: error.message,
    });
  }
};




const addPlansAdmin = async (req, res) => {
  try {
    const { plans} = req.body;
  for (let i = 0; i < plans.length; i++) {
    const plan = new PaymentPlan(plans[i]);
    await plan.save();

  }
  return res.status(201).json({
    message: "Plans added successfully",

  });
    
  } catch (error) {
    return res.status(500).json({
      message: "Unable to add plan",
      error: error.message,
    });
  }
};

const getAllPlans = async (req, res) => {
  try {
    const plans = await PaymentPlan.find();
    return res.status(200).json({
      message: "All plans",
      plans,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to get plans",
      error: error.message,
    });
  }
};


const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user.id,
    });
    return res.status(200).json({
      message: "All transactions",
      transactions,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Unable to get transactions",
      error: error.message,
    });
  }
};


    


const addCredit = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: "User not found" });
    }

  let credit = await Credit.findOne({
      college: college,
    });

    if (!credit) {
      // return res.status(404).json({ message: "Credit not found" });
      credit = new Credit({
        college : college
      })
    }

    credit.credit = req.body.credit;
    credit.limit = req.body.limit;

    await credit.save();
    // send notification to college 

    return res.status(201).json({
      message: "Credit added successfully",
      credit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to add credit",
      error: error.message,
    });
  }
};


const getCredit =async(req,res)=>{
  try{
    const credit = await Credit.findOne({
      college : req.params.id
    });
    if(!credit) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "Credit Fetched Successfully",
      credit,
    });
  
  }catch(error){
    return res.status(500).json({
      message: "Unable to fetch credit",
      error: error.message,
    });
  }

}


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
      .populate("compiler");
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
    const { topicId, type } = req.params;

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
    const sections = await Section.find()
      .populate("questions")
      .populate("findAnswers")
      .populate("essay")
      .populate("video");
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
    const section = await Section.findById(topicId)
      .populate("questions")
      .populate("findAnswers")
      .populate("essay")
      .populate("video");
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
  addCredit,
  getCredit,
  createTopic,
  getTopicById,
  updateTopic,
  addQuestionsToTopic,
  viewAllTopics,
  viewAllQuestionsInTopic,
  addPlansAdmin,
  selectPlanCollege,
  getAllPlans,
  getAllTransactions
};
