const Teams = require("../../../models/college/teams/team");
const ErrorHandler = require("../../../utils/errorhandler");
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const College = require("../../../models/college/collegeModel");



// ==================================== ADD MEMBER ====================================

exports.addMember = catchAsyncErrors(async (req, res, next) => {
    const { Name, Role, Email,Phone } = req.body;

    const team = await Teams.create({
        Name,
        Role,
        Email,
        Phone,
        College: req.user.id,
    });

    res.status(201).json({
        success: true,
        team,
    });
});


// ==================================== GET ALL MEMBERS ====================================

exports.getAllMembers = catchAsyncErrors(async (req, res, next) => {
    const team = await Teams.find({
        College: req.user.id,
    });

    res.status(200).json({
        success: true,
        team,
    });
});

// ==================================== GET SINGLE MEMBER ====================================

exports.getSingleMember = catchAsyncErrors(async (req, res, next) => {
    const team = await Teams.findById(req.params.id);

    if (!team) {
        return next(new ErrorHandler("Member not found", 404));
    }

    res.status(200).json({
        success: true,
        team,
    });
});

// ==================================== UPDATE MEMBER ====================================

exports.updateMember = catchAsyncErrors(async (req, res, next) => {
    let team = await Teams.findById(req.params.id);

    if (!team) {
        return next(new ErrorHandler("Member not found", 404));
    }

    if (team.College.toString() !== req.user.id) {
        return next(new ErrorHandler("You are not allowed to update this member", 403));
    }

    team = await Teams.findByIdAndUpdate
        (req.params.id, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        });

    res.status(200).json({
        success: true,
        team,
    });
}
);


// ==================================== DELETE MEMBER ====================================

exports.deleteMember = catchAsyncErrors(async (req, res, next) => {
    const team = await Teams.findById(req.params.id);

    if (!team) {
        return next(new ErrorHandler("Member not found", 404));
    }

    if (team.College.toString() !== req.user.id) {
        return next(new ErrorHandler("You are not allowed to delete this member", 403));
    }

    await team.remove();

    res.status(200).json({
        success: true,
        message: "Member is deleted",
    });
}
);

//===================== update team profile picture ========================

exports.updateTeamProfile = catchAsyncErrors(async (req, res, next) => {

    const team = await Teams.findById(req.params.id);

    if (!team) {
        return next(new ErrorHandler("Member not found", 404));
    }

    if (team.College.toString() !== req.user.id) {
        return next(new ErrorHandler("You are not allowed to update this member", 403));
    }

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "teamavatars",
        width: 150,
        crop: "scale",
      });

    await Teams.findByIdAndUpdate(req.params.id, {
        Avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        },
    });

    res.status(200).json({
        success: true,
        message: "Profile Picture is updated",
    });
}
);




// ==================================== END ====================================

