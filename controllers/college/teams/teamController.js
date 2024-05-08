const Teams = require("../../../models/college/teams/team");
const ErrorHandler = require("../../../utils/errorhandler");
const catchAsyncErrors = require("../../../middlewares/catchAsyncErrors");
const College = require("../../../models/college/collegeModel");
const addedTeams = require("../../../models/college/teams/addedTeams");
const Invitation = require("../../../models/college/teams/inviteModel");
const sendEmail = require("../../../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");
const bcrypt = require("bcryptjs");
const sendToken = require("../../../utils/jwtToken");

// Notes - 
// Invite a team member to join the college - save invitedTeams model
//
// memeber registration -- save Teams model
// show 


// ==================================== INVITE MEMBER ====================================

exports.inviteMember = catchAsyncErrors(async (req, res, next) => {
    const { Name, Role, Email, Phone } = req.body;

    console.log("invite called")

    const college = await College.findById(req.user.id);

    if (!college) {
        return next(new ErrorHandler("College not found", 404));
    }
    const CollegeId = req.user.id;

    if (!Name || !Role || !Email || !Phone) {
        return next(new ErrorHandler("Please Enter All Fields", 400));
    }

    const isTeam = await addedTeams.findOne
        ({ Email, college_id: req.user.id });

    if (isTeam) {
        return next(new ErrorHandler("This member is already added", 400));
    }

    const isInvite = await Invitation.findOne
        ({ recipientEmail: Email, college_id: req.user.id });

    if (isInvite) {
        return next(new ErrorHandler("This member is already invited", 400));
    }

  
    const team = await addedTeams.create({
        Name,
        Role,
        Email,
        Phone,
        college_id: req.user.id,
  
    });

    const invite = await Invitation.create({
        sender: CollegeId,
        recipientEmail:Email,
        invitationLink: crypto.randomBytes(20).toString("hex"),
    });


    sendEmail({
        email: team.Email,
        subject: "Invitation to join College",
        message: `Hello ${Name}!,You have been invited to join ${college.CollegeName} college. Please click on the link to register: http://localhost:4000/api/teams/register?CollegeId=${CollegeId}&inviteLink=${invite.invitationLink}`,
        // message: `Hello ${student.FirstName}!,You have been invited to join ${college.FirstName} ${college.LastName} college. Please click on the link to register: ${process.env.FRONTEND_URL}/student/register/${invite.invitationLink}`,
    });

   

    team.invited = true;
    team.invitationLink = invite.invitationLink;
    await team.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: "Member is invited",
        team,
    });

});


// ====================================  REGISTER MEMBER ====================================

exports.registerMember = catchAsyncErrors(async (req, res, next) => {
    const { Name, Role, Email, Phone, Password } = req.body;

    const { CollegeId, inviteLink } = req.query;

    // console.log(CollegeId, inviteLink);

    const college = await College.findById(CollegeId);

    if (!college) {
        return next(new ErrorHandler("College not found", 404));
    }

    if (!inviteLink || !Email || !Password || !Name || !Role) {
        return next(new ErrorHandler('Please Enter All Fields', 400));
    }

    const invite = await Invitation.findOne({ invitationLink: inviteLink });

    if (!invite) {
        return next(new ErrorHandler('Invalid invitation link', 400));
    }
    if (invite.recipientEmail !== Email) {
        return next(new ErrorHandler('Invalid email', 400));
    }
    if (invite.status === 'accepted') {
        return next(new ErrorHandler('You have already registered', 400));
    }


    invite.status = 'accepted';

    await invite.save();

    // already approved if registered 

    const password = await bcrypt.hash(Password, 10);


    const team = await Teams.create({
        Name,
        Role,
        Email,
        Phone,
        Password : password,
        College: CollegeId,
    });
    // sendToken(team, 200, res);

    res.status(201).json({
        success: true,
        message: "Member is registered",
        team,
    });


});










// ==================================== ADD MEMBER ====================================

exports.addMember = catchAsyncErrors(async (req, res, next) => {
    const { Name, Role, Email, Phone } = req.body;
    console.log("add member called")

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

    // registererd members
    const team = await Teams.find({
        College: req.user.id,
    });

    res.status(200).json({
        success: true,
        team,
    });
});

exports.getAllInvitedMembers = catchAsyncErrors(async (req, res, next) => {
    
        // invited members
        const team = await addedTeams.find({
            college_id: req.user.id,
        });
    
        res.status(200).json({
            success: true,
            team,
        });
    }
    );


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

