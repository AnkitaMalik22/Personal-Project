const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');


const leaderSchema = new mongoose.Schema({
  name: String,
  title: String,
  country: String,
  isGlobalLeader: Boolean,
});

const locationSchema = new mongoose.Schema({
  locName: String,
  address: String,
  town: String,
  state: String,
  country: String,
  postalCode: String,
});

const awardsSchema = new mongoose.Schema({
  name: String,
  description: String,
  dateOfIssue: Date,
  media: [String],
});

const dashboardSchema = new mongoose.Schema({
  totalJobs: Number,
  studentsHired: Number,
  approved: Number,
  institutes: Number,
  assessments: Number,
  newJobs: Number,
  newHiredEmps: Number,
});

const companySchema = new mongoose.Schema({
  Email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
  },
  role: {
    type: String,
    default: 'company',
  },
  FirstName: {
    type: String,
    required: [true, 'Please provide your first name'],
  },
  LastName: {
    type: String,
    required: [true, 'Please provide your last name'],
  },
  Password: {
    type: String,
    required: [true, 'Please provide your password'],
    minlength: 8,
    select: false,
  },
  basic: {
    coverPhoto: String,
    logo: String,
    companyName: String,
    website: String,
    totalEmployees: Number,
    yearFounded: Number,
    hqCity: String,
    annualRevenue: Number,
    sector: String,
    industry: String,
    companyType: String,
    status: String,
  },
  location: locationSchema,
  leader: leaderSchema,
  about: {
    description: String,
    missions: String,
    programs: String,
  },
  awards: [awardsSchema],
  dashboard: dashboardSchema,
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  }],
  jobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  }],
  assessments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
  }],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  loginActivity: [
    {
      ip: String,
      logged_in_at: Date,
      logged_out_at: Date,
      device: String,
      token_id: String,
      token_secret: String,
      token_deleted: Boolean,
    },
  ],

  otp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
  otpVerified: {
    type: Boolean,
    default: false,
  },
  authType: {
    type: String,
    enum: ["otp", "qr", "none"],
    default: "none",
  },
  emails: [
    {
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "College",
        // validate: [validateRef, "Invalid reference collection."],
      },
      message: String,
      subject: String,
    },
  ],
  emailsSent: [
    {
      to: String,
      message: String,
      subject: String,
    },
  ],

  
});


companySchema.pre('save', async function (next) {
  if (!this.isModified('Password')) {
    next();
  }

  this.Password = await bcrypt.hash(this.Password, 10);
});

// JWT TOKEN
companySchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Compare Password

companySchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.Password);
};

// Generating Password Reset Token
companySchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hashing and adding resetPasswordToken to companySchema
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};


const Company = mongoose.model('Company', companySchema);

module.exports = Company;
