const pool = require("../config/db");

const getAnalysisHistory = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                fa.id,
                t.transaction_id,
                t.amount,
                t.currency,
                fa.adaptive_score,
                fa.fund_flow_score,
                fa.phishing_score,
                fa.final_score,
                fa.risk_level,
                fa.explanation,
                fa.created_at
             FROM fraud_analysis fa
             JOIN transactions t
               ON fa.transaction_id = t.id
             ORDER BY fa.created_at DESC`
        );

        res.json({
            history: result.rows
        });

    } catch (error) {
        console.error("History fetch error:", error);

        res.status(500).json({
            message: "Failed to fetch analysis history"
        });
    }
};

module.exports = {
    getAnalysisHistory
};