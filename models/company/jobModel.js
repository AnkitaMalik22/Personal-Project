const mongoose = require('mongoose');
const Student = require('../student/studentModel');
const Company = require('./companyModel');

const jobSchema = new mongoose.Schema({
 company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
    coverPhoto: String,
    logo: String,
  // Enrolled Students
  Student: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  }],
  // Enrolled Colleges
  College: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
  }],
  AssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
  },
  JobTitle: {
    type: String,
    required: true,
  },
  CompanyName: {
    type: String,
    required: true,
  },
  JobLocation: {
    type: String,
    required: true,
  },
  WorkplaceType: {
    type: String,
    required: true,
  },
  CloseByDate: {
    type: Date,
    required: true,
  },
  EmploymentType: {
    type: String,
    required: true,
  },
  SeniorityLevel: {
    type: String,
    required: true,
  },
  ExperienceFrom: {
    type: Number,
  },
  ExperienceTo: {
    type: Number,
  },
  SalaryFrom: {
    type: Number,
  },
  SalaryTo: {
    type: Number,
  },
  RoleOverview: {
    type: String,
  },
  DutiesResponsibility: {
    type: String,
  },
  createdAt : {
    type: Date,
    default: Date.now
  },

  PlacedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  }],
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
