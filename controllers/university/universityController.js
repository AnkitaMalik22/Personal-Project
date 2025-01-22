// controllers/universityController.js

const University = require("../../models/university/universityModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../../utils/errorhandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
// const sendToken = require('../utils/jwtTokenCompany');

// Register Controller
exports.registerUniversity = async (req, res) => {
  try {
    const { name, email, password, phone, address, website } = req.body;

    // Check if university already exists
    let university = await University.findOne({ email });
    if (university) {
      return res
        .status(400)
        .json({ success: false, message: "University already exists" });
    }

    // Create new university
    university = new University({
      name,
      email,
      password,
      phone,
      address,
      website,
    });

    await university.save();
    const payload = { id: university._id, role: "university" };
    // const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    const token = university.getJWTToken();

    res.status(201).json({
      success: true,
      token,
      status: "pending",
      message: "University created successfully",
      user: university,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Login Controller
exports.loginUniversity = async (req, res, next) => {
  try {
    const { Email: email, Password: password } = req.body;

    // Check if university exists
    const university = await University.findOne({ email }).select("+password");

    // console.log(university,email,password);
    if (!university) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await university.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }
    // Generate JWT
    const payload = { id: university._id, role: "university" };
    // const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    const token = university.getJWTToken();
    // hide password
    university.password = undefined;

    res.status(200).json({
      success: true,
      token,
      status: university.verificationStatus,
      message: "University logged in successfully",
      user: university,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Logout Company
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// add college to university

exports.addCollege = async (req, res) => {
  try {
    const { collegeId } = req.body;
    const university = await University.findById(req.user._id);
    university.colleges.push(collegeId);
    await university.save();
    res
      .status(200)
      .json({ success: true, message: "College added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
