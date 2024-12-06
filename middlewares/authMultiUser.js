const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Company = require("../models/company/companyModel");
const College = require("../models/college/collegeModel");

exports.authenticateMultiDatabase = catchAsyncErrors(async (req, res, next) => {
    const token = req.header("auth-token");
    const companyToken = req.header("company-token");
  
    // if (!token|| !companyToken) {
    //     return next(new ErrorHander("Please Login to access this resource", 401));
    // }
    // console.log(token, companyToken)

    try {
       if(token){
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        
        // First, try to find in College database
        const collegeUser = await College.findById(decodedData.id);
        if (collegeUser) {
            req.user = collegeUser;
            req.userType = 'college';
            return next();
        }
       
       }
       else if(companyToken){
        const decodedDataCompany = jwt.verify(companyToken, process.env.JWT_SECRET);
        // If not found in College, try Company database
        const companyUser = await Company.findById(decodedDataCompany.id);
        console.log("user found--fghnjm")
        if (companyUser) {
            req.user = companyUser;
            req.userType = 'company';
            return next();
        }
       }else{
        return next(new ErrorHander("User not found. Please login again", 401));

       }
       

      

        // If no user found in either database

    } catch (error) {
        console.log(error)
        // Handle token expiration or invalid token
        if (error.name === "TokenExpiredError") {
            return next(new ErrorHander("Token has expired. Please login again", 401));
        }
        return next(new ErrorHander("Invalid token. Please login again", 401));
    }
});