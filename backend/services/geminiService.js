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

    const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt
    });

    return {
        summary: response.text,
        generatedBy: "Gemini"
    };
};

module.exports = {
    generateExplanation
};