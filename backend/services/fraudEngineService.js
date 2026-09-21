const axios = require("axios");

const analyzeTransaction = async (transactionId) => {
    try {
        const response = await axios.get(
            `http://localhost:8000/analyze/${transactionId}`
        );

        return response.data;

    } catch (error) {
        console.error(
            "Fraud engine error:",
            error.response?.data || error.message
        );

        throw new Error("Fraud engine is unavailable");
    }
};

module.exports = {
    analyzeTransaction
};