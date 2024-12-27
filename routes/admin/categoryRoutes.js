const express = require('express');
const router = express.Router();
const { createCategory ,createDepartment,createBranch, getCategories, addSectionToCategory} = require('../../controllers/admin/categoryController');

// Route to create a new category
router.post('/create', createCategory);
router.post('/dept-create', createDepartment);
router.post('/branch-create', createBranch);
router.get('/get',getCategories);

// add topic to category
router.put('/add-topic', addSectionToCategory);



module.exports = router;