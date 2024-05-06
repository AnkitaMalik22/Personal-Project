const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// ============================ Schema START ============================

//----------------------------------- Define Skills Schema -----------------------------------
const skillsSchema = new mongoose.Schema({
  student_id: {
    type: String,
    ref: "Students",
  },
  SoftwareKnowledge: {
    type: String,
    // enum: ["java", "python", "csharp", "javascript"],
  },
  Achievements: {
    type: String,
    // enum: ["java", "python", "csharp", "javascript"],
  },
  CodingKnowledge: {
    type: String,
    // enum: ["java", "python", "csharp", "javascript"],
  },
  Languages: {
    type: String,
    // enum: ["english", "hindi", "gujarati", "bengali"],
  },
});

//-------------------------------- Define Portfolio Schema -----------------------------------------

const portfolioSchema = new mongoose.Schema({
  student_id: {
    type: String,
    ref: "Students",
  },
  Website: String,
  LinkedIn: String,
  Twitter: String,
});

// --------------------------- Education Schema ------------------------------
const educationSchema = new mongoose.Schema({
  student_id: {
    type: String,
    ref: "Students",
  },
  School: String,
  Description: String,
  Degree: String,
  StartDate: Date,
  EndDate: Date,
  Media: Buffer,
});
// --------------------------- Score Schema ------------------------------

const ScoreSchema = new mongoose.Schema({
  student_id: {
    type: String,
    ref: "Students",
  },
  AssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessments",
  },
  Score: Number,
  Performance: String,
  Date: Date,
  Time: Number,
  Status: {
    type: String,
    enum: ["pending", "rejected", "shortlisted"],
  },
});

//-------------------------------- Define Students Schema --------------------------------------------
const studentSchema = new mongoose.Schema({
  avatar: {
    public_id: {
      type: String,
      // required:true
    },
    url: {
      type: String,
      // required:true
    },
  },
  Email: {
    type: String,
    required: [true, "Please Enter Your Email"],
    unique: true,
  },
  role: {
    type: String,
    default: "student",
  },
  FirstName: {
    type: String,
    // required: [true, "Please Enter Your First Name"],
    maxLength: [30, "Name cannot exceed 30 characters"],
    minLength: [2, "Name should have more than 2 characters"],
  },
  LastName: {
    type: String,
    // required: [true, "Please Enter Your Last Name"],
    maxLength: [30, "Name cannot exceed 30 characters"],
    minLength: [2, "Name should have more than 2 characters"],
  },
  Password: {
    type: String,
    // required: [true, "Please Enter Your Password"],
    minLength: [8, "Password should be greater than 8 characters"],
    select: false,
  },

// ------ for dummy -------------
// the tests student has taken
studentTests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessments",
    },

  ],
  // the responses student has given
studentResponses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentResponse",
    },
  ],

studentMarks : [ {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentMarks",
  },
],


// -----------------------------


  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  CollegeName: {
    type: String,
    // required: [true, "Please Enter Your College Name"],
  },
  Major: {
    type: String,
    // required: [true, "Please Enter Your Major"],
  },
  From: Date,
  To: Date,
  CollegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
  },
// ----
// registrationLink: { type: String, unique: true, default: "" },
registrationLink: { type: String, default: ""},
registeredAt: { type: Date },
confirmationToken: { type: String },
emailConfirmed: { type: Boolean, default: false },

lastLogin: { type: Date },
loginAttempts: { type: Number, default: 0 },
loggedOut: { type: Boolean, default: false },
// ----
  Assessments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessments",
    },
  ],
  OnGoingAssessment: 
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessments",
    },
  PhoneNumber: String,
  Address: String,
  Website: String,
  // Education: educationSchema,
  Education: [
    {
      School: String,
      Description: String,
      Degree: String,
      StartDate: Date,
      EndDate: Date,
      Place : String,
      Media:[
        {
          public_id: {
            type: String,
          },
          url: {
            type: String,
          },
          file_name : {
            type: String,
          },
        }
      ]
    },
  ],
  // Skills: skillsSchema,
  Skills: {
    SoftwareKnowledge: [{
      type: String,
    }],
    Achievements: [
      {
        type: String,
      },
    ],
    CodingKnowledge: [{type: String}],
    Languages: [{type: String}],
  },
  Links: [{
    type: String,
  
  }],
  // Portfolio: portfolioSchema,
  Portfolio: [
    {
      type: String,
    
    }
  ],
  Cv: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
    file_name : {
      type: String,
    },
    

  },
  Certificates: [
    {
      type: {
        type: String,
      },
      date: Date,
      issuer: String,
    },
  ],
  Score: ScoreSchema,
  Placed: {
    type: Boolean,
    default: false,
  },
  CompanyPlaced: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  JobPlaced: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Jobs",
  },
  recommendedAssessments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessments",
    },
  ],
  recommendedJobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Jobs",
    },
  ],
// ---------------------
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
});

// ============================== Schema END =============================

// ============================ Methods START ============================

// Hash the password before saving
studentSchema.pre("save", async function (next) {
  if (!this.isModified("Password")) {
    next();
  }

  this.Password = await bcrypt.hash(this.Password, 10);
});

// JWT TOKEN
studentSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Compare Password
studentSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.Password);
};

// Generating Password Reset Token
studentSchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hashing and adding resetPasswordToken to studentSchema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};
//  ============================ Methods END ============================

// Create models
const Skills = mongoose.model("Skills", skillsSchema);
const Portfolio = mongoose.model("Portfolio", portfolioSchema);
const Education = mongoose.model("Education", educationSchema);
const Student = mongoose.model("Students", studentSchema);

module.exports = { Skills, Portfolio, Student, Education };
