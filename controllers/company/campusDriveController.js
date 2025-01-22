const mongoose = require("mongoose");
const ErrorHandler = require("../../utils/errorhandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const Company = require("../../models/company/companyModel");
const CampusDrive = require("../../models/company/campusDriveModel");
const College = require("../../models/college/collegeModel");
const Student = require("../../models/student/studentModel");
const Assessment = require("../../models/college/assessment/assessments");
const StudentResponse = require("../../models/student/studentResponse");
const sendEmail = require("../../utils/sendEmail");
const {
  sendMailForTestAdded,
} = require("../../utils/constants/emailMessagesConstants");

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
  let campusDrive = await CampusDrive.findById(req.params.id)
    .populate({
      path: "colleges",
      select: "CollegeName Email Phone Address avatar _id",
    })
    .populate({
      path: "companies",
      select: "basic.companyName Email Phone Address avatar _id",
    })
    .populate({
      path: "tests.test",
      select: "name totalTime totalMarks",
    })
    .populate({
      path: "tests.assignedTo",
      select: "CollegeName Email avatar _id",
    });

  if (!campusDrive) {
    return next(new ErrorHandler("Campus drive not found", 404));
  }

  // If user is college, filter tests assigned to them
  if (req.user.role === "college") {
    const collegeTests = campusDrive.tests.filter((test) => {
      const isAssigned = test.assignedTo.some(
        (college) => college._id.toString() === req.user.id
      );
      return isAssigned;
    });

    for (let i = 0; i < collegeTests.length; i++) {
      let test = await Assessment.findById(collegeTests[i].test)
        .populate("invitedStudents", "FirstName LastName Email Phone avatar")
        .populate("studentResponses", "studentId status percentage totalMarks")
        .select("name totalTime totalMarks invitedStudents studentResponses");
      collegeTests[i].test = test;
    }
    campusDrive = {
      ...campusDrive._doc,
      tests: collegeTests,
      colleges: [{ _id: req.user.id }],
    };
  } else {
    //  get all invited students for  per test
    // get all studentResponses for per test
    // add to the test object

    for (let i = 0; i < campusDrive.tests.length; i++) {
      let test = await Assessment.findById(campusDrive.tests[i].test)
        .populate({
          path: "invitedStudents",
          select: "FirstName LastName Email Phone avatar",
        })
        .populate({ path: "studentResponses", select: "studentId status" })
        .select("name totalTime totalMarks invitedStudents");

      // combine students and studentResponses
      campusDrive.tests[i].test = test;
    }
  }

  res.status(200).json({
    success: true,
    campusDrive,
  });
});

exports.searchCampusDrive = catchAsyncErrors(async (req, res, next) => {
  // const response = await axios.get(
  //   `${REACT_APP_API_URL}/api/company/campus-drive/${driveId}/colleges/search`
  //   , {
  //   params: { searchTerm },
  //   headers: {
  //     "Content-Type": "application/json",
  //     "auth-token": getCookie("token"),
  //   },
  // });

  const campusDrives = await CampusDrive.find().populate({
    path: "colleges",
    match: { CollegeName: { $regex: req.query.searchTerm, $options: "i" } },
    select: "CollegeName Email Phone Address avatar _id",
  });

  res.status(200).json({
    success: true,
    campusDrives,
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
    const campusDrive = await CampusDrive.findById(req.params.id).populate(
      "company",
      "basic.companyName"
    );
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
    assessment.status = "assigned";
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
          (test) =>
            test.assignedTo.toString() === colleges[i] &&
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
          students: [],
        });

        // Send email notification
        await sendEmail({
          email: college.Email,
          subject: `New Test Added for ${campusDrive.name} Campus Drive`,
          html: sendMailForTestAdded(
            {
              _id: campusDrive._id,
              driveName: campusDrive.name,
            },
            "college",
            college,
            assessment
          ).html,
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
      assessment: assessment._id,
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
    const search = req.query.search ? req.query.search.trim() : "";

    // Fetch the campus drive details
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

    // Get assigned college IDs
    const assignedCollegeIds = campusDrive.colleges.map((college) =>
      college._id.toString()
    );

    // Build search query
    const searchQuery = {
      _id: { $nin: assignedCollegeIds },
    };

    if (search && search !== "undefined") {
      searchQuery.CollegeName = { $regex: search, $options: "i" };
    }

    // Get total count
    const totalColleges = await College.countDocuments(searchQuery);

    // Calculate pagination
    const totalPages = Math.max(1, Math.ceil(totalColleges / limit));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;

    // Fetch colleges
    const availableColleges = await College.find(searchQuery)
      .select("CollegeName Email Phone Address avatar _id")
      .skip(skip)
      .limit(limit);

    const totalColleges = await College.countDocuments();

    // Filter available colleges (excluding already assigned colleges)
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
          currentPage,
          totalPages,
          limit,
        },
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// @add company to a campus drive

// Route: /api/company/campusdrive/:id/company

exports.addCompaniesToCampusDrive = catchAsyncErrors(async (req, res, next) => {
  try {
    const campusDrive = await CampusDrive.findById(req.params.id).populate(
      "company"
    );
    if (!campusDrive) {
      return next(new ErrorHandler("Campus drive not found", 404));
    }
    const companies = req.body.companies;
    for (let i = 0; i < companies.length; i++) {
      const company = await Company.findById(companies[i]);
      if (!company) {
        // return next(new ErrorHandler("Company not found", 404));
        console.log("Company not found");
        continue;
      }

      campusDrive.companies.push(companies[i]);
      company.campusDrives.push(req.params.id);
      await company.save();
    }
    await campusDrive.save();
    res.status(200).json({
      success: true,
      message: "Company added successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
});

// get multiple tests data for a campus drive

// Route: /api/company/campusdrive/:id/tests

exports.getTestsDataForCampusDrive = catchAsyncErrors(
  async (req, res, next) => {
    const { testIds } = req.body;
    const campusDrive = await CampusDrive.findById(req.params.id);
    if (!campusDrive) {
      return next(new ErrorHandler("Campus drive not found", 404));
    }

    const tests = await Assessment.find({ _id: { $in: testIds } });
    // const studentResponses = await StudentResponse.find({campusDrive: req.params.id});
    res.status(200).json({
      success: true,
      tests,
    });
  }
);

// select a student for interview

// Route: /api/company/campusdrive/:id/student/:studentId/select

// exports.selectStudentByCompany = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { id: campusDriveId, } = req.params;
//     const { studentId, testId, status  } = req.body;
//     const companyId = req.user.id;

//     console.log("campusDriveId", campusDriveId);

//     // Find campus drive and validate
//     const campusDrive = await CampusDrive.findById(campusDriveId);
//     if (!campusDrive) {
//       return next(new ErrorHandler("Campus drive not found", 404));
//     }

//     // Find test in campus drive
//     const test = campusDrive.tests.find((t) => t.test.toString() === testId);
//     if (!test) {
//       return next(new ErrorHandler("Test not found in campus drive", 404));
//     }

//     const testData = await Assessment.findById(testId).populate({
//       path: "studentResponses",
//       select: "student selectionStatus selectedBy",
//     });

//     // Find student entry in test
//     const studentResponse = testData?.studentResponses?.find((s) =>
//       s.student?.toString() === studentId._id
//     );

//     if (!studentResponse) {
//       return next(new ErrorHandler("Student not found in test", 404));
//     }

//     // Check if student is already selected by this company
//     if (studentResponse.selectedBy?.includes(companyId)) {
//       return next(
//         new ErrorHandler("Student already selected by your company", 400)
//       );
//     }

//     // Check if student is already selected by 3 companies
//     if (studentResponse.selectedBy && studentResponse.selectedBy.length >= 3) {
//       return next(
//         new ErrorHandler(
//           "Student has already been selected by maximum number of companies (3)",
//           400
//         )
//       );
//     }

//     // Check if student is already selected by 3 companies
//     if (studentResponse.selectedBy && studentResponse.selectedBy.length >= 3) {
//       return next(
//         new ErrorHandler(
//           "Student already selected by maximum number of companies",
//           400
//         )
//       );
//     }

//     // Update test status in campus drive
//     const testIndex = campusDrive.tests.findIndex(t => t.test.toString() === testId);
//     if (testIndex !== -1) {
//         const studentIndex = campusDrive.tests[testIndex].students.findIndex(
//             s => s.studentId?.toString() === studentId._id
//         );
//         if (studentIndex !== -1) {
//             campusDrive.tests[testIndex].students[studentIndex].status = status;
//             campusDrive.tests[testIndex].students[studentIndex].selectedBy = companyId;
//         }
//     }

//     // Update student response
//     studentResponse.selectionStatus = status;
//     studentResponse.selectedBy.push(companyId);

//     await Promise.all([
//         studentResponse.save(),
//         campusDrive.save()
//     ]);

//     res.status(200).json({
//       success: true,
//       data : {
//         studentResponse,
//         campusDrive

//       },

//       message: "Student shortlisted for further process",
//     });
//   } catch (error) {
//     console.error("Error in selectStudentByCompany:", error);
//     return next(new ErrorHandler(error.message, 500));
//   }
exports.selectStudentByCompany = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id: campusDriveId } = req.params;
    const { studentId, testId, status } = req.body;
    const companyId = req.user.id;

    // Find campus drive and validate
    const campusDrive = await CampusDrive.findById(campusDriveId);
    if (!campusDrive) {
      return next(new ErrorHandler("Campus drive not found", 404));
    }

    // Find test in campus drive
    const test = campusDrive.tests.find((t) => t.test.toString() === testId);
    if (!test) {
      return next(new ErrorHandler("Test not found in campus drive", 404));
    }

    const testData = await Assessment.findById(testId).populate({
      path: "studentResponses",
      select: "student selection",
    });

    // Find student response
    const studentResponse = testData?.studentResponses?.find(
      (s) => s.student?.toString() === studentId._id
    );

    if (!studentResponse) {
      return next(new ErrorHandler("Student not found in test", 404));
    }

    // Initialize selection array if it doesn't exist
    if (!studentResponse.selection) {
      studentResponse.selection = [];
    }

    // Find if company has already selected this student
    const existingSelectionIndex = studentResponse.selection.findIndex(
      (sel) => sel.selectedBy.toString() === companyId
    );

    if (existingSelectionIndex !== -1) {
      // Update existing selection status
      studentResponse.selection[existingSelectionIndex].selectionStatus =
        status;
    } else {
      // Check if max selections reached
      // Count how many companies have shortlisted this student
      const shortlistedCount = studentResponse.selection.filter(
        (sel) => sel.selectionStatus === "shortlisted"
      ).length;

      if (shortlistedCount >= 3) {
        return next(
          new ErrorHandler(
            "Student has already been shortlisted by maximum number of companies (3)",
            400
          )
        );
      }

      // Add new selection
      studentResponse.selection.push({
        selectedBy: companyId,
        selectionStatus: status,
      });
    }

    // Update test status in campus drive
    const testIndex = campusDrive.tests.findIndex(
      (t) => t.test.toString() === testId
    );
    if (testIndex !== -1) {
      const studentIndex = campusDrive.tests[testIndex].students.findIndex(
        (s) => s.student?.toString() === studentId._id
      );
      if (studentIndex !== -1) {
        campusDrive.tests[testIndex].students[studentIndex].status = status;
        campusDrive.tests[testIndex].students[studentIndex].selectedBy =
          companyId;
      }
    }

    await Promise.all([studentResponse.save(), campusDrive.save()]);

    res.status(200).json({
      success: true,
      data: {
        studentResponse,
        campusDrive,
      },
      message: "Student selection status updated successfully",
    });
  } catch (error) {
    console.error("Error in selectStudentByCompany:", error);
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.getStudentsResult = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id: campusDriveId } = req.params;
    const { testId, college, selectionStatus } = req.query;

    // 1. Find Campus Drive
    const campusDrive = await CampusDrive.findById(campusDriveId);
    if (!campusDrive) {
      return next(new ErrorHandler("Campus drive not found", 404));
    }

    // 2. Build Match Query
    const responseMatch = {};
    if (college) {
      // console.log("college", college ,);
      responseMatch["studentId.CollegeId"] = new mongoose.Types.ObjectId(college);
    }
    if (selectionStatus) {
      responseMatch["selection.selectionStatus"] = selectionStatus;
    }

    // 3. Filter Tests
    const filteredTests = testId 
      ? campusDrive.tests.filter(t => t.test.toString() === testId)
      : campusDrive.tests;

    const resultsByCollege = {};

    // 4. Process Each Test
    for (const testObj of filteredTests) {
      // Check college assignment
      if (college) {
        const isAssigned = testObj.assignedTo.some(
          assignedCollege => assignedCollege.toString() === college
        );
        if (!isAssigned) continue;
      }

      const test = await Assessment.findById(testObj.test)
        .populate({
          path: "studentResponses",
          match: responseMatch,
          select: "studentId status percentage totalMarks selection",
          populate: [
            {
              path: "studentId",
              select: "FirstName LastName Email Phone avatar CollegeId",
              populate: {
                path: "CollegeId",
                select: "CollegeName"
              }
            },
            {
              path: "selection.selectedBy",
              model: "Company",
              select: "basic.companyName"
            }
          ]
        });

      if (!test?.studentResponses?.length) continue;

      // 5. Process Student Responses
      test.studentResponses.forEach(response => {
        const collegeId = response.studentId?.CollegeId?._id;
        if (!collegeId) return;

        // Initialize college results
        if (!resultsByCollege[collegeId]) {
          resultsByCollege[collegeId] = {
            collegeName: response.studentId?.CollegeId?.CollegeName || "Unknown College",
            tests: {}
          };
        }

        // Add test results
        if (!resultsByCollege[collegeId].tests[test._id]) {
          resultsByCollege[collegeId].tests[test._id] = {
            testName: test.name,
            totalMarks: test.totalMarks,
            students: []
          };
        }

        // Add student data
        resultsByCollege[collegeId].tests[test._id].students.push({
          studentId: response.studentId._id,
          name: `${response.studentId.FirstName} ${response.studentId.LastName}`,
          email: response.studentId.Email,
          phone: response.studentId.Phone,
          avatar: response.studentId.avatar,
          score: response.totalMarks,
          percentage: response.percentage,
          totalSelections: response.selection?.filter(
            sel => sel.selectionStatus === selectionStatus
          ).length || 0,
          selections: response.selection?.map(sel => ({
            status: sel.selectionStatus,
            company: sel.selectedBy?.basic?.companyName || "Unknown Company",
            companyId: sel.selectedBy?._id?.toString()
          })) || []
        });
      });
    }

    res.status(200).json({
      success: true,
      data: resultsByCollege,
      filters: { testId, college, selectionStatus }
    });

  } catch (error) {
    console.error("Error in getStudentsResult:", error);
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.getCompaniesForCampusDrive = catchAsyncErrors(
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search ? req.query.search.trim() : "";

      // Fetch campus drive with companies
      const campusDrive = await CampusDrive.findById(req.params.id)
        .select("companies company name status")
        .populate({
          path: "companies",
          select: "basic.companyName Email Phone Address avatar _id",
        });

      if (!campusDrive) {
        return next(new ErrorHandler("Campus drive not found", 404));
      }

      // Get assigned company IDs
      const assignedCompanyIds = campusDrive.companies.map((company) =>
        company._id.toString()
      );

      // Build search query
      const searchQuery = {
        _id: { $nin: assignedCompanyIds },
      };

      if (search && search !== "undefined") {
        searchQuery["basic.companyName"] = { $regex: search, $options: "i" };
      }

      // Get total count
      const totalCompanies = await Company.countDocuments(searchQuery);

      // Calculate pagination
      const totalPages = Math.max(1, Math.ceil(totalCompanies / limit));
      const currentPage = Math.min(page, totalPages);
      const skip = (currentPage - 1) * limit;

      // Fetch available companies
      const availableCompanies = await Company.find(searchQuery)
        .select("basic.companyName Email Phone Address avatar _id")
        .skip(skip)
        .limit(limit)
        .lean();

      res.status(200).json({
        success: true,
        data: {
          campusDrive: {
            id: campusDrive.id,
            name: campusDrive.name,
            status: campusDrive.status,
          },
          availableCompanies,
          assignedCompanies: campusDrive.companies,
          pagination: {
            total: totalCompanies,
            currentPage,
            totalPages,
            limit,
          },
        },
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
