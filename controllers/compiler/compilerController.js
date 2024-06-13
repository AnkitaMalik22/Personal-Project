const axios = require("axios");
const Compiler = require("../../models/college/assessment/Compiler");

const compileCode = async (req, res) => {
  const code = req.body.code;
  let language = req.body.language;
  const input = req.body.input;

  // Modify language if it's Python
  if (language === "python") {
    language = "py";
  }

  const data = {
    code: code,
    language: language,
    input: input,
  };

  const config = {
    method: "post",
    url: "https://codex-api.fly.dev/", // Change: Update the correct API endpoint
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    // Calling the code compilation API
    const response = await axios(config);
    res.send(response.data);
    console.log(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const fetchCompilerTestCases = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id)
      return res.status(422).json({
        status: "missing parameters",
        error:
          "must provide a compiler document id for fetching the correct testcase",
      });
    const assessment = await Compiler.findById(id);
    if (!assessment) {
      return res.status(200).json({ status: "not found" });
    }
    res.json(assessment.testcase);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      status: "error occured when fetching assessments",
      error: JSON.stringify(e),
    });
  }
};

module.exports = { compileCode, fetchCompilerTestCases };
