const ErrorHandler = require("../../utils/errorhandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const Company = require("../../models/company/companyModel");
const CampusDrive = require("../../models/company/campusDriveModel");
const College = require("../../models/college/collegeModel");
const Student = require("../../models/student/studentModel");
const Assessment = require("../../models/college/assessment/assessments");
const StudentResponse = require("../../models/student/studentResponse");
const sendEmail = require("../../utils/sendEmail");
const { sendMailForTestAdded } = require("../../utils/constants/emailMessagesConstants");
// const uploadToCloud = require("../../utils/uploadToCloud");

// Create a new campus drive
// Route: /api/company/campusdrive/new
exports.newCampusDrive = catchAsyncErrors(async (req, res, next) => {
  try {
    const company = await Company.findById(req.user.id);
    if (!company) {
      return next(new ErrorHandler("Company not found", 404));
    }
    req.body.company = req.user.id;

    let coverPhoto = company?.basic?.coverPhoto;
    // if (req.file) {
    //   const uploadedFile = await uploadToCloud(req.file.path); // Replace with your actual upload logic
    //   coverPhoto = {
    //     public_id: uploadedFile.public_id,
    //     url: uploadedFile.secure_url,
    //     file_name: req.file.originalname,
    //   };
    // }

    const campusDrive = await CampusDrive.create({
      ...req.body,
      coverPhoto,
    });

    company.campusDrives.push(campusDrive._id);

    await company.save();

    res.status(200).json({
      success: true,
      campusDrive,
    });
  } catch (err) {
    console.log(err);
  }
});

// Get all campus drives of a company
// Route: /api/company/campusdrive
exports.getCampusDrives = catchAsyncErrors(async (req, res, next) => {
  const userRole = req.user.role;
  const user = req.user;
  let campusDrives;

  console.log(userRole); //printing company

  if (userRole == "company") {
    const company = await Company.findById(req.user.id).populate(
      "campusDrives"
    );
    if (!company) {
      return next(new ErrorHandler("Company not found", 404));
    }
    campusDrives = company.campusDrives;
  } else if (userRole == "college") {
    const college = await College.findById(req.user.id).populate(
      "campusDrives"
    );
    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }
    campusDrives = college.campusDrives;
  } else {
    return next(
      new ErrorHandler("You are not authorized to access this route", 401)
    );
  }

  res.status(200).json({
    success: true,
    campusDrives,
  });
});
// Get a campus drive by id
// Route: /api/company/campusdrive/:id

exports.getCampusDrive = catchAsyncErrors(async (req, res, next) => {
  const campusDrive = await CampusDrive.findById(req.params.id)
    .populate({ 
      path: 'colleges', 
      select: 'CollegeName Email Phone Address avatar _id' 
    })
    .populate({
      path: 'tests.test', 
      select: 'name totalTime totalMarks'
    })
    .populate({
      path: 'tests.students.studentResponse', 
      select: 'status score'
    })
    .populate({
      path: 'tests.assignedTo',  // Fixed path from test.assignedTo to tests.assignedTo
      select: 'CollegeName Email Phone Address avatar _id'
    });

  if (!campusDrive) {
    return next(new ErrorHandler("Campus drive not found", 404));
  }

  res.status(200).json({
    success: true,
    campusDrive,
  });
});

// Update a campus drive by id
// Route: /api/company/campusdrive/:id
exports.updateCampusDrive = catchAsyncErrors(async (req, res, next) => {
  let campusDrive = await CampusDrive.findById(req.params.id);
  if (!campusDrive) {
    return next(new ErrorHandler("Campus drive not found", 404));
  }
  campusDrive = await CampusDrive.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    campusDrive,
  });
});

// Delete a campus drive by id
// Route: /api/company/campusdrive/:id

exports.deleteCampusDrive = catchAsyncErrors(async (req, res, next) => {
  const campusDrive = await CampusDrive.findById(req.params.id);
  if (!campusDrive) {
    return next(new ErrorHandler("Campus drive not found", 404));
  }
  await campusDrive.deleteOne();
  // delete all student responses for this campus drive
  await StudentResponse.deleteMany({ campusDrive: req.params.id });

  // delete all assessments for this campus drive
  const assessments = await Assessment.find({ campusDrive: req.params.id });

  for (let i = 0; i < assessments.length; i++) {
    await assessments[i].deleteOne();
  }
  // remove from college and company

for (let i = 0; i < campusDrive.colleges.length; i++) {
  const college = await College.findById(campusDrive.assignedTo[i]);

  college.campusDrives.pull(req.params.id);
  await college.save();
}
  const company = await Company.findById(campusDrive.company);
  company.campusDrives.pull(req.params.id);
  await company.save();

  res.status(200).json({
    success: true,
    message: "Campus drive deleted successfully",
  });
});

// add colleges to a campus drive

// Route: /api/company/campusdrive/:id/colleges

exports.addCollegesToCampusDrive = catchAsyncErrors(async (req, res, next) => {
  try {
    const campusDrive = await CampusDrive.findById(req.params.id).populate(
      "company"
    );
    if (!campusDrive) {
      return next(new ErrorHandler("Campus drive not found", 404));
    }
    const colleges = req.body.colleges;
    for (let i = 0; i < colleges.length; i++) {
      const college = await College.findById(colleges[i]);
      if (!college) {
        return next(new ErrorHandler("College not found", 404));
      }
      campusDrive.colleges.push(colleges[i]);
      college.campusDrives.push(req.params.id);
      await college.save();

   
    }
    await campusDrive.save();
    res.status(200).json({
      success: true,
      message: "Colleges added successfully",
    });
  } catch (error) {

    console.log("ERROR", error);

    // return next(new ErrorHandler(error, 500));
  }
});

// assign Test to a campus drive
// Route: /api/company/campusdrive/:id/test

exports.assignTestToCampusDrive = catchAsyncErrors(async (req, res, next) => {
    try {
        const campusDrive = await CampusDrive.findById(req.params.id)
            .populate('company', 'basic.companyName');
        const colleges = req.body.colleges;
        const testId = req.body.test;
        let failed = {};

        if (!campusDrive) {
            return next(new ErrorHandler("Campus drive not found", 404));
        }

        // Find assessment
        const assessment = await Assessment.findById(testId);
        if (!assessment) {
            return next(new ErrorHandler("Assessment not found", 404));
        }

        // Update assessment
        assessment.campusDrive = req.params.id;
        assessment.status = 'assigned';
        await assessment.save();

        // Process each college
        for (let i = 0; i < colleges.length; i++) {
            try {
                const college = await College.findById(colleges[i]);
                if (!college) {
                    failed[colleges[i]] = "College not found";
                    continue;
                }

                // Check for duplicate assignment
                const isTestAssigned = campusDrive.tests.some(
                    test => test.assignedTo.toString() === colleges[i] && 
                    test.test.toString() === testId
                );

                if (isTestAssigned) {
                    failed[colleges[i]] = "Test already assigned";
                    continue;
                }

                // Add test to campus drive
                campusDrive.tests.push({
                    test: testId,
                    assignedTo: colleges[i],
                    students: []
                });

                // Send email notification
                await sendEmail({
                    email: college.Email,
                    subject: `New Test Added for ${campusDrive.name} Campus Drive`,
                    html: sendMailForTestAdded(
                        {
                            _id: campusDrive._id,
                            driveName: campusDrive.name
                        },
                        'college',
                        college,
                        assessment
                    ).html
                });

            } catch (error) {
                failed[colleges[i]] = error.message;
                console.error(`Error processing college ${colleges[i]}:`, error);
            }
        }

        await campusDrive.save();

        res.status(200).json({
            success: true,
            message: "Test assigned successfully",
            failed: Object.keys(failed).length > 0 ? failed : undefined,
            assessment: assessment._id
        });

    } catch (error) {
        console.error("Error assigning test:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get all students of a college for a campus drive
// Route: /api/company/campusdrive/:id/college/:collegeId/students

// exports.getStudentsOfCollege = catchAsyncErrors(async (req, res, next) => {
//     const campusDrive = await CampusDrive.findById(req.params.id);
//     if (!campusDrive) {
//         return next(new ErrorHandler("Campus drive not found", 404));
//     }
//     const college = await College.findById(req.params.collegeId);
//     if (!college) {
//         return next(new ErrorHandler("College not found", 404));
//     }
//     const students = await Student.find({college: req.params.collegeId});
//     res.status(200).json({
//         success: true,
//         students,
//     });
// });

// Get all students of a college for a campus drive
// Route: /api/company/campusdrive/:id/college/:collegeId/students

// get all student responses for a campus drive
// Route: /api/company/campusdrive/:id/studentresponses

exports.getStudentResponses = catchAsyncErrors(async (req, res, next) => {
  const query = {
    campusDrive: req.params.id,
    limit: req.query.limit,
    page: req.query.page,

    gte: req.query.gte,
    lt: req.query.lt,
    college: req.query.college,
    status: req.query.status,
  };
  const campusDrive = await CampusDrive.findById(req.params.id).populate({
    path: "tests.students.studentResponse",
  });

  if (!campusDrive) {
    return next(new ErrorHandler("Campus drive not found", 404));
  }

  const allStudentResponses = await campusDrive.tests.map((test) =>
    test.students.map((student) => student.studentResponse)
  );
  // const studentResponses = await StudentResponse.find({campusDrive: req.params.id});

  res.status(200).json({
    success: true,
    allStudentResponses,
  });
});

// @get colleges of a campus drive - with status that test assigned or not
// Route: /api/company/campusdrive/:id/colleges

exports.getCollegesForCampusDrive = catchAsyncErrors(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const campusDrive = await CampusDrive.findById(req.params.id)
      .select("colleges company name status")
      .populate({
        path: "company",
        select: "basic companyDetails Email Phone Address -_id",
      })
      .populate({
        path: "colleges",
        select: "CollegeName Email Phone Address avatar _id",
      });

    if (!campusDrive) {
      return next(new ErrorHandler("Campus drive not found", 404));
    }

    const allColleges = await College.find()
      .select("CollegeName Email Phone Address avatar _id")
      .skip(skip)
      .limit(limit);

    const totalColleges = await College.countDocuments();

    const availableColleges = allColleges.filter(
      (college) =>
        !campusDrive.colleges.some(
          (campusCollege) =>
            campusCollege &&
            campusCollege._id &&
            college._id &&
            campusCollege._id.toString() === college._id.toString()
        )
    );

    res.status(200).json({
      success: true,
      data: {
        campusDrive: {
          _id: campusDrive._id,
          name: campusDrive.name,
          status: campusDrive.status,
          company: campusDrive.company,
        },
        availableColleges,
        assignedColleges: campusDrive.colleges,
        pagination: {
          total: totalColleges,
          currentPage: page,
          totalPages: Math.ceil(totalColleges / limit),
          limit,
        },
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
});
