const router = require('express').Router();
const {isAuthenticatedCompany, isAuthenticatedStudent, isAuthenticatedCollege} = require('../../middlewares/auth');

const {getJob, createJob, updateJob, getAllJobsCompany, getAllJobsCollege, getAllJobsStudent, createAssessmentForJob, getAllAssessmentsCompany, getAllAssessmentsStudent, deleteJob,addStudentToJob, applyJob,getFilteredJobs,searchJobs} = require('../../controllers/company/jobController');
const { updateCoverPictureCompany, updateLogoCompany, getCompanyDetails, updateProfile, deleteCompany, registerCompany, loginCompany, forgotPassword, resetPassword, updatePassword} = require('../../controllers/company/companyController');
;


// ============================================= Comapny ROUTES ====================================================

router.route("/register").post(registerCompany);
router.route("/login").post(loginCompany);
router.route("/me").get(isAuthenticatedCompany, getCompanyDetails);
router.route("/password/reset/:token").put(resetPassword);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/update/:companyId").put(isAuthenticatedCompany, updatePassword);

router.get('/:companyId', isAuthenticatedCompany, getCompanyDetails);
router.put('/:companyId', isAuthenticatedCompany,updateProfile);
router.delete('/:companyId', isAuthenticatedCompany, deleteCompany);
router.put('/update/logo/:companyId', isAuthenticatedCompany, updateLogoCompany);
router.put('/update/cover/:companyId', isAuthenticatedCompany, updateCoverPictureCompany);

// ============================================= JOB ROUTES ====================================================

// --------------Filter Jobs----------------------------------
router.get('/jobs/filter', getFilteredJobs);
// search Jobs
router.get('/jobs/search', searchJobs);
// -----------------------------------------------------------

router.get('/jobs/:jobId', getJob);
router.put('/jobs/:jobId', isAuthenticatedCompany, updateJob);
router.delete('/jobs/:jobId', isAuthenticatedCompany,deleteJob);



router.post('/jobs/:companyId', isAuthenticatedCompany, createJob);
router.post('/jobs/assessment/:jobId', isAuthenticatedCompany, createAssessmentForJob);
router.get('/jobs/assessments/:comapnyId', isAuthenticatedCompany, getAllAssessmentsCompany);
router.get('/jobs/assessments/student/:studentId', isAuthenticatedCompany, getAllAssessmentsStudent);

// Invite Student to Job
router.post('/jobs/assessments/apply/:jobId', isAuthenticatedCollege, addStudentToJob);
router.post('/jobs/assessments/apply/:jobId/:studentId', isAuthenticatedStudent, applyJob);


router.get('/jobs/:companyId', getAllJobsCompany);
router.get('/jobs/:collegeId', getAllJobsCollege);
router.get('/jobs/:studentId', isAuthenticatedStudent, getAllJobsStudent);


module.exports = router;




