// Admin Approval for registered companies
// Admin Approval + Tier assign for registered colleges
// create one controller use type to differentiate between company and college


const Company = require('../../models/company/companyModel');
const College = require('../../models/college/collegeModel');

const ErrorHandler= require('../../utils/errorhandler');
const catchAsyncErrors = require('../../middlewares/catchAsyncErrors');
const sendEmail = require('../../utils/sendEmail');
const crypto = require('crypto');


// Approve Company or College


exports.approveUser = catchAsyncErrors(async (req, res, next) => {
    try {
        const { type, id } = req.params;

        const { tier, status } = req.body;
        if (!status) {
            return next(new ErrorHandler('Please provide status', 400));
        }
        if (status !== 'approved' && status !== 'rejected') {
            return next(new ErrorHandler('Invalid status', 400));
        }
        if(type !== 'company' && type !== 'college') {
            return next(new ErrorHandler('Invalid type', 400));
        }
        if (type === 'college' && status === 'approved' && !tier) {
            return next(new ErrorHandler('Please provide tier', 400));
        }
        if (type === 'college' && status === 'approved' && tier !== 'tier1' && tier !== 'tier2' && tier !== 'tier3') {
            return next(new ErrorHandler('Invalid tier', 400));
        }
       
        let user;
        if (type === 'company') {
           
            user = await Company.findById(id);
            if (!user) {
                return next(new ErrorHandler('User not found', 404));
            }
    
            user.status = status;
            user.statusChangedAt = Date.now();
          
            if(status === 'rejected') {
                if (!req.body.comment) {
                    return next(new ErrorHandler('Please provide a reason for rejection', 400));
                }
                user.commentsByAdmin.push({
                    comment: req.body.comment,
                    commentedBy: req.user.id,
                    commentedAt: Date.now()
                })
            }
            await user.save();
            sendEmail({
                email: user.Email,
                subject: 'Company Approval',
                message: `Your Company has been approved by skillaccess`
            })
    
    
        } else if (type === 'college') {
            user = await College.findById(id);

            if (!user) {
                return next(new ErrorHandler('User not found', 404));
            }
            user.status = status;
            user.statusChangedAt = Date.now();
            user.tier = tier;
            if(status === 'rejected') {
                if (!req.body.comment) {
                    return next(new ErrorHandler('Please provide a reason for rejection', 400));
                }
                user.commentsByAdmin.push({
                    comment: req.body.comment,
                    commentedBy: req.user.id,
                    commentedAt: Date.now()
                })
            }
            await user.save();

            sendEmail({
                email: user.Email,
                subject: 'College Approval',
                message: `Your College has been approved by skillaccess and assigned to ${tier} `
            })
    
        }
    
        res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }
}
);

// get college tier wise

exports.getColleges = catchAsyncErrors(async (req, res, next) => {
    try {
        const { tier } = req.params;
        if (!tier) {
            return next(new ErrorHandler('Please provide tier', 400));
        }
        if (tier !== 'tier1' && tier !== 'tier2' && tier !== 'tier3') {
            return next(new ErrorHandler('Invalid tier', 400));
        }
        const colleges = await College.find({ tier });
        res.status(200).json({
            success: true,
            colleges
        })
    } catch (error) {
        next(new ErrorHandler(error.message, 500));
    }
}

);



