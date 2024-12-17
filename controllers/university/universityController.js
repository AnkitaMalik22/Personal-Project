// controllers/universityController.js

const University = require('../../models/university/universityModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const sendToken = require('../utils/jwtTokenCompany');

// Register Controller
exports.registerUniversity = async (req, res) => {
  try {
    const { name, email, password,phone, address,website} = req.body;

    // Check if university already exists
    let university = await University.findOne({ email });
    if (university) {
      return res.status(400).json({ success: false, message: 'University already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new university
    university = new University({
      name,
      email,
      password: hashedPassword,
        phone,
        address,
        website
    });

    await university.save();
    const payload = { id: university._id, role: 'university' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });


    res.status(201).json({ success: true,token , status: 'pending', message: 'University created successfully' ,user:university});
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Login Controller
exports.loginUniversity = async (req, res) => {
  try {
    const { Email:email, Password:password } = req.body;

    // Check if university exists
    const university = await University.findOne({ email });

    // console.log(university,email,password);
    if (!university) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, university.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = { id: university._id, role: 'university' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ success: true, token , status: university.verificationStatus, message: 'University logged in successfully' ,user:university});
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// add college to university

exports.addCollege = async (req, res) => {
    try {
        const { collegeId } = req.body;
        const university = await University.findById(req.user._id);
        university.colleges.push(collegeId);
        await university.save();
        res.status(200).json({ success: true, message: 'College added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
    };


