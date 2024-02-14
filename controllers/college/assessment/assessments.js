const Assessments = require("../../../models/college/assessment/assessments");
const ErrorHandler = require("../../../utils/errorhandler");
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const College = require("../../../models/college/collegeModel");
const {Student} = require("../../../models/student/studentModel");
const Section = require("../../../models/college/assessment/sections")



// =========================================================================================================================================

// ===================================================| Create Assessment |===================================================================

// Create Assessment -- || College || Company || -- //

const createAssessment = catchAsyncErrors(async (req, res, next) => {


  const { role, id } = req.user;

  const {testSections} = req.body;
  const createdByCompany = role === "company";
  
  if (role !== "college" && role !== "company") {
    return next(new ErrorHandler("Invalid user role", 400));
  }


let assessment = await Assessments.create({
    ...req.body,
    college: id,
    company : id,
    createdByCompany

  });

// assessment created
// now save the sections in Section table

// console.log("A 1" , assessment)


for(let test of testSections){
console.log(test,"test")

    const section = await Section.create({
      Heading :test.name,
      Description :test.description,
      Type : test.type,
      createdByCompany,
      college :id,
      comapny : id
    })
  

    assessment.sections.push(section._id);

    await section.save()

    console.log(section)
    await assessment.save();




} 


console.log("A 2" , assessment)




  res.status(201).json({
    success: true,
    assessment,
  });
});

// ===================================================| Get All Assessments  |================================================================

// Get All Assessments -- // By College or Company //
const getAllAssessments = catchAsyncErrors(async (req, res, next) => {
  const { role, id } = req.user;
  let assessments;

  if (role === "college") {
    assessments = await Assessments.find({ college: id });
  } else if (role === "company") {
    assessments = await Assessments.find({ company: id });
  } else {
    return next(new ErrorHandler("Invalid user role", 400));
  }

  res.status(200).json({
    success: true,
    assessments
  });
});

// ===================================================| Get Assessment by ID |========================================================

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
  // check if created assessment is by the same user or not
  const a = await Assessments.findById(id);
  if (!a) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }
  if(a.createdByCompany){
    if (a.company != req.user.id) {
      return next(new ErrorHandler(`You are not authorized to update this assessment`, 401));
    }
  }


  if (a.college != req.user.id) {
    return next(new ErrorHandler(`You are not authorized to update this assessment`, 401));
  }

  const assessment = await Assessments.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  // if (!assessment) {
  //   return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  // }

  res.json(assessment);
});

// ===================================================| Delete Assessment by ID |========================================================

// Delete Assessment by ID
const deleteAssessmentById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  // check if created assessment is by the same user or not
  const a = await Assessments.findById(id);
  if (!a) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }
  if(a.createdByCompany){
    if (a.company != req.user.id) {
      return next(new ErrorHandler(`You are not authorized to delete this assessment`, 401));
    }
  }


  if (a.college != req.user.id) {
    return next(new ErrorHandler(`You are not authorized to delete this assessment`, 401));
  }


  const assessment = await Assessments.findByIdAndDelete(id);


  // if (!assessment) {
  //   return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  // }

  res.json({ message: "Assessment deleted successfully" });
});

// ===================================================| Start Assessment by ID |========================================================

const startAssessment = catchAsyncErrors(async (req, res, next) => {
  const { assessmentId ,studentId } = req.params;

  const assessment = await Assessments.findById(assessmentId);
  
  const student = await Student.findById(studentId);
 
  if (!assessment) {
    return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
  }
  if (!student) {
    return next(new ErrorHandler(`Student not found with ID: ${id}`, 404));
  }
  if(student.OnGoingAssessment.toString() === assessmentId){
    return next(new ErrorHandler(`Assessment already started`, 404));
  }

  student.OnGoingAssessment = assessmentId;

  await student.save();

  res.json({
    success: true,
    message : "Assessment Started",
    data : {
      assessment,
      student
    }
  });
}
);

//  after the time is over client will send the request to end the assessment

// ===================================================| End Assessment by ID |========================================================


const endAssessment = catchAsyncErrors(async (req, res, next) => {

const { assessmentId ,studentId } = req.params;

const assessment = await Assessments.findById(assessmentId);
const  student = await Student.findById(studentId);

if (!assessment) {
  return next(new ErrorHandler(`Assessment not found with ID: ${id}`, 404));
}
if (!student) {
  return next(new ErrorHandler(`Student not found with ID: ${id}`, 404));
}
if(student.OnGoingAssessment.toString() !== assessmentId.toString()){

  return next(new ErrorHandler(`Assessment not started`, 404));
}

student.OnGoingAssessment = null;

await student.save();

res.json({
  success: true,
  message : "Assessment Ended",
  data : {
    assessment,
    student
  }
});
}
);



  







// =========================================================================================================================================



module.exports = {
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessmentById,
  deleteAssessmentById,
  startAssessment,
  endAssessment,
};
