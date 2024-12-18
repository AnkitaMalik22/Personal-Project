const { Student } = require("../../models/student/studentModel");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const sendToken = require("../../utils/jwtToken");
const ErrorHandler = require("../../utils/errorhandler");
const crypto = require("crypto");

const College = require("../../models/college/collegeModel");
const Job = require("../../models/company/jobModel");
const Invitation = require("../../models/student/inviteModel");
const axios = require("axios");
const cloudinary = require("cloudinary");
const UploadedStudents = require("../../models/student/uploadedStudents");
const InvitedStudents = require("../../models/college/student/Invited");
const University = require("../../models/university/universityModel");

exports.uploadCV = catchAsyncErrors(async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id);
    const uploadPromises = [];
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    if (!req.files) {
      return next(new ErrorHandler("Please upload a file", 400));
    }
    // console.log(req.files);

    if(req.files?.size > 50000){
      return next(new ErrorHandler("File size should be less than 50kb", 400));
    }

    for (let i = 0; i < Object.values(req.files).length; i++) {
      let file = Object.values(req.files)[i];
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "CV",
        filename_override: file.name,
        resource_type: "auto",
      });

      uploadPromises.push(result);
    }

    const uploadedFiles = await Promise.all(uploadPromises);

    let result = uploadedFiles[0];

    console.log(result);

    const cvUrl = result.secure_url;
    await Student.findByIdAndUpdate(req.user.id, {
      Cv: {
        url: cvUrl,
        public_id: result.public_id,
        file_name:Object.values(req.files)[0].name
      },
    });
    res.status(200).json({
      success: true,
      cvUrl,
      message: "CV uploaded successfully",
      user: student,
    });
  } catch (error) {
    // console.log(error);
    return next(new ErrorHandler("Something went wrong", 500));
  }
});

exports.updatePersonalInfo = catchAsyncErrors(async (req, res, next) => {
  const { PhoneNumber, Website, Address } = req.body;

  const student = await Student.findByIdAndUpdate(
    req.user.id,

    req.body,

    // {
    //   PhoneNumber,
    //   Website,
    //   Address,

    // },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    user: student,
  });
});

exports.updateEducation = catchAsyncErrors(async (req, res, next) => {
  try {
    const data = req.body;
    // console.log(data);
    const student = await Student.findById(req.user.id);
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }
    const { School, Description, Degree, StartDate, EndDate, Media, Place } =
      data;

    if (
      School === "" ||
      Description === "" ||
      Degree === "" ||
      StartDate === "" ||
      EndDate === "" ||
      Place === ""
    ) {
      return next(
        new ErrorHandler("Please provide the education details", 400)
      );
    }

    if (!Media) {
      return next(new ErrorHandler("Please upload a file", 400));
    }
    console.log(Media.length, "media");

    const allMedia = [];

    for (const media of Media) {
      const myCloud = await cloudinary.v2.uploader.upload(media, {
        folder: "education",
        width: 150,
        crop: "scale",
      });
      allMedia.push({
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
        file_name: myCloud.original_filename,
      });
    }

    console.log(allMedia);

    await student.Education.push({
      School,
      Description,
      Degree,
      StartDate,
      EndDate,
      Place,
      Media: allMedia,
    });
    await student.save();

    res.status(200).json({
      success: true,
      user: student,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Something went wrong", 500));
  }
});

// exports.editEducation = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const data = req.body;
//     // console.log(data);
//     const student = await Student.findById(req.user.id);
//     if (!student) {
//       return next(new ErrorHandler("Student not found", 404));
//     }
//     const { School, Description, Degree, StartDate, EndDate, Media, Place } =
//       data;

//     if (
//       School === "" ||
//       Description === "" ||
//       Degree === "" ||
//       StartDate === "" ||
//       EndDate === "" ||
//       Place === ""
//     ) {
//       return next(
//         new ErrorHandler("Please provide the education details", 400)
//       );
//     }

//     if (!Media) {
//       return next(new ErrorHandler("Please upload a file", 400));
//     }
//     console.log(Media.length, "media");

//     const allMedia = [];

//     for (const media of Media) {
//       console.log(media);
//       const myCloud = await cloudinary.v2.uploader.upload(media, {
//         folder: "education",
//         width: 150,
//         crop: "scale",
//       });
//       allMedia.push({
//         public_id: myCloud.public_id,
//         url: myCloud.secure_url,

//         file_name: myCloud.original_filename,
//       });
//     }

//     console.log(allMedia);

//     const index = student.Education.findIndex(
//       (edu) => edu._id.toString() === req.params.id
//     );

//     if (index === -1) {
//       return next(new ErrorHandler("Education not found", 404));
//     }

//     student.Education[index] = {
//       School,
//       Description,
//       Degree,
//       StartDate,
//       EndDate,
//       Place,
//       Media: allMedia,
//     };

//     await student.save();

//     res.status(200).json({
//       success: true,
//       user: student,
//       message: "Education updated successfully",
//     });
//   } catch (error) {

//     console.log(error);
//     return next(new ErrorHandler("Something went wrong", 500));
//   }
// });

exports.editEducation = catchAsyncErrors(async (req, res, next) => {
  try {
    const data = req.body;
    // console.log(data);
    const student = await Student.findById(req.user.id);
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    student.Education = req.body.Education;

    await student.save();

    res.status(200).json({
      success: true,
      user: student,
      message: "Education updated successfully",
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Something went wrong", 500));
  }
});

exports.uploadMedia = async (req, res) => {
  try {
    const uploadPromises = [];
    let pics = [];
    // Iterate over uploaded files

    for (let i = 0; i < Object.values(req.files).length; i++) {
      let file = Object.values(req.files)[i];
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "education",
        filename_override: file.name,
        resource_type: "auto",
      });
      uploadPromises.push(result);
    }

    const uploadedFiles = await Promise.all(uploadPromises);

    uploadedFiles.forEach((file) => {
      pics.push({
        url: file.url,
        name: file.original_filename,
        format: file.format,
        size: file.bytes,
      });
    });
    console.log(uploadedFiles[0]);
    res.status(200).json(pics);
  } catch (error) {
    console.log("err", error);
    res.status(500).json(error);
  }
};

exports.updateSkills = catchAsyncErrors(async (req, res, next) => {
  try {
    const data = req.body;
    // console.log(data);
    const student = await Student.findById(req.user.id);
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    // Skills: {
    //   SoftwareKnowledge: [{
    //     type: String,
    //   }],
    //   Achievements: [
    //     {
    //       type: String,
    //     },
    //   ],
    //   CodingKnowledge: [{type: String}],
    //   Languages: [{type: String}],
    // },

    const { SoftwareKnowledge, Achievements, CodingKnowledge, Languages } =
      data;

    student.Skills.SoftwareKnowledge = SoftwareKnowledge;
    student.Skills.Achievements = Achievements;
    student.Skills.CodingKnowledge = CodingKnowledge;
    student.Skills.Languages = Languages;
    await student.save();

    res.status(200).json({
      success: true,
      user: student,
    });
  } catch (error) {
    console.log(error);
  }
});

exports.updateLinks = catchAsyncErrors(async (req, res, next) => {
  try {
    const data = req.body;
    // console.log(data);
    const student = await Student.findById(req.user.id);
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }
    
    let entity="college";
    if(student.universityId){
      entity = await University.findById(student.universityId);
    }else{
      entity  = await College.findById(student.CollegeId);
    }
console.log(entity);

    if (!entity) {
      return next(new ErrorHandler("College not found", 404));
    }
    // const { Links } = data;

    // student.Links = Links;
    student.Portfolio = data;
    console.log(!student.completedProfile);
    if (!student.completedProfile) {
      console.log("upl");

      let uploadedStudents = await UploadedStudents.findOne(
        { [entity.role]: [entity._id] }
        // `new: true` returns the modified document
      );
      if (!uploadedStudents) {
        console.log("create");
       uploadedStudents=  await UploadedStudents.create({
          [entity.role]: [entity._id],
        });
      }
      uploadedStudents=  await UploadedStudents.findOneAndUpdate(
        { [entity.role]: [entity._id] },
        {
          $addToSet: { students: student._id },
        }
      );

      console.log("Document updated or created:", uploadedStudents);
      console.log("uplpadedStiudents");
      let invitedStudents = await InvitedStudents.findOne({
        [entity.role]: student[entity._id],
      });
      invitedStudents.students.forEach((stu, i) => {
        if (stu.Email === student.Email) {
          invitedStudents.students.splice(i, 1);
        }
      });
      await invitedStudents.save();

      student.completedProfile = true;
    }

    // college.pendingStudents.push(student._id);

    await entity.save();
    await student.save();

    // console.log(data);

    res.status(200).json({
      success: true,
      user: student,
    });
  } catch (error) {
    console.log(error);
  }
});

exports.updateProfilePictureStudent = catchAsyncErrors(
  async (req, res, next) => {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    // const newCollegeData = req.body;

    // console.log(avatar);

    // const college = await College.findByIdAndUpdate(  req.body.id,
    const student = await Student.findByIdAndUpdate(
      req.user.id,
      {
        avatar: {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    console.log(student);

    res.status(200).json({
      success: true,
      student,
    });
  }
);
