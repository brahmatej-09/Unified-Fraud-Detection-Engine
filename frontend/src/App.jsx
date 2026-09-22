import { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5001";

function App() {
  // ==============================
  // AUTH
  // ==============================

  const [isLogin, setIsLogin] = useState(true);

  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ==============================
  // ANALYSIS
  // ==============================

  const [transactionId, setTransactionId] = useState("");
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  // ==============================
  // HISTORY
  // ==============================

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ==============================
  // MESSAGES
  // ==============================

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // REGISTER / LOGIN
  // =========================================================

  const handleSubmit = async () => {
    setMessage("");
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    if (!isLogin && !name) {
      setError("Name is required");
      return;
    }

    try {
      if (!isLogin) {
        // REGISTER
        const response = await axios.post(
          `${API_URL}/api/auth/register`,
          {
            name,
            email,
            password
          }
        );

        setMessage(response.data.message);

        setIsLogin(true);

        setName("");
        setPassword("");

      } else {
        // LOGIN
        const response = await axios.post(
          `${API_URL}/api/auth/login`,
          {
            email,
            password
          }
        );

        localStorage.setItem(
          "token",
          response.data.token
        );

        setLoggedIn(true);
        setMessage("Login successful");

        setPassword("");
      }

    } catch (error) {
      console.error("Authentication error:", error);

      setError(
        error.response?.data?.message ||
        "Authentication failed"
      );
    }
  };

  // =========================================================
  // ANALYZE TRANSACTION
  // =========================================================

  const analyzeTransaction = async () => {
    if (!transactionId.trim()) {
      setError("Enter a transaction ID");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setResult(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login again");
        setLoggedIn(false);
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/fraud/analyze/${transactionId.trim()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Successful fraud analysis
      setResult(response.data);

      setMessage("Fraud analysis completed");

    } catch (error) {
      console.error("Fraud analysis error:", error);

      // ==============================
      // TOKEN ERROR
      // ==============================

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem("token");

        setLoggedIn(false);
        setResult(null);

        setError(
          "Your session has expired. Please login again."
        );

      }

      // ==============================
      // VALIDATION ERROR
      // ==============================

      else if (
        error.response?.data?.validation_errors
      ) {
        const validationErrors =
          error.response.data.validation_errors;

        const messages = validationErrors.map((item) => {
          const missingFields =
            item.missing_fields?.join(", ") ||
            "Required data is missing";

          return `${item.component}: ${missingFields}`;
        });

        setError(
          `Transaction ${transactionId} cannot be analyzed. ${messages.join(
            " | "
          )}`
        );
      }

      // ==============================
      // OTHER BACKEND ERROR
      // ==============================

      else {
        setError(
          error.response?.data?.message ||
          "Fraud analysis failed"
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD HISTORY
  // =========================================================

  const loadHistory = async () => {
    setHistoryLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoggedIn(false);
        setError("Please login again");
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setHistory(response.data.history || []);

    } catch (error) {
      console.error("History error:", error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem("token");
        setLoggedIn(false);

        setError(
          "Your session has expired. Please login again."
        );
      } else {
        setError(
          error.response?.data?.message ||
          "Failed to load history"
        );
      }

    } finally {
      setHistoryLoading(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem("token");

    setLoggedIn(false);

    setTransactionId("");
    setResult(null);
    setHistory([]);

    setMessage("");
    setError("");
  };

  // =========================================================
  // LOGIN / REGISTER SCREEN
  // =========================================================

  if (!loggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f4f5f7",
          padding: "20px"
        }}
      >

        <div
          style={{
            width: "400px",
            maxWidth: "100%",
            background: "white",
            padding: "35px",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
          }}
        >

          <h1>Fraud Detection System</h1>

          <p>
            {isLogin
              ? "Login to access the fraud monitoring dashboard."
              : "Create an account to continue."}
          </p>

          <hr />

          <h2>
            {isLogin ? "Login" : "Create Account"}
          </h2>

          {!isLogin && (
            <>
              <label>Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "6px",
                  boxSizing: "border-box"
                }}
              />

              <br />
              <br />
            </>
          )}

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
              boxSizing: "border-box"
            }}
          />

          <br />
          <br />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
              boxSizing: "border-box"
            }}
          />

          <br />
          <br />

          <button
            onClick={handleSubmit}
            style={{
              width: "100%",
              padding: "11px",
              cursor: "pointer"
            }}
          >
            {isLogin ? "Login" : "Register"}
          </button>

          <br />
          <br />

          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setMessage("");
            }}
            style={{
              width: "100%",
              padding: "10px",
              cursor: "pointer"
            }}
          >
            {isLogin
              ? "Create new account"
              : "Already have an account? Login"}
          </button>

          {message && (
            <p style={{ color: "green" }}>
              {message}
            </p>
          )}

          {error && (
            <p style={{ color: "red" }}>
              {error}
            </p>
          )}

        </div>

      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f5f7",
        padding: "30px",
        boxSizing: "border-box"
      }}
    >

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "25px"
        }}
      >

        <div>
          <h1 style={{ margin: 0 }}>
            Fraud Detection Dashboard
          </h1>

          <p style={{ marginBottom: 0 }}>
            Unified fraud analysis and monitoring
          </p>
        </div>

        <button
          onClick={logout}
          style={{
            padding: "10px 18px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            background: "#ffe5e5",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            color: "#b00020"
          }}
        >
          <strong>Error:</strong>

          <p style={{ marginBottom: 0 }}>
            {error}
          </p>
        </div>
      )}

      {/* SUCCESS */}

      {message && (
        <div
          style={{
            background: "#e5f6e5",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            color: "#176b17"
          }}
        >
          {message}
        </div>
      )}

      {/* ANALYZE TRANSACTION */}

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "10px",
          marginBottom: "25px"
        }}
      >

        <h2>Analyze Transaction</h2>

        <p>
          Enter a transaction ID to perform fraud analysis.
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >

          <input
            type="text"
            placeholder="TXN-2026-01"
            value={transactionId}
            onChange={(e) =>
              setTransactionId(e.target.value)
            }
            style={{
              flex: 1,
              minWidth: "220px",
              padding: "12px",
              boxSizing: "border-box"
            }}
          />

          <button
            onClick={analyzeTransaction}
            disabled={loading}
            style={{
              padding: "12px 20px",
              cursor: loading
                ? "not-allowed"
                : "pointer"
            }}
          >
            {loading
              ? "Analyzing..."
              : "Analyze"}
          </button>

        </div>

      </div>

      {/* ANALYSIS RESULT */}

      {result && (
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "10px",
            marginBottom: "25px"
          }}
        >

          <h2>Analysis Result</h2>

          {/* SUMMARY CARDS */}

          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap"
            }}
          >

            <div
              style={{
                flex: 1,
                minWidth: "180px",
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px"
              }}
            >
              <p>Transaction</p>

              <h3>
                {result.details?.transaction_id ||
                  transactionId}
              </h3>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "180px",
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px"
              }}
            >
              <p>Final Risk Score</p>

              <h2>
                {result.details?.final_result?.final_score ??
                  "N/A"}
              </h2>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "180px",
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px"
              }}
            >
              <p>Risk Level</p>

              <h2>
                {result.details?.final_result?.risk_level ??
                  "N/A"}
              </h2>
            </div>

          </div>

          {/* COMPONENT SCORES */}

          <h3 style={{ marginTop: "30px" }}>
            Component Scores
          </h3>

          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap"
            }}
          >

            <div
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "20px",
                background: "#f7f7f7",
                borderRadius: "8px"
              }}
            >
              <h4>Adaptive Friction</h4>

              <h2>
                {result.details?.adaptive_friction
                  ?.adaptive_friction_score ?? "N/A"}
              </h2>

              <p>Weight: 45%</p>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "20px",
                background: "#f7f7f7",
                borderRadius: "8px"
              }}
            >
              <h4>Fund Flow</h4>

              <h2>
                {result.details?.fund_flow
                  ?.fund_flow_score ?? "N/A"}
              </h2>

              <p>Weight: 35%</p>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "20px",
                background: "#f7f7f7",
                borderRadius: "8px"
              }}
            >
              <h4>Phishing</h4>

              <h2>
                {result.details?.phishing
                  ?.phishing_score ?? "N/A"}
              </h2>

              <p>Weight: 20%</p>
            </div>

          </div>

          {/* AI EXPLANATION */}

          <h3 style={{ marginTop: "30px" }}>
            AI Explanation
          </h3>

          <div
            style={{
              background: "#f7f7f7",
              padding: "20px",
              borderRadius: "8px",
              lineHeight: "1.6"
            }}
          >
            {result.ai_explanation?.summary ||
              result.details?.explanation?.summary ||
              "No explanation available."}
          </div>

        </div>
      )}

      {/* HISTORY */}

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "10px"
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px"
          }}
        >

          <h2>Analysis History</h2>

          <button
            onClick={loadHistory}
            disabled={historyLoading}
            style={{
              padding: "10px 18px",
              cursor: historyLoading
                ? "not-allowed"
                : "pointer"
            }}
          >
            {historyLoading
              ? "Loading..."
              : "Load History"}
          </button>

        </div>

        {history.length === 0 ? (
          <p>
            No analysis history loaded.
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto"
            }}
          >

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse"
              }}
            >

              <thead>
                <tr>
                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Transaction
                  </th>

                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Amount
                  </th>

                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Adaptive
                  </th>

                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Fund Flow
                  </th>

                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Phishing
                  </th>

                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Final Score
                  </th>

                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Risk
                  </th>

                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>

                    <td style={{ padding: "10px" }}>
                      {item.transaction_id}
                    </td>

                    <td style={{ padding: "10px" }}>
                      {item.amount} {item.currency}
                    </td>

                    <td style={{ padding: "10px" }}>
                      {item.adaptive_score}
                    </td>

                    <td style={{ padding: "10px" }}>
                      {item.fund_flow_score}
                    </td>

                    <td style={{ padding: "10px" }}>
                      {item.phishing_score}
                    </td>

                    <td style={{ padding: "10px" }}>
                      {item.final_score}
                    </td>

                    <td style={{ padding: "10px" }}>
                      {item.risk_level}
                    </td>

                    <td style={{ padding: "10px" }}>
                      {item.created_at}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default App;