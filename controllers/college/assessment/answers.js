const Questions = require("../../../models/college/assessment/questions");
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");

const ErrorHandler = require("../../../utils/errorHandler");

// =============================== COLLEGE && COMPANY ==========================================================

// ======================= SET ANSWER | LONG ANS TYPE || COLLEGE && COMPANY =======================================

const setAnswer = async (req, res) => {
  const questionId = req.params.id;
  const question = await Questions.findById(questionId);

  console.log(questionId);
  try {
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    question.Answer = req.body.answer;
    await question.save();

    res.status(201).json({ message: "Answer set successfully", question });
  } catch (error) {
    console.error("Error creating answer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// get Correct Answer by Question ID
const getAnswerByQuestionId = async (req, res) => {
  const { questionId } = req.params;
  let question = await Questions.findById(questionId);
  try {
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    if (question.Answer === "") {
      res.json({ message: "No answer found" });
    } else {
      res.json(question.Answer);
    }
  } catch (error) {
    console.error("Error getting answer by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

 const addMarksLongAnswerStudent = catchAsyncErrors(async (req, res, next) => {
  const { questionId } = req.params;
  const { studentId, marks } = req.body;
  const question = await Questions.findById(questionId);

  if (!question) {
    return next(new ErrorHandler("Question not found", 404));
  }

  let answer = question.LengthyAnswers.filter(
    (answer) => answer.studentId === studentId
  );

  answer.Marks = marks;

  await question.save();

  res.status(200).json({
    success: true,
    message: "Marks added successfully",
  });
});

const updateMarksLongAnswerStudent = catchAsyncErrors(
  async (req, res, next) => {
    const { questionId } = req.params;
    const { studentId, marks } = req.body;
    const question = await Questions.findById(questionId);

    if (!question) {
      return next(new ErrorHandler("Question not found", 404));
    }

    let answer = question.LengthyAnswers.filter(
      (answer) => answer.studentId === studentId
    );

    answer.Marks = marks;

    await question.save();

    res.status(200).json({
      success: true,
      message: "Marks updated successfully",
    });
  }
);

// ==========================  MCQ TYPE  ==============================

const setAnswerIndex = catchAsyncErrors(async (req, res, next) => {
  const { questionId } = req.params;
  const { answerIndex } = req.body;


  const question = await Questions.findById(questionId);

  if (!question) {
    return next(new ErrorHandler("Question not found", 404));
  }

  question.AnswerIndex = answerIndex;
  await question.save();

  res.status(200).json({
    success: true,
    message: "Answer set successfully",
  });
});

// ========================== get Answer Index  || MCQ TYPE   ==============================

const getAnswerUsingIndex = catchAsyncErrors(async (req, res, next) => {
  const { questionId } = req.params;
  // const { answerIndex } = req.body;
  const question = await Questions.findById(questionId);

  if (!question) {
    return next(new ErrorHandler("Question not found", 404));
  }

  // if(question.AnswerIndex === answerIndex){
  //   res.json({ correct: true });
  // } else {
  //   res.json({ correct: false });
  // }

  res.status(200).json({
    success: true,
    // MCQ ANSWER
    answerIndex: question.AnswerIndex,
  });
});

// ============================================ STUDENT =======================================================

const setLongAnswerStudent = catchAsyncErrors(async (req, res, next) => {
  const { questionId } = req.params;
  const { answerText, studentId } = req.body;
  const question = await Questions.findById(questionId);

  if (!question) {
    return next(new ErrorHandler("Question not found", 404));
  }

  question.LengthyAnswers.push({
    studentId: studentId,
    AnswerText: answerText,
  });

  await question.save();

  res.status(200).json({
    success: true,
    message: "Answer set successfully",
  });
});

const getLongAnswerStudent = catchAsyncErrors(async (req, res, next) => {
  const { questionId } = req.params;
  const { studentId } = req.body;
  const question = await Questions.findById(questionId);

  if (!question) {
    return next(new ErrorHandler("Question not found", 404));
  }

  let answer = question.LengthyAnswers.filter(
    (answer) => answer.studentId === studentId
  );

  res.status(200).json({
    success: true,
    answer: answer,
  });
});

//===============  SetAnserIndex  || Student ====================

const setAnswerIndexStudent = catchAsyncErrors(async (req, res, next) => {
  const { questionId } = req.params;
  const { answerIndex, studentId } = req.body;
  const question = await Questions.findById(questionId);

  if (!question) {
    return next(new ErrorHandler("Question not found", 404));
  }

  question.MCQAnswer.push({
    studentId: studentId,
    AnswerIndex: answerIndex,
  });

  await question.save();

  res.status(200).json({
    success: true,
    message: "Answer set successfully",
  });
});

//===============  check AnserIndex  || Student ====================

const checkAnswerIndexStudent = catchAsyncErrors(async (req, res, next) => {
  const { questionId } = req.params;
  const { answerIndex, studentId } = req.body;
  const question = await Questions.findById(questionId);

  if (!question) {
    return next(new ErrorHandler("Question not found", 404));
  }

  let answer = question.MCQAnswer.filter(
    (answer) => answer.studentId === studentId
  );

  if (answer[0].AnswerIndex === answerIndex) {
    res.json({ correct: true });
  } else {
    res.json({ correct: false });
  }
});

const addMarksMCQ = catchAsyncErrors(async (req, res, next) => {
  const { questionId } = req.params;
  const { studentId } = req.body;
  const question = await Questions.findById(questionId);

  if (!question) {
    return next(new ErrorHandler("Question not found", 404));
  }

  let answer = question.MCQAnswer.filter(
    (answer) => answer.studentId === studentId
  );

  if (answer.answerIndex === question.AnswerIndex) {
    answer.Marks = 1;
  } else {
    answer.Marks = 0;
  }
  await question.save();

  res.status(200).json({
    success: true,
    message: "Marks added successfully",
  });
});

const updateMarksMCQ = catchAsyncErrors(async (req, res, next) => {
  const { questionId } = req.params;
  const { studentId, marks } = req.body;
  const question = await Questions.findById(questionId);

  if (!question) {
    return next(new ErrorHandler("Question not found", 404));
  }

  let answer = question.MCQAnswer.filter(
    (answer) => answer.studentId === studentId
  );

  answer.Marks = marks;

  await question.save();

  res.status(200).json({
    success: true,
    message: "Marks updated successfully",
  });
});

module.exports = {
  setAnswer,
  getAnswerByQuestionId,
  addMarksLongAnswerStudent,
  updateMarksLongAnswerStudent,
  setAnswerIndex,
  getAnswerUsingIndex,
  setLongAnswerStudent,
  getLongAnswerStudent,
  setAnswerIndexStudent,
  checkAnswerIndexStudent,
  addMarksMCQ,
  updateMarksMCQ,

};
