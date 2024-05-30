const router = require("express").Router();
const { compileCode } = require("../../controllers/compiler/compilerController");


router.route("/compile").post(compileCode);



module.exports = router;