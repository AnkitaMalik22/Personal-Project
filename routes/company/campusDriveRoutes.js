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
    removeStudentsFromCampusDrive
} = require('../../controllers/company/campusDriveController');
const { isAuthenticatedCompany } = require('../../middlewares/companyAuth');
const { authenticateMultiDatabase } = require('../../middlewares/authMultiUser');

// Campus Drive CRUD Routes
router.post('/create', isAuthenticatedCompany, newCampusDrive);
router.get('/get', isAuthenticatedCompany, getCampusDrives);
router.get('/:id', isAuthenticatedCompany, getCampusDrive);
router.put('/:id', isAuthenticatedCompany, updateCampusDrive);
router.delete('/:id', isAuthenticatedCompany, deleteCampusDrive);

// College Management Routes
router.get('/:id/colleges', isAuthenticatedCompany, getCollegesForCampusDrive);
router.post('/:id/colleges', isAuthenticatedCompany, addCollegesToCampusDrive);
// router.delete('/:id/colleges', isAuthenticatedCompany, removeCollegesFromCampusDrive);

// Student Management Routes
// router.post('/:id/students', isAuthenticatedCompany, addStudentsToCampusDrive);
// router.delete('/:id/students', isAuthenticatedCompany, removeStudentsFromCampusDrive);

module.exports = router;