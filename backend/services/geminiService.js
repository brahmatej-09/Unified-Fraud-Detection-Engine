const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const generateExplanation = async (fraudResult) => {

    const prompt = `
You are a fraud analysis assistant.

Explain the following fraud analysis to a financial analyst.

Important rules:
- Do NOT change or recalculate the fraud score.
- Do NOT invent additional fraud signals.
- Only explain the information provided.
- Keep the explanation concise and professional.
- Mention the risk level and the main triggered signals.

Fraud analysis:

${JSON.stringify(fraudResult, null, 2)}
`;

    try {

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt
        });

        return {
            summary: response.text,
            generatedBy: "Gemini"
        };

    } catch (error) {

        console.error(
            "Gemini explanation error:",
            error.message
        );

        // Gemini failure should NOT stop fraud analysis.
        return {
            summary:
                fraudResult.explanation?.summary ||
                "Fraud analysis completed. AI explanation is temporarily unavailable.",
            generatedBy: "Rule-based fallback"
        };
    }
};

module.exports = {
    generateExplanation
};