import { useState } from "react";
import axios from "axios";

function App() {

  const [transactionId, setTransactionId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeTransaction = async () => {

    if (!transactionId) {
      setError("Enter a transaction ID");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {

      const response = await axios.get(
        `http://localhost:5001/api/fraud/analyze/${transactionId}`
      );

      setResult(response.data);

    } catch (error) {

      console.error(error);

      setError(
        error.response?.data?.message ||
        "Fraud analysis failed"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px" }}>

      <h1>Fraud Detection System</h1>

      <p>
        Enter a transaction ID to analyze it.
      </p>

      <input
        type="text"
        placeholder="TXN-2026-01"
        value={transactionId}
        onChange={(e) => setTransactionId(e.target.value)}
      />

      <button
        onClick={analyzeTransaction}
        disabled={loading}
        style={{ marginLeft: "10px" }}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {result && (
        <pre>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

    </div>
  );
}

export default App;