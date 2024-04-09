const multer = require("multer");
const cloudinary = require("cloudinary");
const Storage = multer.diskStorage({});

const upload = multer({
  storage: Storage,
  limits: {
    fileSize: 10000000, // 10000000 Bytes = 10 MB
  },
  fileFilter(req, file, cb) {
    // upload only mp4 and mkv format
    if (!file.originalname.match(/\.(xlsx|pdf|jpg)$/)) {
      return cb(new Error("Please upload a video"));
    }
    cb(undefined, true);
  },
});

const cloudinaryUploadMethod = async (file) => {
  return new Promise((resolve) => {
    cloudinary.uploader.upload(file, (err, res) => {
      if (err) return res.status(500).send("upload rror");
      resolve({
        res: res.secure_url,
      });
    });
  });
};

module.exports = { upload, cloudinaryUploadMethod };
