const Assessments = require("../../../models/college/assessment/assessments");
const ErrorHandler = require("../../../utils/errorHandler");
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const College = require("../../../models/college/collegeModel");


// =========================================================================================================================================

// ===================================================| Create Assessment |===================================================================

// Create Assessment
const createAssessment = catchAsyncErrors(async (req, res, next) => {


  const CollegeId = req.user.id;

  const assessment = await Assessments.create({
    ...req.body,collegeId:CollegeId
  });

  res.status(201).json({
    success: true,
    assessment,
  });
});

// ===================================================| Get All Assessments  |================================================================

// Get All Assessments  -- // By College //
const getAllAssessments = catchAsyncErrors(async (req, res, next) => {
  const collegeId = req.user.id;
  console.log(collegeId);
  
  const assessments = await College.findById(collegeId).populate('assessments');
 
  res.status(200).json({
    success: true,
    assessments
});
})

// Get Assessment by ID
const getAssessmentById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const collegeId = req.user.id;
  console.log(collegeId , id);

  const assessments = await College.findById(collegeId).populate('assessments');
  const assessment = assessments.assessments.find((assessment) => assessment._id == id);

  if (!assessment) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }

  res.json(assessment);
});

// ===================================================| Update Assessment by ID |========================================================

// Update Assessment by ID
const updateAssessmentById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const assessment = await Assessments.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!assessment) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }

  res.json(assessment);
});

// ===================================================| Delete Assessment by ID |========================================================

// Delete Assessment by ID
const deleteAssessmentById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const assessment = await Assessments.findByIdAndDelete(id);

  if (!assessment) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }

  res.json({ message: "Assessment deleted successfully" });
});

// =========================================================================================================================================



module.exports = {
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessmentById,
  deleteAssessmentById,
};
