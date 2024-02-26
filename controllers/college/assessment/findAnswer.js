


const findAnswer = require('../../../models/college/assessment/findAnswer');






const addFindAnswerQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {Title , questions } = req.body;
    const findAnswer = await findAnswer.create({
      Title,
      questions,
      college: id,
    });
    return res.status(201).json({
      message: "FindAnswer created successfully",
      findAnswer,
    });

  }
    catch (error) {
        return res.status(500).json({
        message: "Unable to create FindAnswer",
        error: error.message,
        });
    }
}

const getFindAnswerById = async (req, res) => {
  try {
    const { findAnswerId } = req.params;
    const findAnswer = await
    findAnswer
    .findById(findAnswerId)
    .populate("questions");
    if (!findAnswer) {
      return res.status(404).json({
        message: "FindAnswer not found",
      });
    }
    return res.status(200).json({
      findAnswer,
    });
    } catch (error) {
        return res.status(500).json({
            message: "Unable to get FindAnswer",
            error: error.message,
        });
        }
}

const updateFindAnswer = async (req, res) => {
  try {
    const { findAnswerId } = req.params;
    const findAnswer = await
    findAnswer
    .findByIdAndUpdate(
      findAnswerId,
      {
        Title: req.body.Title,
        questions: req.body.questions,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!findAnswer) {
      return res.status(404).json({
        message: "FindAnswer not found",
      });
    }
    return res.status(200).json({
      message: "FindAnswer updated successfully",
      findAnswer,
    });
    }
    catch (error) {
        return res.status(500).json({
            message: "Unable to update FindAnswer",
            error: error.message,
        });
    }

}

const deleteFindAnswer = async (req, res) => {
  try {
    const { findAnswerId } = req.params;
    const findAnswer = await
    findAnswer
    .findByIdAndDelete(findAnswerId);
    if (!findAnswer) {
      return res.status(404).json({
        message: "FindAnswer not found",
      });
    }
    return res.status(200).json({
      message: "FindAnswer deleted successfully",
    });
    }
    catch (error) {
        return res.status(500).json({
            message: "Unable to delete FindAnswer",
            error: error.message,
        });
    }
}

module.exports = {
  addFindAnswerQuestion,
  getFindAnswerById,
  updateFindAnswer,
  deleteFindAnswer,
};



