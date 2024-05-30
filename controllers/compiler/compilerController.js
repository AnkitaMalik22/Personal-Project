const axios = require('axios');

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

module.exports = { compileCode };
