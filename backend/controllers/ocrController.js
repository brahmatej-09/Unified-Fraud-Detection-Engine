const path = require("path");
const fs = require("fs");

const ocrService = require("../services/ocrService");

const analyzeOCR = async (req, res) => {

    try {

        // -----------------------------------------
        // 1. Check uploaded file
        // -----------------------------------------

        if (!req.file) {
            return res.status(400).json({
                message: "Statement file is required"
            });
        }

        // -----------------------------------------
        // 2. Get request parameters
        // -----------------------------------------

        const {
            transactionId,
            tableName
        } = req.body;

        if (!transactionId) {

            return res.status(400).json({
                message: "Transaction ID is required"
            });
        }

        if (!tableName) {

            return res.status(400).json({
                message: "Table name is required"
            });
        }

        // -----------------------------------------
        // 3. Call Python OCR service
        // -----------------------------------------

        const result = await ocrService.analyzeOCR(
            req.file.path,
            transactionId,
            tableName,
            req.file.originalname
        );

        // -----------------------------------------
        // 4. Return Python result
        // -----------------------------------------

        if (!result.valid) {

            return res.status(400).json(result);
        }

        res.json({
            message: "OCR fraud analysis completed",
            result
        });

    } catch (error) {

        console.error(
            "OCR controller error:",
            error
        );

        res.status(500).json({
            message: "OCR fraud analysis failed"
        });

    } finally {

        // -----------------------------------------
        // 5. Delete temporary uploaded file
        // -----------------------------------------

        if (req.file?.path) {

            try {

                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

            } catch (error) {

                console.error(
                    "Failed to remove temporary file:",
                    error
                );
            }
        }
    }
};

module.exports = {
    analyzeOCR
};