// Admin Approval for registered companies
// Admin Approval + Tier assign for registered colleges
// create one controller use type to differentiate between company and college

const Company = require("../../models/company/companyModel");
const College = require("../../models/college/collegeModel");
const University = require("../../models/university/universityModel");

const ErrorHandler = require("../../utils/errorhandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const sendEmail = require("../../utils/sendEmail");
const crypto = require("crypto");

// Approve Company or College

exports.approveUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { type, id } = req.params;
    // example api with type company and id 5f7b1b7b7f3b5b0017f3b5b0
    // api/admin/approve-user/company/5f7b1b7b7f3b5b0017f3b5b0

    const { tier, status } = req.body;
    if (!status) {
      return next(new ErrorHandler("Please provide status", 400));
    }
    if ( status !== "approved" && status !== "rejected" && status !== "pending") {
      return next(new ErrorHandler("Invalid status", 400));
    }
    if (type !== "company" && type !== "college" && type !== "university") {
      return next(new ErrorHandler("Invalid type", 400));
    }
    if ( type !== "university" && type === "college" && status === "approved" && !tier) {
      return next(new ErrorHandler("Please provide tier", 400));
    }
    if (
      type === "college" &&
      status === "approved" &&
      tier !== "tier1" &&
      tier !== "tier2" &&
      tier !== "tier3"
    ) {
      return next(new ErrorHandler("Invalid tier", 400));
    }

    let user;
    if (type === "company") {
      user = await Company.findById(id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      user.status = status;
      user.statusChangedAt = Date.now();

      if (status === "rejected") {
        if (!req.body.comment) {
          return next(
            new ErrorHandler("Please provide a reason for rejection", 400)
          );
        }
        user.commentsByAdmin.push({
          comment: req.body.comment,
          commentedBy: user._id,
          commentedAt: Date.now(),
        });
      }
      await user.save();
      sendEmail({
        email: user.Email,
        subject: "Company Approval",
        message: `Your Company has been approved by skillaccess`,
      });
    } else if (type === "college") {
      user = await College.findById(id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      user.status = status;
      user.statusChangedAt = Date.now();
      user.tier = tier;
      if (status === "rejected") {
        if (!req.body.comment) {
          return next(
            new ErrorHandler("Please provide a reason for rejection", 400)
          );
        }
        user.commentsByAdmin.push({
          comment: req.body.comment,
          commentedBy:user._id,
          commentedAt: Date.now(),
        });
      }
      await user.save();

      sendEmail({
        email: user.Email,
        subject: "College Approval",
        message: `Your College has been approved by skillaccess and assigned to ${tier} `,
      });
    } else if (type === "university") {
      user = await University.findById(id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      user.isApproved = true;
      user.verificationStatus = "approved";
      user.statusChangedAt = Date.now();

      if (status === "rejected") {
        user.isApproved = false;
        user.verificationStatus = "rejected";
        if (!req.body.comment) {
          return next(
            new ErrorHandler("Please provide a reason for rejection", 400)
          );
        }
        user.commentsByAdmin.push({
          comment: req.body.comment,
          commentedBy: user?._id,
        //   commentedBy: req.user.id,
          commentedAt: Date.now(),
        });
      }

      await user.save();

      sendEmail({
        email: user.Email,
        subject: "University Approval",
        message: `Your University has been approved by skillaccess`,
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    next(new ErrorHandler(error.message, 500));
  }
});

// get college tier wise

exports.getColleges = catchAsyncErrors(async (req, res, next) => {
  try {
    const { tier } = req.query;
    // if (!tier) {
    //     return next(new ErrorHandler('Please provide tier', 400));
    // }

    if (tier !== "tier1" && tier !== "tier2" && tier !== "tier3") {
      const colleges = await College.find({ status: "approved" }).sort({
        createdAt: -1,
      });
      return res.status(200).json({
        success: true,
        colleges,
      });
    }
    const collegesByTier = await College.find({ tier }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      colleges: collegesByTier,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

exports.getRequestedColleges = catchAsyncErrors(async (req, res, next) => {
  try {
    const colleges = await College.find({
      $or: [{ status: "pending" }, { status: { $exists: false } }],

      // We'll have to change this to -1 after deleting all the current clgs .
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      colleges,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

exports.getCompanies = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.query;
  try {
    const companies = await Company.find({ status: status || "pending" }).sort({
      createdAt: 1,
    });
    res.status(200).json({
      success: true,
      companies,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});


exports.getUniversities = catchAsyncErrors(async (req, res, next) => {
  try {
    const type = req.query.type;
    if(type !== "approved" && type !== "pending"){
      return next(new ErrorHandler("Invalid type", 400));
    }
    if(type === "approved"){
      const universities = await University.find({
        isApproved: true,
        verificationStatus: "approved",
      }).sort({ createdAt: 1 });
      return res.status(200).json({
        success: true,
        message: "Fetched Verified Universities",
        universities,
      });
    }else{
      const universities = await University.find({
        isApproved: false,
        verificationStatus: "pending",
      }).sort({ createdAt: 1 });
      return res.status(200).json({
        success: true,
        message: "Fetched Pending Universities",
        universities,
        });
    }
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});
