const axios = require("axios");

const analyzeOCR = async (
    filePath,
    transactionId,
    tableName
) => {

    try {

        const FormData = require("form-data");
        const fs = require("fs");

        const form = new FormData();

        form.append(
            "file",
            fs.createReadStream(filePath)
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