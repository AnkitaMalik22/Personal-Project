const express = require('express');
const router = express.Router();
const { 
   newCampusDrive,
    getCampusDrives,
    getCampusDrive,
    updateCampusDrive,
    deleteCampusDrive,
    getCollegesForCampusDrive,
    addCollegesToCampusDrive,
    removeCollegesFromCampusDrive,
    addStudentsToCampusDrive,
    removeStudentsFromCampusDrive,
    assignTestToCampusDrive,
    getCompaniesForCampusDrive,
    addCompaniesToCampusDrive,
    selectStudentByCompany,
    getStudentsResult
    
 
} = require('../../controllers/company/campusDriveController');
const { isAuthenticatedCompany } = require('../../middlewares/companyAuth');
const { authenticateMultiDatabase } = require('../../middlewares/authMultiUser');
const {isAuthenticatedCollege, authorizeRoles} = require('../../middlewares/auth');
const { getCollegeCampusDrives } = require('../../controllers/college/campusDriveController');

// Campus Drive CRUD Routes
router.post('/create', isAuthenticatedCompany, newCampusDrive);
router.get('/get', isAuthenticatedCompany, getCampusDrives);
router.get('/:id', authenticateMultiDatabase, getCampusDrive);
router.put('/:id', isAuthenticatedCompany, updateCampusDrive);
router.delete('/:id', isAuthenticatedCompany, deleteCampusDrive);

// College Management Routes
router.get('/:id/colleges', isAuthenticatedCompany, getCollegesForCampusDrive);
router.post('/v1/colleges/add/:id', isAuthenticatedCompany, addCollegesToCampusDrive);
router.post('/v1/companies/add/:id', isAuthenticatedCompany, addCompaniesToCampusDrive);


// Company Management Routes
router.get('/:id/companies', isAuthenticatedCompany, getCompaniesForCampusDrive);

// student Management Routes
router.post('/:id/shortlist',isAuthenticatedCompany, selectStudentByCompany);
router.get('/:id/results',isAuthenticatedCompany, getStudentsResult);


// Test Management Routes
router.post('/v1/assignTest/:id', isAuthenticatedCompany, assignTestToCampusDrive);


router.get('/get/college',isAuthenticatedCollege,getCollegeCampusDrives);

// router.delete('/:id/colleges', isAuthenticatedCompany, removeCollegesFromCampusDrive);

// Student Management Routes
// router.post('/:id/students', isAuthenticatedCompany, addStudentsToCampusDrive);
// router.delete('/:id/students', isAuthenticatedCompany, removeStudentsFromCampusDrive);

module.exports = router;