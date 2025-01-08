const express = require('express');
const router = express.Router();
const { 
    createCampusDrive,
    getAllCampusDrives,
    getCampusDrive,
    updateCampusDrive,
    deleteCampusDrive,
    addCollegesToCampusDrive,
    removeCollegesFromCampusDrive,
    addStudentsToCampusDrive,
    removeStudentsFromCampusDrive
} = require('../../controllers/company/campusDriveController');
const { isAuthenticatedCompany } = require('../../middleware/auth');
const { authenticateMultiDatabase } = require('../../middlewares/authMultiUser');

// Campus Drive CRUD Routes
router.post('/create', isAuthenticatedCompany, createCampusDrive);
router.get('/', authenticateMultiDatabase, getAllCampusDrives);
router.get('/:id', isAuthenticatedCompany, getCampusDrive);
router.put('/:id', isAuthenticatedCompany, updateCampusDrive);
router.delete('/:id', isAuthenticatedCompany, deleteCampusDrive);

// College Management Routes
router.post('/:id/colleges', isAuthenticatedCompany, addCollegesToCampusDrive);
router.delete('/:id/colleges', isAuthenticatedCompany, removeCollegesFromCampusDrive);

// Student Management Routes
router.post('/:id/students', isAuthenticatedCompany, addStudentsToCampusDrive);
router.delete('/:id/students', isAuthenticatedCompany, removeStudentsFromCampusDrive);

module.exports = router;