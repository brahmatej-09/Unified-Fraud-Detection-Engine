const express = require("express");

const {
    analyzeTransaction
} = require("../controllers/fraudController");

const router = express.Router();

router.get(
    "/analyze/:transactionId",
    analyzeTransaction
);

module.exports = router;