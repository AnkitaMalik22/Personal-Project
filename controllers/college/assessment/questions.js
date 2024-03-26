// Import necessary models and modules
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const Compiler = require("../../../models/college/assessment/Compiler");
const Essay = require("../../../models/college/assessment/Essay");
const Video = require("../../../models/college/assessment/Video");
const Assessments = require("../../../models/college/assessment/assessments");
const findAnswer = require("../../../models/college/assessment/findAnswer");
const Questions = require("../../../models/college/assessment/questions");
const Section = require("../../../models/college/assessment/sections");

// =========================================================================================================================================

// ===================================================| Create Question |===================================================================
exports.createQuestion = catchAsyncErrors(async (req, res, next) => {
  const { Title, Options, Answer, SectionTime, SectionHeading } = req.body;

  const { sectionId } = req.params;
  console.log(sectionId);

  const userId = req.user.id;

  // Only Authorized Company/College can create questions

  let section = await Section.findById(sectionId);

  if (!section) {
    return res.status(404).json({ error: "Section not found" });
  }

  if (section.createdByCompany === true) {
    if (section.company !== userId) {
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      const question = await Questions.create({
        section: sectionId,
        Title,
        SectionTime: section.Time,
        SectionHeading: section.SectionHeading,
        company: userId,
        createdByCompany: true,
        QuestionType: section.Type,
      });

      section.questions.push(question._id);
      section = await section.save();
    }
  } else {
    if (section.college !== userId) {
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      const question = await Questions.create({
        section: sectionId,
        Title,
        SectionTime: section.Time,
        SectionHeading: section.SectionHeading,
        college: userId,
        createdByCompany: false,
        QuestionType: section.Type,
      });

      section.questions.push(question._id);
      section = await section.save();
    }
  }

  res.status(201).json({
    success: true,
    message: "Question created successfully",
  });
});

// ===================================================| Get All Questions  |===================================================================
// Controller to get all questions  -- // By Section //
exports.getAllQuestions = catchAsyncErrors(async (req, res, next) => {
  const { sectionId } = req.params;
  console.log(sectionId);

  const questions = await Section.findById(sectionId).populate("questions");

  res.status(200).json({
    success: true,
    questions,
  });
});

// ===================================================| Get Question by ID |===================================================================
// Controller to get question by ID
exports.getQuestionById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const question = await Questions.findById(id);

  if (!question) {
    return res.status(404).json({
      success: false,
      message: "Question not found",
    });
  }

  res.status(200).json({
    success: true,
    question,
  });
});

// ===============================================| Update Question by ID |===================================================================
// Controller to update question by ID
exports.updateQuestionById = catchAsyncErrors(async (req, res) => {
  const { id } = req.params;
  // const userId = req.user.id;
  const { type } = req.query;

  let question = [];
  if (type === 'mcq') {
    question = await Questions.findByIdAndUpdate(id, req.body, {
      new: true,
    });
  } else if (type === 'findAnswer') {
    question = await findAnswer.findByIdAndUpdate(id, req.body, {
      new: true,
    });
  } else if (type === 'code') {
    question = await Compiler.findByIdAndUpdate(id, req.body, {
      new: true,
    });
  } else if (type === 'video') {
    question = await Video.findByIdAndUpdate(id, req.body, {
      new: true,
    });
  } else {
    question = await Essay.findByIdAndUpdate(id, req.body, {
      new: true,
    });
  }

  // question = await Questions.findById(id);

  // if (!question) {
  //   return res.status(404).json({
  //     success: false,
  //     message: "Question not found",
  //   });
  // }


  // Only Authorized Company/College can update questions

  // if(question.createdBy != req.user.id){
  //   return res.status(401).json({ error: "Unauthorized" });
  // }


  // if (question.createdByCompany === true) {
  //   if (req.body.company !== userId) {
  //     return res.status(401).json({ error: "Unauthorized" });
  //   }else{
  //     await Questions.findByIdAndUpdate(id, req.body, {
  //       new: true,
  //     });
  //   }
  // } else {
  //   if (question.college !== userId) {
  //     return res.status(401).json({ error: "Unauthorized" });
  //   }
  //   else{
  //     await Questions.findByIdAndUpdate(id, req.body, {
  //       new: true,
  //     });
  //   }
  // }
  res.status(200).json({
    success: true,
    question,
  });
});

// ===============================================| Delete Question by ID |===================================================================
// Controller to delete question by ID
exports.deleteQuestionById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const question = await Questions.findById(id);

  if (!question) {
    return res.status(404).json({
      success: false,
      message: "Question not found",
    });
  }

  // Check if the user is authorized to delete the question
  if (question.createdByCompany && req.body.company !== userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!question.createdByCompany && question.college !== userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // If the user is authorized, delete the question
  await Questions.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Question deleted successfully",
  });
});

// ==========================================================================================================================================
// ==========================================================================================================================================

// recent questions

exports.getAllRecentQuestions = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  const assessments = await Assessments.find({ createdBy: userId }).populate("topics")
    .sort({ createdAt: -1 })
    .limit(5);
  let topics = [];

assessments.forEach(async (assessment) => {
assessment.topics.forEach(async (topic)=>{{
  topics.push(topic)

}})
});

// let questions = [];
// for (let i = 0; i < topics.length; i++) {
//   if (topics[i].questions){
//     let question = Questions.findById(topics[i].questions._id);
//     questions.push(topics[i].questions);
//   }
//   else if
//   questions.push(topics[i].questions);
//   questions.push(topics[i].essay);
//   questions.push(topics[i].findAnswer);
//   questions.push(topics[i].compiler);
//   questions.push(topics[i].video);
// }

res.status(200).json({
  success: true,
topics
});
});


// delete recent Topic by ID