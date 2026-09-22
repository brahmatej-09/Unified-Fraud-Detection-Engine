const express = require("express");
const { analyzeTransaction } = require("../controllers/fraudController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/analyze/:tableName/:transactionId",
    authenticateToken,
    analyzeTransaction
);

module.exports = router;