const express = require("express");
const multer = require("multer");

const {
    analyzeOCR
} = require("../controllers/ocrController");

const authenticateToken =
    require("../middleware/authMiddleware");

const router = express.Router();

// Temporary upload location
const upload = multer({
    dest: "uploads/"
});

router.post(
    "/analyze",
    authenticateToken,
    upload.single("file"),
    analyzeOCR
);

module.exports = router;