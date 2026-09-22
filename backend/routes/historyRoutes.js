const express = require("express");

const {
    getAnalysisHistory
} = require("../controllers/historyController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/history",
    authenticateToken,
    getAnalysisHistory
);

module.exports = router;