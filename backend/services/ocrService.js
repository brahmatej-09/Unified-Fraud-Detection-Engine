const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const analyzeOCR = async (
    filePath,
    transactionId,
    tableName,
    originalFileName
) => {

    try {

        const form = new FormData();

        // Get the original filename extension
        const filename =
            originalFileName ||
            path.basename(filePath);

        form.append(
            "file",
            fs.createReadStream(filePath),
            {
                filename: filename
            }
        );

        form.append(
            "transaction_id",
            transactionId
        );

        form.append(
            "table_name",
            tableName
        );

        const response = await axios.post(
            "http://localhost:8000/ocr/analyze",
            form,
            {
                headers: {
                    ...form.getHeaders()
                }
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "OCR service error:",
            error.response?.data ||
            error.message
        );

        if (error.response?.data) {
            return error.response.data;
        }

        throw new Error(
            "OCR fraud engine is unavailable"
        );
    }
};

module.exports = {
    analyzeOCR
};