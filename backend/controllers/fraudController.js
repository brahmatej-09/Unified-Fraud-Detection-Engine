const fraudEngineService = require("../services/fraudEngineService");
const geminiService = require("../services/geminiService");
const pool = require("../config/db");


// =====================================================
// DATASET TRANSACTION ANALYSIS
// =====================================================

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
                    transaction_id,
                    amount,
                    currency
                )
                VALUES ($1, $2, $3)
                RETURNING id, transaction_id`,
                [
                    transactionId,
                    result.str?.transaction_summary?.amount || null,
                    result.str?.transaction_summary?.currency || null
                ]
            );

            transactionDbId =
                newTransaction.rows[0].id;

        } else {

            transactionDbId =
                transaction.rows[0].id;

            await pool.query(
                `UPDATE transactions
                 SET amount = $1,
                     currency = $2
                 WHERE id = $3`,
                [
                    result.str?.transaction_summary?.amount || null,
                    result.str?.transaction_summary?.currency || null,
                    transactionDbId
                ]
            );
        }

        console.log(
            "Transaction database ID:",
            transactionDbId
        );

        // =====================================================
        // 5. Save fraud analysis
        // =====================================================

        console.log("Persisting scores:", {
            adaptive_friction_score: result.adaptive_friction.adaptive_friction_score,
            fund_flow_score: result.fund_flow.fund_flow_score,
            phishing_score: result.phishing.phishing_score
        });

        if (result.adaptive_friction.adaptive_friction_score === undefined) {
            console.error("Missing adaptive_friction_score from fraud engine response");
        }

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


// =====================================================
// USER-PROVIDED TRANSACTION RISK ANALYSIS
// =====================================================

const riskScore = async (req, res) => {
    try {

        const data = req.body;

        // =====================================================
        // 1. Basic validation
        // =====================================================

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({
                message: "Transaction data is required"
            });
        }

        // =====================================================
        // 2. Ask Python fraud engine for risk score
        // =====================================================

        const result =
            await fraudEngineService.riskScore(data);

        // =====================================================
        // 3. Stop if transaction is invalid
        // =====================================================

        if (!result.valid) {
            return res.status(400).json(result);
        }

        // =====================================================
        // 4. Generate AI explanation
        // =====================================================

        const aiExplanation =
            await geminiService.generateExplanation(result);

        // =====================================================
        // 5. Get transaction ID
        // =====================================================

        const transactionId =
            data.transaction_id;

        if (!transactionId) {
            return res.status(400).json({
                message: "Transaction ID is required"
            });
        }

        // =====================================================
        // 6. Find or create transaction in PostgreSQL
        // =====================================================

        const transaction = await pool.query(
            `SELECT id, transaction_id
             FROM transactions
             WHERE transaction_id = $1`,
            [transactionId]
        );

        let transactionDbId;

        if (transaction.rows.length === 0) {

            const newTransaction = await pool.query(
                `INSERT INTO transactions
                (
                    transaction_id,
                    amount,
                    currency
                )
                VALUES ($1, $2, $3)
                RETURNING id, transaction_id`,
                [
                    transactionId,
                    data.adaptive_friction?.liveTransaction?.amount || null,
                    data.adaptive_friction?.liveTransaction?.currency || null
                ]
            );

            transactionDbId =
                newTransaction.rows[0].id;

        } else {

            transactionDbId =
                transaction.rows[0].id;
        }

        // =====================================================
        // 7. Save fraud analysis
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
        // 8. Save audit log
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
                "USER_RISK_ANALYSIS",
                transactionDbId,
                `User-provided transaction analyzed. Risk level: ${result.final_result.risk_level}`
            ]
        );

        // =====================================================
        // 9. Return result
        // =====================================================

        res.json({
            message: "Risk analysis completed",
            analysis: analysis.rows[0],
            details: result,
            ai_explanation: aiExplanation
        });

    } catch (error) {

        console.error(
            "Risk score analysis error:",
            error
        );

        res.status(500).json({
            message: "Risk score analysis failed"
        });
    }
};


module.exports = {
    analyzeTransaction,
    riskScore
};