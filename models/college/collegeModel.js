const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const collegeSchema = new mongoose.Schema({
  role: {
    type: String,
    default: 'college',
  },
  avatar: {
    public_id:{
    type:String,
    required:true
},
url:{
    type:String,
    required:true
}     },
  CollegeName : {
    type: String,
    required: [true, 'Please Enter Your College Name'],
    unique: true,
  },
  Email: {
    type: String,
    required: [true, 'Please Enter Your Email'],
    unique: true,
  },
  FirstName: {
    type: String,
    required: [true, 'Please Enter Your First Name'],
    maxLength: [30, 'Name cannot exceed 30 characters'],
    minLength: [2, 'Name should have more than 2 characters'],
  },
  LastName: {
    type: String,
    required: [true, 'Please Enter Your Last Name'],
    maxLength: [30, 'Name cannot exceed 30 characters'],
    minLength: [2, 'Name should have more than 2 characters'],
  },
  Password: {
    type: String,
    required: [true, 'Please Enter Your Password'],
    minLength: [8, 'Password should be greater than 8 characters'],
    select: false,
  },
  AvgPackage: {
    type: Number,
    default: 0,
  },
  Achievement: {
    type: String,
    enum: ['Statistics', 'Percentage', 'DataName'],
  },
  Phone : Number,
  Overview :String,
  Website : String,
  Performance: String,
  Link: String,
  Inbox: String,
  Teams: String,
  Accounting: String,
  TotalStudents: {
    type: Number,
    default: 0,
  },
  TotalCompanies: {
    type: Number,
    default: 0,
  },
  TotalJobs: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  }],
  assessments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessments',
  }],
});

collegeSchema.pre('save', async function (next) {
  if (!this.isModified('Password')) {
    next();
  }

  this.Password = await bcrypt.hash(this.Password, 10);
});

// JWT TOKEN
collegeSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Compare Password

collegeSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.Password);
};

// Generating Password Reset Token
collegeSchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hashing and adding resetPasswordToken to collegeSchema
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

const College = mongoose.model('College', collegeSchema);
module.exports = College;
