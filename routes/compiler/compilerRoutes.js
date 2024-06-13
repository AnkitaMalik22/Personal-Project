const router = require("express").Router();
const {
  compileCode,
  fetchCompilerTestCases,
} = require("../../controllers/compiler/compilerController");

router.route("/compile").post(compileCode);
router.route("/testcases").get(fetchCompilerTestCases);

module.exports = router;
