const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (request, file, callback) {
        callback(null, path.join(__dirname, "../../images/candidates"));
    },
    filename: function (request, file, callback) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        callback(null, uniqueSuffix + ext);
    }
});

const fileFilter = (request, file, callback) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowedTypes.test(ext)) {
        callback(null, true);
    } else {
        callback(new Error("نوع الملف غير مسموح به. استخدم صور jpg أو png أو webp فقط."));
    }
};

const uploadCandidatePhoto = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
}).single("photo");

module.exports = { uploadCandidatePhoto };
