const router = require('express').Router();
const {isAuthenticatedCompany, isAuthenticatedStudent, isAuthenticatedCollege} = require('../../middlewares/auth');

const {getJob, createJob, updateJob, getAllJobsCompany, getAllJobsCollege, getAllJobsStudent, createAssessmentForJob, getAllAssessmentsCompany, getAllAssessmentsStudent, deleteJob,addStudentToJob, applyJob,getFilteredJobs,searchJobs} = require('../../controllers/company/jobController');
const { updateCoverPictureCompany, updateLogoCompany, getCompanyDetails, updateProfile, deleteCompany, registerCompany, loginCompany, forgotPassword, resetPassword, updatePassword,logout} = require('../../controllers/company/companyController');
;


// ============================================= Comapny ROUTES ====================================================

router.route("/register").post(registerCompany);
router.route("/login").post(loginCompany);
router.route("/me").get(isAuthenticatedCompany, getCompanyDetails);
router.route("/password/reset/:token").put(resetPassword);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/update/:companyId").put(isAuthenticatedCompany, updatePassword);
router.route("/logout").post(isAuthenticatedCompany, logout);

router.get('/me', isAuthenticatedCompany, getCompanyDetails);
router.put('/update', isAuthenticatedCompany,updateProfile);
router.delete('/delete', isAuthenticatedCompany, deleteCompany);
router.put('/update/logo', isAuthenticatedCompany, updateLogoCompany);
router.put('/update/cover', isAuthenticatedCompany, updateCoverPictureCompany);

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


// Apply for Job --Student
router.post('/jobs/assessments/apply/:jobId', isAuthenticatedStudent, applyJob);
// Invite Student to Job
router.post('/jobs/assessments/apply/college/:jobId', isAuthenticatedCollege, addStudentToJob);



router.get('/jobs/:companyId', getAllJobsCompany);
router.get('/jobs/:collegeId', getAllJobsCollege);
router.get('/jobs/:studentId', isAuthenticatedStudent, getAllJobsStudent);


module.exports = router;




