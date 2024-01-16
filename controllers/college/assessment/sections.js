const Section = require("../../../models/college/assessment/sections");
const Assessment = require("../../../models/college/assessment/assessments");
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const Assessments = require("../../../models/college/assessment/assessments");
const College = require("../../../models/college/collegeModel");

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
    }
    else if (role === "company") {
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
