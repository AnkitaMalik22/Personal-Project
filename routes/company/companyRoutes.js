const router = require('express').Router();
const {isAuthenticatedUser} = require('../../middlewares/auth');

const {getJob, createJob, updateJob, getAllJobsCompany, getAllJobsCollege, getAllJobsStudent, createAssessmentForJob, getAllAssessmentsCompany, getAllAssessmentsStudent, deleteJob,addStudentToJob, applyJob,  getFilteredJobs, searchJobs} = require('../../controllers/company/jobController');
const { updateCoverPictureCompany, updateLogoCompany, getCompanyDetails, updateProfile, deleteCompany, registerCompany, loginCompany, forgotPassword, resetPassword, updatePassword} = require('../../controllers/company/companyController');
;


// ============================================= Comapny ROUTES ====================================================

router.route("/register").post(registerCompany);
router.route("/login").post(loginCompany);
router.route("/me").get(isAuthenticatedUser, getCompanyDetails);
router.route("/password/reset/:token").put(resetPassword);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/update/:companyId").put(isAuthenticatedUser, updatePassword);

router.get('/:companyId', isAuthenticatedUser, getCompanyDetails);
router.put('/:companyId', isAuthenticatedUser,updateProfile);
router.delete('/:companyId', isAuthenticatedUser, deleteCompany);
router.put('/update/logo/:companyId', isAuthenticatedUser, updateLogoCompany);
router.put('/update/cover/:companyId', isAuthenticatedUser, updateCoverPictureCompany);

// ============================================= JOB ROUTES ====================================================

// --------------Filter Jobs----------------------------------
    router.get('/jobs/filter', getFilteredJobs);
    // search
    router.get('/jobs/search', searchJobs);
// -----------------------------------------------------------

router.get('/jobs/:jobId', isAuthenticatedUser, getJob);
router.put('/jobs/:jobId', isAuthenticatedUser, updateJob);
router.delete('/jobs/:jobId', isAuthenticatedUser,deleteJob);


router.post('/jobs/:companyId', isAuthenticatedUser, createJob);
router.post('/jobs/assessment/:jobId', isAuthenticatedUser, createAssessmentForJob);
router.get('/jobs/assessments/:comapnyId', isAuthenticatedUser, getAllAssessmentsCompany);
router.get('/jobs/assessments/student/:studentId', isAuthenticatedUser, getAllAssessmentsStudent);

// Invite Student to Job
router.post('/jobs/assessments/apply/:jobId', isAuthenticatedUser, addStudentToJob);
router.post('/jobs/assessments/apply/:jobId/:studentId', isAuthenticatedUser, applyJob);


router.get('/jobs/:companyId', isAuthenticatedUser, getAllJobsCompany);
router.get('/jobs/:collegeId', isAuthenticatedUser,getAllJobsCollege);
router.get('/jobs/:studentId', isAuthenticatedUser, getAllJobsStudent);



module.exports = router;




