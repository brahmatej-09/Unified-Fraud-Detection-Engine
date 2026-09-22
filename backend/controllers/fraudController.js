const fraudEngineService = require("../services/fraudEngineService");
const geminiService = require("../services/geminiService");
const pool = require("../config/db");

const analyzeTransaction = async (req, res) => {
    try {
        const { tableName, transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({
                message: "Transaction ID is required"
            });
        }

        // =====================================================
        // 1. Ask Python fraud engine for analysis
        // =====================================================

        const result =
            await fraudEngineService.analyzeTransaction(
                tableName,
                transactionId
            );

        // =====================================================
        // 2. Stop if transaction is invalid
        // =====================================================

        if (!result.valid) {
            return res.status(400).json(result);
        }

        // =====================================================
        // 3. Generate AI explanation
        // =====================================================

        const aiExplanation =
            await geminiService.generateExplanation(result);

        // =====================================================
        // 4. Find transaction in PostgreSQL
        //    If it does not exist, create it
        // =====================================================

        console.log(
            "Looking for transaction:",
            transactionId
        );

        const transaction = await pool.query(
            `SELECT id, transaction_id
             FROM transactions
             WHERE transaction_id = $1`,
            [transactionId]
        );

        let transactionDbId;

        if (transaction.rows.length === 0) {

            console.log(
                "Transaction not found. Creating:",
                transactionId
            );

            const newTransaction = await pool.query(
                `INSERT INTO transactions
                (
                    transaction_id
                )
                VALUES ($1)
                RETURNING id, transaction_id`,
                [transactionId]
            );

            transactionDbId =
                newTransaction.rows[0].id;

        } else {

            transactionDbId =
                transaction.rows[0].id;
        }

        console.log(
            "Transaction database ID:",
            transactionDbId
        );

        // =====================================================
        // 5. Save fraud analysis
        // =====================================================

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

        // =====================================================
        // 6. Save audit log
        // =====================================================

        await pool.query(
            `INSERT INTO audit_logs
            (
                user_id,
                action,
                transaction_id,
                details
            )
            VALUES ($1, $2, $3, $4)`,
            [
                req.user.userId,
                "FRAUD_ANALYSIS",
                transactionDbId,
                `Fraud analysis completed. Risk level: ${result.final_result.risk_level}`
            ]
        );

        // =====================================================
        // 7. Return result
        // =====================================================

        res.json({
            message: "Fraud analysis completed",
            analysis: analysis.rows[0],
            details: result,
            ai_explanation: aiExplanation
        });

    } catch (error) {

        console.error(
            "Fraud analysis error:",
            error
        );

        res.status(500).json({
            message: "Fraud analysis failed"
        });
    }
};

module.exports = {
    analyzeTransaction
};