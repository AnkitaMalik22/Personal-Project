const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ErrorHandler = require("../../utils/errorhandler");
const CampusDrive = require("../../models/company/campusDriveModel");
const College = require("../../models/college/collegeModel");

exports.getCollegeCampusDrives = catchAsyncErrors(async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      // status,
      // startDate,
      // endDate,
      // company
    } = req.query;

    const college = await College.findById(req.user.id)
      .populate("campusDrives")
      .select("campusDrives");
    console.log(college);
    const campusDrives = college?.campusDrives;

    const total = campusDrives.length;

    res.status(200).json({
      success: true,
      data: {
        campusDrives,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
