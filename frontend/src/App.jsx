import { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5001";

// =========================================================
// RISK LEVEL STYLING
// =========================================================

const getRiskStyle = (riskLevel) => {
  switch (riskLevel) {
    case "Very Low":
      return {
        background: "#e8f5e9",
        color: "#2e7d32"
      };

    case "Low":
      return {
        background: "#e3f2fd",
        color: "#1565c0"
      };

    case "Medium":
      return {
        background: "#fff8e1",
        color: "#f57f17"
      };

    case "High":
      return {
        background: "#fff3e0",
        color: "#e65100"
      };

    case "Critical":
      return {
        background: "#ffebee",
        color: "#c62828"
      };

    default:
      return {
        background: "#f5f5f5",
        color: "#333"
      };
  }
};

// =========================================================
// SCORE BAR COMPONENT
// =========================================================

const ScoreBar = ({ name, score, weight }) => {
  const numericScore = Number(score) || 0;

  return (
    <div style={{ marginTop: "20px" }}>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "7px"
        }}
      >
        <div>
          <strong>{name}</strong>

          <span
            style={{
              marginLeft: "8px",
              fontSize: "13px",
              color: "#777"
            }}
          >
            Weight: {weight}
          </span>
        </div>

        <strong>
          {numericScore.toFixed(2)} / 100
        </strong>
      </div>

      <div
        style={{
          height: "10px",
          background: "#e9ecef",
          borderRadius: "10px",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${Math.min(numericScore, 100)}%`,
            height: "100%",
            background: "#555",
            borderRadius: "10px",
            transition: "width 0.4s ease"
          }}
        />
      </div>

    </div>
  );
};

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

  const [tableName, setTableName] = useState("table1");

  const [transactionId, setTransactionId] = useState("");
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  // ==============================
  // OCR
  // ==============================

  const [ocrFile, setOcrFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

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

      console.error(
        "Authentication error:",
        error
      );

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

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError("Please login again");
        setLoggedIn(false);
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/fraud/analyze/${tableName}/${transactionId.trim()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setResult(response.data);

      setMessage(
        "Fraud analysis completed"
      );

    } catch (error) {

      console.error(
        "Fraud analysis error:",
        error
      );

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

      } else if (
        error.response?.data?.validation_errors
      ) {

        const validationErrors =
          error.response.data.validation_errors;

        const messages =
          validationErrors.map((item) => {

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

      } else {

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
  // OCR FILE SELECTION
  // =========================================================

  const handleOCRFileChange = (event) => {

    const file =
      event.target.files?.[0] || null;

    setError("");
    setMessage("");
    setOcrResult(null);

    if (!file) {
      setOcrFile(null);
      return;
    }

    // Check the actual file extension
    const allowedExtensions = [
      ".pdf",
      ".png",
      ".jpg",
      ".jpeg"
    ];

    const fileName =
      file.name.toLowerCase();

    const isValidFile =
      allowedExtensions.some(
        (extension) =>
          fileName.endsWith(extension)
      );

    if (!isValidFile) {

      setOcrFile(null);

      setError(
        "Only pdf, png, jpg and jpeg files are supported."
      );

      // Clear the file input
      event.target.value = "";

      return;
    }

    setOcrFile(file);
  };

  // =========================================================
  // OCR ANALYSIS
  // =========================================================

  const analyzeOCR = async () => {

    if (!ocrFile) {

      setError(
        "Please select a PDF or image statement"
      );

      return;
    }

    if (!transactionId.trim()) {

      setError(
        "Enter a transaction ID before analyzing the statement"
      );

      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {

      setLoggedIn(false);

      setError(
        "Please login again"
      );

      return;
    }

    setOcrLoading(true);
    setOcrResult(null);
    setError("");
    setMessage("");

    try {

      const formData = new FormData();

      formData.append(
        "file",
        ocrFile
      );

      formData.append(
        "transactionId",
        transactionId.trim()
      );

      formData.append(
        "tableName",
        tableName
      );

      const response = await axios.post(
        `${API_URL}/api/ocr/analyze`,
        formData,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      setOcrResult(
        response.data.result
      );

      setMessage(
        "OCR fraud analysis completed"
      );

    } catch (error) {

      console.error(
        "OCR analysis error:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {

        localStorage.removeItem("token");

        setLoggedIn(false);

        setError(
          "Your session has expired. Please login again."
        );

      } else if (
        error.response?.data?.validation_errors
      ) {

        const validationErrors =
          error.response.data.validation_errors;

        const messages =
          validationErrors.map((item) => {

            const missingFields =
              item.missing_fields?.join(", ") ||
              "Required data is missing";

            return `${item.component}: ${missingFields}`;
          });

        setError(
          `OCR analysis cannot be completed. ${messages.join(
            " | "
          )}`
        );

      } else {

        setError(
          error.response?.data?.message ||
          "OCR analysis failed"
        );
      }

    } finally {

      setOcrLoading(false);
    }
  };

  // =========================================================
  // LOAD HISTORY
  // =========================================================

  const loadHistory = async () => {

    setHistoryLoading(true);
    setError("");

    try {

      const token =
        localStorage.getItem("token");

      if (!token) {

        setLoggedIn(false);
        setError("Please login again");

        return;
      }

      const response = await axios.get(
        `${API_URL}/api/history`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      setHistory(
        response.data.history || []
      );

    } catch (error) {

      console.error(
        "History error:",
        error
      );

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
    setTableName("table1");

    setResult(null);
    setOcrResult(null);
    setOcrFile(null);

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
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08)"
          }}
        >

          <h1>
            Fraud Detection System
          </h1>

          <p>
            {isLogin
              ? "Login to access the fraud monitoring dashboard."
              : "Create an account to continue."}
          </p>

          <hr />

          <h2>
            {isLogin
              ? "Login"
              : "Create Account"}
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
            {isLogin
              ? "Login"
              : "Register"}
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
          padding: "22px 25px",
          borderRadius: "12px",
          marginBottom: "25px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.04)"
        }}
      >

        <div>

          <h1
            style={{
              margin: 0,
              fontSize: "28px"
            }}
          >
            Fraud Detection Dashboard
          </h1>

          <p
            style={{
              marginBottom: 0,
              color: "#666"
            }}
          >
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

          <p
            style={{
              marginBottom: 0
            }}
          >
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
          borderRadius: "12px",
          marginBottom: "25px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.04)"
        }}
      >

        <h2>
          Analyze Transaction
        </h2>

        <p style={{ color: "#666" }}>
          Select a dataset table and enter a
          transaction ID.
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >

          <select
            value={tableName}
            onChange={(e) => {

              setTableName(
                e.target.value
              );

              setResult(null);
              setOcrResult(null);

              setError("");
              setMessage("");

            }}
            style={{
              padding: "12px",
              minWidth: "150px",
              boxSizing: "border-box"
            }}
          >

            <option value="table1">Table 1</option>
            <option value="table2">Table 2</option>
            <option value="table3">Table 3</option>
            <option value="table4">Table 4</option>
            <option value="table5">Table 5</option>
            <option value="table6">Table 6</option>

          </select>

          <input
            type="text"
            placeholder="TXN-2026-01"
            value={transactionId}
            onChange={(e) =>
              setTransactionId(
                e.target.value
              )
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

      {/* STATEMENT OCR */}

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "25px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.04)"
        }}
      >

        <h2>
          Statement OCR Analysis
        </h2>

        <p style={{ color: "#666" }}>
          Upload a PDF or image statement. The system
          will extract Fund Flow information using OCR
          and include it in the fraud analysis.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >

          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleOCRFileChange}
          />

          <button
            onClick={analyzeOCR}
            disabled={ocrLoading}
            style={{
              padding: "12px 20px",
              cursor: ocrLoading
                ? "not-allowed"
                : "pointer"
            }}
          >
            {ocrLoading
              ? "Analyzing Statement..."
              : "Analyze Statement"}
          </button>

        </div>

        {ocrFile && (
          <p
            style={{
              marginTop: "12px",
              color: "#555"
            }}
          >
            Selected file:{" "}
            <strong>
              {ocrFile.name}
            </strong>
          </p>
        )}

      </div>

      {/* OCR RESULT */}

      {ocrResult && (
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "12px",
            marginBottom: "25px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.04)"
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px"
            }}
          >

            <div>

              <h2 style={{ margin: 0 }}>
                OCR Analysis Result
              </h2>

              <p style={{ color: "#666" }}>
                Transaction:{" "}
                <strong>
                  {ocrResult.transaction_id}
                </strong>
              </p>

            </div>

            <div
              style={{
                ...getRiskStyle(
                  ocrResult.final_result?.risk_level
                ),
                padding: "10px 18px",
                borderRadius: "20px",
                fontWeight: "600"
              }}
            >
              {ocrResult.final_result?.risk_level ||
                "Unknown"}
            </div>

          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
              marginTop: "25px"
            }}
          >

            <div
              style={{
                padding: "20px",
                border: "1px solid #e5e5e5",
                borderRadius: "10px"
              }}
            >

              <p style={{ margin: 0, color: "#777" }}>
                Dataset
              </p>

              <h3>
                {ocrResult.table}
              </h3>

            </div>

            <div
              style={{
                padding: "20px",
                border: "1px solid #e5e5e5",
                borderRadius: "10px"
              }}
            >

              <p style={{ margin: 0, color: "#777" }}>
                Final Risk Score
              </p>

              <h2>
                {ocrResult.final_result?.final_score ??
                  "N/A"}

                <span
                  style={{
                    fontSize: "14px",
                    color: "#777",
                    fontWeight: "normal"
                  }}
                >
                  {" "} / 100
                </span>
              </h2>

            </div>

            <div
              style={{
                padding: "20px",
                border: "1px solid #e5e5e5",
                borderRadius: "10px"
              }}
            >

              <p style={{ margin: 0, color: "#777" }}>
                Fund Flow Score
              </p>

              <h2>
                {ocrResult.fund_flow
                  ?.fund_flow_score ??
                  "N/A"}
              </h2>

            </div>

          </div>

          <h3 style={{ marginTop: "30px" }}>
            Extracted Fund Flow
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "12px"
            }}
          >

            {[
              ["InDegree", "InDegree"],
              ["OutDegree", "OutDegree"],
              [
                "Remaining Balance",
                "RemainingBalance"
              ],
              ["Total Sent", "TotalSent"],
              [
                "Holding Minutes",
                "HoldingMinutes"
              ]
            ].map(([label, key]) => (

              <div
                key={key}
                style={{
                  padding: "15px",
                  background: "#f7f7f7",
                  borderRadius: "8px"
                }}
              >

                <p
                  style={{
                    margin: 0,
                    color: "#777",
                    fontSize: "13px"
                  }}
                >
                  {label}
                </p>

                <strong>
                  {ocrResult.ocr
                    ?.parsed_fund_flow?.[key] ??
                    "Not extracted"}
                </strong>

              </div>

            ))}

          </div>

          <h3 style={{ marginTop: "30px" }}>
            Fund Flow Components
          </h3>

          <ScoreBar
            name="Fund Flow"
            score={
              ocrResult.fund_flow
                ?.fund_flow_score
            }
            weight="35%"
          />

          <h3 style={{ marginTop: "30px" }}>
            Explanation
          </h3>

          <div
            style={{
              background: "#f7f7f7",
              padding: "20px",
              borderRadius: "10px",
              lineHeight: "1.7"
            }}
          >
            {ocrResult.explanation?.summary ||
              "No explanation available."}
          </div>

        </div>
      )}

      {/* NORMAL ANALYSIS RESULT */}

      {result && (
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "12px",
            marginBottom: "25px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.04)"
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
              marginBottom: "25px"
            }}
          >

            <div>

              <h2 style={{ margin: 0 }}>
                Analysis Result
              </h2>

              <p
                style={{
                  marginTop: "7px",
                  color: "#666"
                }}
              >
                Dataset:{" "}
                <strong>
                  {result.details?.table ||
                    tableName}
                </strong>
              </p>

            </div>

            <div
              style={{
                ...getRiskStyle(
                  result.details?.final_result
                    ?.risk_level
                ),
                padding: "10px 18px",
                borderRadius: "20px",
                fontWeight: "600"
              }}
            >
              {result.details?.final_result
                ?.risk_level ||
                "Unknown"}
            </div>

          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px"
            }}
          >

            <div
              style={{
                padding: "20px",
                border: "1px solid #e5e5e5",
                borderRadius: "10px"
              }}
            >

              <p
                style={{
                  margin: 0,
                  color: "#777",
                  fontSize: "14px"
                }}
              >
                Transaction
              </p>

              <h3 style={{ marginBottom: 0 }}>
                {result.details?.transaction_id ||
                  transactionId}
              </h3>

            </div>

            <div
              style={{
                padding: "20px",
                border: "1px solid #e5e5e5",
                borderRadius: "10px"
              }}
            >

              <p
                style={{
                  margin: 0,
                  color: "#777",
                  fontSize: "14px"
                }}
              >
                Final Risk Score
              </p>

              <h2 style={{ marginBottom: 0 }}>
                {result.details?.final_result
                  ?.final_score ??
                  "N/A"}

                <span
                  style={{
                    fontSize: "14px",
                    color: "#777",
                    fontWeight: "normal"
                  }}
                >
                  {" "} / 100
                </span>

              </h2>

            </div>

            <div
              style={{
                padding: "20px",
                border: "1px solid #e5e5e5",
                borderRadius: "10px"
              }}
            >

              <p
                style={{
                  margin: 0,
                  color: "#777",
                  fontSize: "14px"
                }}
              >
                Risk Level
              </p>

              <h2 style={{ marginBottom: 0 }}>
                {result.details?.final_result
                  ?.risk_level ??
                  "N/A"}
              </h2>

            </div>

          </div>

          <h3 style={{ marginTop: "35px" }}>
            Component Scores
          </h3>

          <p style={{ color: "#666" }}>
            Each component contributes to the final
            fraud score according to its defined weight.
          </p>

          <ScoreBar
            name="Adaptive Friction"
            score={
              result.details?.adaptive_friction
                ?.adaptive_friction_score
            }
            weight="45%"
          />

          <ScoreBar
            name="Fund Flow"
            score={
              result.details?.fund_flow
                ?.fund_flow_score
            }
            weight="35%"
          />

          <ScoreBar
            name="Phishing"
            score={
              result.details?.phishing
                ?.phishing_score
            }
            weight="20%"
          />

          <h3 style={{ marginTop: "35px" }}>
            Triggered Signals
          </h3>

          <div
            style={{
              background: "#f7f7f7",
              padding: "20px",
              borderRadius: "10px"
            }}
          >

            {result.details?.explanation
              ?.signals?.length > 0 ? (

              <ul
                style={{
                  margin: 0,
                  paddingLeft: "20px"
                }}
              >

                {result.details.explanation.signals.map(
                  (signal, index) => (

                    <li
                      key={index}
                      style={{
                        marginBottom: "8px"
                      }}
                    >
                      {signal}
                    </li>

                  )
                )}

              </ul>

            ) : (

              <p style={{ margin: 0 }}>
                No major risk signals were triggered.
              </p>

            )}

          </div>

          <h3 style={{ marginTop: "35px" }}>
            AI Explanation
          </h3>

          <div
            style={{
              background: "#f7f7f7",
              padding: "20px",
              borderRadius: "10px",
              lineHeight: "1.7",
              whiteSpace: "pre-wrap"
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
          borderRadius: "12px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.04)"
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

          <h2>
            Analysis History
          </h2>

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

                  <th style={{
                    padding: "10px",
                    textAlign: "left"
                  }}>
                    Transaction
                  </th>

                  <th style={{
                    padding: "10px",
                    textAlign: "left"
                  }}>
                    Amount
                  </th>

                  <th style={{
                    padding: "10px",
                    textAlign: "left"
                  }}>
                    Adaptive
                  </th>

                  <th style={{
                    padding: "10px",
                    textAlign: "left"
                  }}>
                    Fund Flow
                  </th>

                  <th style={{
                    padding: "10px",
                    textAlign: "left"
                  }}>
                    Phishing
                  </th>

                  <th style={{
                    padding: "10px",
                    textAlign: "left"
                  }}>
                    Final Score
                  </th>

                  <th style={{
                    padding: "10px",
                    textAlign: "left"
                  }}>
                    Risk
                  </th>

                  <th style={{
                    padding: "10px",
                    textAlign: "left"
                  }}>
                    Date
                  </th>

                </tr>

              </thead>

              <tbody>

                {history.map((item) => (

                  <tr key={item.id}>

                    <td style={{
                      padding: "10px"
                    }}>
                      {item.transaction_id}
                    </td>

                    <td style={{
                      padding: "10px"
                    }}>
                      {item.amount}{" "}
                      {item.currency}
                    </td>

                    <td style={{
                      padding: "10px"
                    }}>
                      {item.adaptive_score}
                    </td>

                    <td style={{
                      padding: "10px"
                    }}>
                      {item.fund_flow_score}
                    </td>

                    <td style={{
                      padding: "10px"
                    }}>
                      {item.phishing_score}
                    </td>

                    <td style={{
                      padding: "10px"
                    }}>
                      {item.final_score}
                    </td>

                    <td style={{
                      padding: "10px"
                    }}>
                      {item.risk_level}
                    </td>

                    <td style={{
                      padding: "10px"
                    }}>
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