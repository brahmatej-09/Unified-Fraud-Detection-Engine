const fraudEngineService = require("../services/fraudEngineService");
const pool = require("../config/db");
const geminiService = require("../services/geminiService");
const analyzeTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({
                message: "Transaction ID is required"
            });
        }

        // Ask Python fraud engine for analysis
        const result =
            await fraudEngineService.analyzeTransaction(transactionId);

        // Stop if transaction was invalid
        if (!result.valid) {
            return res.status(400).json(result);
        }
        const aiExplanation =
            await geminiService.generateExplanation(result);
        // Find transaction in PostgreSQL
        const transaction = await pool.query(
            `SELECT id
             FROM transactions
             WHERE transaction_id = $1`,
            [transactionId]
        );

        if (transaction.rows.length === 0) {
            return res.status(404).json({
                message: "Transaction not found in database"
            });
        }

        const transactionDbId = transaction.rows[0].id;

        // Save fraud analysis
        const analysis = await pool.query(
            `INSERT INTO fraud_analysis
            (
                transaction_id,
                adaptive_score,
                fund_flow_score,
                phishing_score,
                final_score,
                risk_level,
                explanation
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                transactionDbId,
                result.adaptive_friction.adaptive_friction_score,
                result.fund_flow.fund_flow_score,
                result.phishing.phishing_score,
                result.final_result.final_score,
                result.final_result.risk_level,
                aiExplanation.summary
            ]
        );

        res.json({
            message: "Fraud analysis completed",
            analysis: analysis.rows[0],
            details: result,
            ai_explanation: aiExplanation
        });

    } catch (error) {
        console.error("Fraud analysis error:", error);

        res.status(500).json({
            message: "Fraud analysis failed"
        });
    }
};

module.exports = {
    analyzeTransaction
};