const express = require("express");

const {
    analyzeTransaction,
    riskScore
} = require("../controllers/fraudController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// DATASET TRANSACTION ANALYSIS
// =====================================================

router.get(
    "/analyze/:tableName/:transactionId",
    authenticateToken,
    analyzeTransaction
);


// =====================================================
// USER-PROVIDED TRANSACTION RISK ANALYSIS
// =====================================================

router.post(
    "/risk-score",
    authenticateToken,
    riskScore
);


module.exports = router;