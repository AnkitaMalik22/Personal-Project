const ErrorHandler = require("../../utils/errorhandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const Company = require("../../models/company/companyModel");
const CampusDrive = require("../../models/company/campusDriveModel");
const College = require("../../models/college/collegeModel");
const Student = require("../../models/student/studentModel");
const Assessment = require("../../models/college/assessment/assessments");
const StudentResponse = require("../../models/student/studentResponse");
const sendEmail = require("../../utils/sendEmail");
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

    let coverPhoto = {};
    if (req.file) {
      const uploadedFile = await uploadToCloud(req.file.path); // Replace with your actual upload logic
      coverPhoto = {
        public_id: uploadedFile.public_id,
        url: uploadedFile.secure_url,
        file_name: req.file.originalname,
      };
    }

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
  const campusDrive = await CampusDrive.findById(req.params.id);
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
  const college = await College.findById(campusDrive.assignedTo);
  college.campusDrives.pull(req.params.id);
  await college.save();
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

      sendEmail({
        email: college.Email,
        subject: `Campus Drive Invitation from ${campusDrive.company.basic.companyName}`,
        html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Campus Drive Invitation</title>
                <style>
                    :root {
                        --primary-color: #6eb9be;
                        --primary-dark: #0D9AAC;
                        --text-color: #333;
                        --background-color: #F1F4F8;
                        --container-bg: #ffffff;
                        --border-color: #e0e0e0;
                    }
            
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: var(--text-color);
                        background-color: var(--background-color);
                        margin: 0;
                        padding: 0;
                    }
            
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        padding: 40px;
                        border: 1px solid var(--border-color);
                        border-radius: 12px;
                        background-color: var(--container-bg);
                    }
            
                    .logo {
                        display: block;
                        width: 120px;
                        margin: 0 auto 30px;
                    }
            
                    .header {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 20px;
                        color: var(--primary-dark);
                    }
            
                    h3 {
                        color: var(--primary-dark);
                        margin-top: 30px;
                    }
            
                    .button {
                        display: inline-block;
                        margin: 20px 0;
                        padding: 12px 24px;
                        color: white;
                        background-color: var(--primary-color);
                        text-decoration: none;
                        border-radius: 5px;
                        font-size: 16px;
                        font-weight: bold;
                    }
            
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid var(--border-color);
                        font-size: 14px;
                        color: #555;
                    }
            
                    ul {
                        padding-left: 20px;
                    }
            
                    li {
                        margin-bottom: 10px;
                    }
            
                    @media (max-width: 768px) {
                        .container {
                            padding: 20px;
                            margin: 20px auto;
                        }
                        
                        .logo {
                            width: 100px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img class="logo" src="https://shorturl.at/gtQFu" alt="Skill Access Logo">
                    
                    <div class="header">Campus Drive Invitation</div>
              
                    <p>Dear ${college.CollegeName},</p>
                    
                    <p>
                        We are thrilled to invite your institution to participate in the campus drive organized by 
                        <strong>${campusDrive.company.basic.companyName}</strong>. This is an incredible opportunity 
                        for your students to connect with a top organization and showcase their talents.
                    </p>
                    
                    <h3>Access the Details</h3>
            
                    <p>
                        Log in to your <strong>Skill Access</strong> account using the link below to view the details of the campus drive:
                    </p>
            
                    <a href=${process.env.FRONTEND_URL} class="button">View Campus Drive</a>
                    
                    <p>
                        If the button doesn't work, copy and paste this link into your browser: 
                        <a href=${process.env.FRONTEND_URL}>${process.env.FRONTEND_URL}</a>
                    </p>
            
                    <h3>Why Participate?</h3>
                    <ul>
                        <li>Provide your students with an opportunity to engage with a leading organization.</li>
                        <li>Help your institution stand out by fostering industry connections.</li>
                    </ul>
              
                    <p>
                        If you have any questions or need assistance, feel free to contact our support team at 
                        <a href="mailto:testskillacess@gmail.com">testskillacess@gmail.com</a>.
                    </p>
              
                    <div class="footer">
                        Best regards,<br>
                        Skill Access Team
                    </div>
                </div>
            </body>
            </html>
            `,
      });
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
  const campusDrive = await CampusDrive.findById(req.params.id);
  const college = await College.findById(req.body.college);
  if (!campusDrive) {
    return next(new ErrorHandler("Campus drive not found", 404));
  }
  const assessment = await Assessment.findById(req.body.test);
  if (!assessment) {
    return next(new ErrorHandler("Assessment not found", 404));
  }

  assessment.campusDrive = req.params.id;

  campusDrive.tests.push({
    test: req.body.test,
    assignedTo: college._id,
    students: [],
  });

  college.campusDrives.push(req.params.id);

  // for (let i = 0; i < college.students.length; i++) {
  //     const student = await Student.findById(college.students[i]);
  //     campusDrive.tests[0].students.push({
  //         student: college.students[i],
  //         status: "pending",
  //     });
  //     await campusDrive.tests[0].save();
  // }
  await assessment.save();
  await college.save();
  await campusDrive.save();
  res.status(200).json({
    success: true,
    message: "Test assigned successfully",
  });
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
