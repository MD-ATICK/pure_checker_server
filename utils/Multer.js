const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Specify the directory to store the files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname); // Generate a unique filename
  },
});

exports.upload = multer({ storage });
