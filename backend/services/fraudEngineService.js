const axios = require("axios");

const analyzeTransaction = async (
    tableName,
    transactionId
) => {
    try {

        const response = await axios.get(
            `http://localhost:8000/analyze/${tableName}/${transactionId}`
        );

        return response.data;

    } catch (error) {

        console.error(
            "Fraud engine error:",
            error.response?.data || error.message
        );

        if (error.response?.data) {
            return error.response.data;
        }

        throw new Error(
            "Fraud engine is unavailable"
        );
    }
};

module.exports = {
    analyzeTransaction
};