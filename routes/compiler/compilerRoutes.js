const router = require("express").Router();
const {
  compileCode,
  fetchCompilerTestCases,
} = require("../../controllers/compiler/compilerController");
const {
  findLogCompiler,
  addLog,
} = require("../../controllers/student/compiler");
const { isAuthenticatedStudent } = require("../../middlewares/studentAuth");

router.route("/compile").post(compileCode);
router
  .route("/log/:testId")
  .get(isAuthenticatedStudent, findLogCompiler)
  .post(isAuthenticatedStudent, addLog);
module.exports = router;
