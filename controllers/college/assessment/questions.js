// Import necessary models and modules
const catchAsyncErrors = require('../../../middlewares/catchAsyncErrors');
const Questions = require('../../../models/college/assessment/questions');
const Section = require('../../../models/college/assessment/sections');

// =========================================================================================================================================


// ===================================================| Create Question |===================================================================
exports.createQuestion = catchAsyncErrors(async (req, res, next) => {
  const {  Title, Options, Answer, SectionTime, SectionHeading } = req.body;

  const { sectionId } = req.params;
  console.log(sectionId);
let section = await Section.findById(sectionId);

  if (!section) {
    return res.status(404).json({ error: 'Section not found' });
  }



  const question = await Questions.create({
    section: sectionId,
    Title,
    Options,
    Answer,
    SectionTime : section.Time,
    SectionHeading :section.SectionHeading
  });

  section.questions.push(question._id);
  section = await section.save();

  res.status(201).json({
    success: true,
    question,
  });
});

// ===================================================| Get All Questions  |===================================================================
// Controller to get all questions  -- // By Section //
exports.getAllQuestions = catchAsyncErrors(async (req, res, next) => {
const { sectionId } = req.params;
  console.log(sectionId);

const questions = await Section.findById(sectionId).populate('questions');

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
      message: 'Question not found',
    });
  }

  res.status(200).json({
    success: true,
    question,
  });
});

// ===============================================| Update Question by ID |===================================================================
// Controller to update question by ID
exports.updateQuestionById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const question = await Questions.findByIdAndUpdate(id, req.body, { new: true });

  if (!question) {
    return res.status(404).json({
      success: false,
      message: 'Question not found',
    });
  }

  res.status(200).json({
    success: true,
    question,
  });
});

// ===============================================| Delete Question by ID |===================================================================
// Controller to delete question by ID
exports.deleteQuestionById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const question = await Questions.findByIdAndDelete(id);

  if (!question) {
    return res.status(404).json({
      success: false,
      message: 'Question not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Question deleted successfully',
  });
});
// ==========================================================================================================================================

