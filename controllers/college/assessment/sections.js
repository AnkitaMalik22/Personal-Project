const Section = require("../../../models/college/assessment/sections");
const Assessment = require("../../../models/college/assessment/assessments");
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const Assessments = require("../../../models/college/assessment/assessments");
const College = require("../../../models/college/collegeModel");

// ===================================================| Create Section |===================================================================

exports.createSection = catchAsyncErrors(async (req, res, next) => {
  try {
    // assessment id
    const { id } = req.body;
    // const collegeId = req.user.id;
    // const college = await College.findById(collegeId);
    // let assessment = college.assessments.find((assessment) => assessment._id == id);
    let assessment = await Assessments.findById(id);

    // console.log(assessment, id);

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    const section = await Section.create(req.body);

    assessment.AssessmentId = id;
    assessment.totalTime += section.Time;
  

    assessment.sections.push(section._id);
    await assessment.save();

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
    const section = await Section.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }

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
    const section = await Section.findByIdAndDelete(id);

    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }

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
