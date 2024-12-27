const Category = require('../../models/college/assessment/Category');
const Assessment = require('../../models/college/assessment/assessments');
const Section = require('../../models/college/assessment/sections');
const Department = require('../../models/college/assessment/Department');
const Branch = require('../../models/college/assessment/Branch');

exports.createCategory = async (req, res) => {
  try {
    // const { name, assessments, sections, branch, hasAllDeptAccess,hasAllBranchAccess, accessibleBranches, accessibleDepartments } = req.body;

    const category = new Category(req.body);

    // example json
    // {
    //   "name": "Category 1",
    //   "assessments": ["60b4b6d4b4e9d1a0c8d4f5a0"],
    //   "sections": ["60b4b6d4b4e9d1a0c8d4f5a0"],
    //   "branch": "Engineering",
    //   "department": "CSE",
    //   "scope": "Global",

    //   "accessibleBranches": ["60b4b6d4b4e9d1a0c8d4f5a0"],
    //   "accessibleDepartments": ["CSE"]
    // }

    await category.save();

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const query = req.query;
    const categories = await Category.find().populate({
      path : 'sections',
      strictPopulate: false,
      
    });
    const branches = await Branch.find({
      categoryId  : query.categoryId
    });
    const departments = await Department.find({
      categoryId  : query.categoryId
    });

    res.status(200).json({ success: true, data: categories , branches, departments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


exports.addAssessmentToCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const assessment = await Assessment.findById(req.body.assessment);

    if (!assessment) {
      return res.status(404).json({ success : false, message: 'Assessment not found' });
    }
    category.assessments.push(assessment);
    await category.save();

    res.status(200).json({ success: true, data: category });
  
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }};


exports.addSectionToCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const section = await Section.findById(req.body.section);

    if (!section) {
      return res.status(404).json({ success : false, message: 'Section not found' });
    }
    category.sections.push(section);
    await category.save();

    res.status(200).json({ success: true, data: category });
  
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }};

exports.updateCategory = async (req, res) => {
  try {
    const { name, assessments, sections, branch, department, scope, accessibleBranches, accessibleDepartments } = req.body;

    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await category.remove();

    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description, branch } = req.body;

    const department = new Department({
      name,
      code,
      description,
      branch
    });

    await department.save();

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();

    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


exports.createBranch = async (req, res) => {
  try {
    const { name, code, departments, description } = req.body;

    const branch = new Branch({
      name,
      code,
      departments,
      description
    });

    await branch.save();

    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
}


exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find();

    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });

  }}
