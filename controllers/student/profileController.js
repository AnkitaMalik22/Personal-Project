const { Student } = require('../../models/student/studentModel');
const catchAsyncErrors = require('../../middlewares/catchAsyncErrors');
const sendToken = require('../../utils/jwtToken');
const ErrorHandler = require('../../utils/errorhandler');
const crypto = require('crypto');

const College = require('../../models/college/collegeModel');
const Job = require('../../models/company/jobModel');
const Invitation = require('../../models/student/inviteModel');
const axios = require('axios');
const cloudinary = require('cloudinary');




export const uploadCV = catchAsyncErrors(async (req, res, next) => {
  const student = await Student.findById(req.user.id);
    if (!student) {
        return next(new ErrorHandler('Student not found', 404));
    }
    if (!req.files) {
        return next(new ErrorHandler('Please upload a file', 400));
    }
    const file = req.files.file;
    if (!file.mimetype.startsWith('application/pdf')) {
        return next(new ErrorHandler('Please upload a pdf file', 400));
    }
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(new ErrorHandler('File too large', 400));
    }
    file.name = `CV_${student._id}${path.parse(file.name
    ).ext}`;
// cloudinary upload
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
        folder: 'CV',
        public_id: file.name
    });
    const cvUrl = result.secure_url;
    await Student.findByIdAndUpdate(req.user.id, {
        cvUrl
    });
    res.status(200).json({
        success: true,
        cvUrl,
        message: 'CV uploaded successfully',
        user : student
    });
});



module.exports = {
    uploadCV
};







