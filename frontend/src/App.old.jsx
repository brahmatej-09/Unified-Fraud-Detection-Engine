import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5001";

// =========================================================
// RISK STYLING
// =========================================================

const getRiskStyle = (riskLevel) => {
  switch (riskLevel) {
    case "Very Low":
      return {
        background: "#ecfdf3",
        color: "#087443",
        border: "#abefc6"
      };

    case "Low":
      return {
        background: "#eff8ff",
        color: "#175cd3",
        border: "#b2ddff"
      };

    case "Medium":
      return {
        background: "#fffaeb",
        color: "#b54708",
        border: "#fedf89"
      };

    case "High":
      return {
        background: "#fff6ed",
        color: "#c4320a",
        border: "#fddec8"
      };

    case "Critical":
      return {
        background: "#fef3f2",
        color: "#b42318",
        border: "#fecdca"
      };

    default:
      return {
        background: "#f2f4f7",
        color: "#344054",
        border: "#d0d5dd"
      };
  }
};

// =========================================================
// SCORE BAR
// =========================================================

const ScoreBar = ({ name, score, weight }) => {
  const numericScore = Number(score) || 0;

  return (
    <div style={{ marginTop: "22px" }}>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px"
        }}
      >
        <div>
          <strong
            style={{
              color: "#101828",
              fontSize: "14px"
            }}
          >
            {name}
          </strong>

          <span
            style={{
              marginLeft: "8px",
              fontSize: "12px",
              color: "#98a2b3"
            }}
          >
            {weight}
          </span>
        </div>

        <strong
          style={{
            color: "#101828",
            fontSize: "14px"
          }}
        >
          {numericScore.toFixed(2)}
        </strong>
      </div>

      <div
        style={{
          height: "9px",
          background: "#eaecf0",
          borderRadius: "20px",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${Math.min(numericScore, 100)}%`,
            height: "100%",
            background: "#344054",
            borderRadius: "20px",
            transition: "width 0.5s ease"
          }}
        />
      </div>

    </div>
  );
};

// =========================================================
// STAT CARD
// =========================================================

const StatCard = ({ title, value, subtitle }) => {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #eaecf0",
        borderRadius: "14px",
        padding: "22px",
        boxShadow: "0 1px 3px rgba(16,24,40,0.04)"
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#667085",
          fontSize: "13px",
          fontWeight: "500"
        }}
      >
        {title}
      </p>

      <h2
        style={{
          margin: "10px 0 5px",
          color: "#101828",
          fontSize: "28px"
        }}
      >
        {value}
      </h2>

      <p
        style={{
          margin: 0,
          color: "#98a2b3",
          fontSize: "12px"
        }}
      >
        {subtitle}
      </p>
    </div>
  );
};

// =========================================================
// RISK BADGE
// =========================================================

const RiskBadge = ({ risk }) => {
  const style = getRiskStyle(risk);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: "999px",
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: "12px",
        fontWeight: "600",
        whiteSpace: "nowrap"
      }}
    >
      {risk || "Unknown"}
    </span>
  );
};

// =========================================================
// APP
// =========================================================

function App() {

  // =======================================================
  // NAVIGATION
  // =======================================================

  const [activePage, setActivePage] = useState("dashboard");

  // =======================================================
  // AUTH
  // =======================================================

  const [isLogin, setIsLogin] = useState(true);

  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // =======================================================
  // ANALYSIS
  // =======================================================

  const [tableName, setTableName] = useState("table1");
  const [transactionId, setTransactionId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // =======================================================
// USER TRANSACTION ANALYSIS
// =======================================================

const [analysisMode, setAnalysisMode] = useState("dataset");

const [userTransaction, setUserTransaction] = useState({
  transaction_id: "",
  amount: "",
  currency: "EUR",

  distanceKm: "",
  currentOs: "",
  currentBrowser: "",
  currentIpAddress: "",
  currentUserAgent: "",

  historicalAvgAmount: "",
  knownOs: "",
  knownBrowser: "",
  knownIpAddress: "",
  knownUserAgent: "",

  inDegree: "",
  outDegree: "",
  remainingBalance: "",
  totalSent: "",
  holdingMinutes: "",

  submittedAt: "",
  registrationDate: "",
  selfSigned: false,
  validFrom: "",
  validTo: "",
  localListing: "clear"
});

const [userResult, setUserResult] = useState(null);
const [userLoading, setUserLoading] = useState(false);

  // =======================================================
  // OCR
  // =======================================================

  const [ocrFile, setOcrFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // =======================================================
  // HISTORY
  // =======================================================

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // =======================================================
  // MESSAGES
  // =======================================================

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =======================================================
  // AUTHENTICATION
  // =======================================================

  const handleSubmit = async () => {

    setMessage("");
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!isLogin && !name) {
      setError("Name is required.");
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
        setMessage("Login successful.");
        setPassword("");
      }

    } catch (error) {

      console.error(
        "Authentication error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Authentication failed."
      );
    }
  };

  // =======================================================
  // TRANSACTION ANALYSIS
  // =======================================================

  const analyzeTransaction = async () => {

    if (!transactionId.trim()) {
      setError("Enter a transaction ID.");
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
        setError("Please login again.");
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
        "Fraud analysis completed successfully."
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
          "Fraud analysis failed."
        );
      }

    } finally {

      setLoading(false);
    }
  };

  const analyzeUserTransaction = async () => {
  setUserLoading(true);
  setUserResult(null);
  setError("");
  setMessage("");

  try {
    const token = localStorage.getItem("token");

    const data = {
      transaction_id: userTransaction.transaction_id,

      adaptive_friction: {
        liveTransaction: {
          amount: Number(userTransaction.amount),
          currency: userTransaction.currency,
          distanceKm: Number(userTransaction.distanceKm),
          deviceFingerprint: {
            os: userTransaction.currentOs,
            browser: userTransaction.currentBrowser,
            ipAddress: userTransaction.currentIpAddress,
            userAgent: userTransaction.currentUserAgent
          }
        },

        storedProfile: {
          historicalAvgAmount: Number(
            userTransaction.historicalAvgAmount
          ),

          knownDeviceFingerprint: {
            os: userTransaction.knownOs,
            browser: userTransaction.knownBrowser,
            ipAddress: userTransaction.knownIpAddress,
            userAgent: userTransaction.knownUserAgent
          }
        }
      },

      fund_flow: {
        InDegree: Number(userTransaction.inDegree),
        OutDegree: Number(userTransaction.outDegree),
        RemainingBalance: Number(
          userTransaction.remainingBalance
        ),
        TotalSent: Number(userTransaction.totalSent),
        HoldingMinutes: Number(
          userTransaction.holdingMinutes
        )
      },

      phishing: {
        submittedAt: userTransaction.submittedAt,

        domain: {
          registrationDate: userTransaction.registrationDate
        },

        certificate: {
          selfSigned: userTransaction.selfSigned,
          validFrom: userTransaction.validFrom,
          validTo: userTransaction.validTo
        },

        localListing: userTransaction.localListing
      }
    };

    const response = await fetch(
      `${API_URL}/api/fraud/risk-score`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify(data)
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        responseData.message ||
        responseData.reason ||
        "Risk analysis failed"
      );
    }

    setUserResult(responseData);

    setMessage("Transaction analyzed successfully.");
  } catch (err) {
    console.error("User transaction analysis error:", err);

    setError(
      err.message || "Failed to analyze transaction."
    );
  } finally {
    setUserLoading(false);
  }
};

  // =======================================================
  // OCR FILE
  // =======================================================

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
        "Only PDF, PNG, JPG and JPEG files are supported."
      );

      event.target.value = "";

      return;
    }

    setOcrFile(file);
  };

  // =======================================================
  // OCR ANALYSIS
  // =======================================================

  const analyzeOCR = async () => {

    if (!ocrFile) {

      setError(
        "Please select a PDF or image statement."
      );

      return;
    }

    if (!transactionId.trim()) {

      setError(
        "Enter a transaction ID before analyzing the statement."
      );

      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {

      setLoggedIn(false);

      setError(
        "Please login again."
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
        "OCR fraud analysis completed successfully."
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
          "OCR analysis failed."
        );
      }

    } finally {

      setOcrLoading(false);
    }
  };

  // =======================================================
  // HISTORY
  // =======================================================

  const loadHistory = async () => {

    setHistoryLoading(true);
    setError("");

    try {

      const token =
        localStorage.getItem("token");

      if (!token) {

        setLoggedIn(false);
        setError("Please login again.");

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
          "Failed to load history."
        );
      }

    } finally {

      setHistoryLoading(false);
    }
  };

  // =======================================================
  // LOGOUT
  // =======================================================

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

    setActivePage("dashboard");
  };

  // =======================================================
  // LOGIN SCREEN
  // =======================================================

  if (!loggedIn) {

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #f2f4f7 0%, #e4e7ec 100%)",
          padding: "20px",
          boxSizing: "border-box",
          fontFamily: "Arial, sans-serif"
        }}
      >

        <div
          style={{
            width: "430px",
            maxWidth: "100%",
            background: "#ffffff",
            borderRadius: "18px",
            padding: "40px",
            boxSizing: "border-box",
            boxShadow:
              "0 20px 50px rgba(16,24,40,0.12)"
          }}
        >

          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: "#101828",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "17px",
              marginBottom: "22px"
            }}
          >
            FG
          </div>

          <h1
            style={{
              margin: 0,
              color: "#101828",
              fontSize: "27px"
            }}
          >
            FraudGuard
          </h1>

          <p
            style={{
              color: "#667085",
              lineHeight: "1.6",
              marginTop: "8px"
            }}
          >
            Unified fraud detection and risk
            analysis platform.
          </p>

          <div
            style={{
              height: "1px",
              background: "#eaecf0",
              margin: "25px 0"
            }}
          />

          <h2
            style={{
              marginBottom: "20px",
              color: "#101828",
              fontSize: "20px"
            }}
          >
            {isLogin
              ? "Welcome back"
              : "Create your account"}
          </h2>

          {!isLogin && (
            <div style={{ marginBottom: "16px" }}>

              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#344054"
                }}
              >
                Name
              </label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "12px 13px",
                  border: "1px solid #d0d5dd",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                  outline: "none"
                }}
              />

            </div>
          )}

          <div style={{ marginBottom: "16px" }}>

            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#344054"
              }}
            >
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px 13px",
                border: "1px solid #d0d5dd",
                borderRadius: "8px",
                boxSizing: "border-box"
              }}
            />

          </div>

          <div style={{ marginBottom: "20px" }}>

            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#344054"
              }}
            >
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px 13px",
                border: "1px solid #d0d5dd",
                borderRadius: "8px",
                boxSizing: "border-box"
              }}
            />

          </div>

          <button
            onClick={handleSubmit}
            style={{
              width: "100%",
              padding: "13px",
              background: "#101828",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px"
            }}
          >
            {isLogin
              ? "Sign in"
              : "Create account"}
          </button>

          <button
            onClick={() => {

              setIsLogin(!isLogin);
              setError("");
              setMessage("");

            }}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              background: "#ffffff",
              color: "#344054",
              border: "1px solid #d0d5dd",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            {isLogin
              ? "Create new account"
              : "Already have an account? Sign in"}
          </button>

          {message && (
            <p
              style={{
                color: "#087443",
                background: "#ecfdf3",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "13px"
              }}
            >
              {message}
            </p>
          )}

          {error && (
            <p
              style={{
                color: "#b42318",
                background: "#fef3f2",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "13px"
              }}
            >
              {error}
            </p>
          )}

        </div>

      </div>
    );
  }

  // =======================================================
  // DASHBOARD DATA
  // =======================================================

  const totalAnalyses = history.length;

  const highRiskCount =
    history.filter(
      (item) =>
        item.risk_level === "High"
    ).length;

  const criticalCount =
    history.filter(
      (item) =>
        item.risk_level === "Critical"
    ).length;

  const mediumCount =
    history.filter(
      (item) =>
        item.risk_level === "Medium"
    ).length;

  // =======================================================
  // MAIN APPLICATION
  // =======================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f8f9fc",
        fontFamily:
          "Arial, Helvetica, sans-serif",
        color: "#101828"
      }}
    >

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        style={{
          width: "245px",
          minHeight: "100vh",
          background: "#101828",
          color: "#ffffff",
          padding: "25px 16px",
          boxSizing: "border-box",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          alignSelf: "flex-start"
        }}
      >

        <div
          style={{
            padding: "5px 10px 30px"
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px"
            }}
          >

            <div
              style={{
                width: "38px",
                height: "38px",
                background: "#ffffff",
                color: "#101828",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "13px"
              }}
            >
              FG
            </div>

            <div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "17px"
                }}
              >
                FraudGuard
              </h2>

              <p
                style={{
                  margin: "3px 0 0",
                  color: "#98a2b3",
                  fontSize: "10px"
                }}
              >
                FRAUD INTELLIGENCE
              </p>

            </div>

          </div>

        </div>

        <p
          style={{
            color: "#667085",
            fontSize: "10px",
            fontWeight: "600",
            padding: "0 10px",
            marginBottom: "10px",
            letterSpacing: "0.8px"
          }}
        >
          WORKSPACE
        </p>

        {[
          ["dashboard", "Dashboard"],
          ["analyze", "Transaction Analysis"],
          ["ocr", "Statement OCR"],
          ["history", "Analysis History"]
        ].map(([page, label]) => (

          <button
            key={page}
            onClick={() => {
              setActivePage(page);
              setError("");
              setMessage("");
            }}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "8px",
              padding: "12px 13px",
              marginBottom: "5px",
              textAlign: "left",
              cursor: "pointer",
              background:
                activePage === page
                  ? "#344054"
                  : "transparent",
              color:
                activePage === page
                  ? "#ffffff"
                  : "#98a2b3",
              fontSize: "13px",
              fontWeight:
                activePage === page
                  ? "600"
                  : "400"
            }}
          >
            {label}
          </button>

        ))}

        <div
          style={{
            marginTop: "auto",
            paddingTop: "35px"
          }}
        >

          <div
            style={{
              borderTop: "1px solid #344054",
              paddingTop: "18px",
              margin: "0 8px 15px"
            }}
          >

            <p
              style={{
                margin: 0,
                color: "#667085",
                fontSize: "10px"
              }}
            >
              SYSTEM
            </p>

            <p
              style={{
                margin: "7px 0 0",
                color: "#98a2b3",
                fontSize: "11px"
              }}
            >
              Rule Engine · Gemini · OCR
            </p>

          </div>

          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: "11px",
              background: "transparent",
              color: "#fda29b",
              border: "1px solid #475467",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            Sign out
          </button>

        </div>

      </aside>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "28px",
          boxSizing: "border-box"
        }}
      >

        {/* TOP BAR */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
            gap: "15px"
          }}
        >

          <div>

            <p
              style={{
                margin: 0,
                color: "#667085",
                fontSize: "12px"
              }}
            >
              Fraud Intelligence Platform
            </p>

            <h1
              style={{
                margin: "5px 0 0",
                fontSize: "25px",
                color: "#101828"
              }}
            >
              {activePage === "dashboard" &&
                "Dashboard"}

              {activePage === "analyze" &&
                "Transaction Analysis"}

              {activePage === "ocr" &&
                "Statement OCR"}

              {activePage === "history" &&
                "Analysis History"}
            </h1>

          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >

            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#e4e7ec",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#344054",
                fontWeight: "700",
                fontSize: "13px"
              }}
            >
              {name
                ? name.charAt(0).toUpperCase()
                : "A"}
            </div>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fef3f2",
              border: "1px solid #fecdca",
              color: "#b42318",
              padding: "13px 15px",
              borderRadius: "10px",
              marginBottom: "18px",
              fontSize: "13px"
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* SUCCESS */}

        {message && (
          <div
            style={{
              background: "#ecfdf3",
              border: "1px solid #abefc6",
              color: "#087443",
              padding: "13px 15px",
              borderRadius: "10px",
              marginBottom: "18px",
              fontSize: "13px"
            }}
          >
            {message}
          </div>
        )}

        {/* =================================================
            DASHBOARD PAGE
        ================================================= */}

        {activePage === "dashboard" && (

          <>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "15px",
                marginBottom: "25px"
              }}
            >

              <StatCard
                title="Total Analyses"
                value={totalAnalyses}
                subtitle="Recorded fraud analyses"
              />

              <StatCard
                title="High Risk"
                value={highRiskCount}
                subtitle="High-risk transactions"
              />

              <StatCard
                title="Critical"
                value={criticalCount}
                subtitle="Critical-risk transactions"
              />

              <StatCard
                title="Medium Risk"
                value={mediumCount}
                subtitle="Medium-risk transactions"
              />

            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #eaecf0",
                borderRadius: "14px",
                padding: "25px",
                marginBottom: "20px"
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap"
                }}
              >

                <div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px"
                    }}
                  >
                    Fraud Detection Center
                  </h2>

                  <p
                    style={{
                      color: "#667085",
                      fontSize: "13px",
                      marginBottom: 0
                    }}
                  >
                    Analyze transactions using
                    adaptive, fund-flow and phishing
                    risk signals.
                  </p>

                </div>

                <button
                  onClick={() =>
                    setActivePage("analyze")
                  }
                  style={{
                    background: "#101828",
                    color: "#ffffff",
                    border: "none",
                    padding: "11px 17px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600"
                  }}
                >
                  Analyze Transaction
                </button>

              </div>

            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "18px"
              }}
            >

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #eaecf0",
                  borderRadius: "14px",
                  padding: "23px"
                }}
              >

                <p
                  style={{
                    color: "#667085",
                    fontSize: "12px",
                    margin: 0
                  }}
                >
                  SCORING ENGINE
                </p>

                <h3
                  style={{
                    margin: "9px 0",
                    fontSize: "18px"
                  }}
                >
                  Multi-Signal Analysis
                </h3>

                <p
                  style={{
                    color: "#667085",
                    fontSize: "13px",
                    lineHeight: "1.6"
                  }}
                >
                  Adaptive Friction, Fund Flow and
                  Phishing signals are combined into
                  one final fraud score.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "7px",
                    flexWrap: "wrap"
                  }}
                >
                  <span style={tagStyle}>
                    Adaptive 45%
                  </span>

                  <span style={tagStyle}>
                    Fund Flow 35%
                  </span>

                  <span style={tagStyle}>
                    Phishing 20%
                  </span>
                </div>

              </div>

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #eaecf0",
                  borderRadius: "14px",
                  padding: "23px"
                }}
              >

                <p
                  style={{
                    color: "#667085",
                    fontSize: "12px",
                    margin: 0
                  }}
                >
                  DOCUMENT INTELLIGENCE
                </p>

                <h3
                  style={{
                    margin: "9px 0",
                    fontSize: "18px"
                  }}
                >
                  OCR Statement Analysis
                </h3>

                <p
                  style={{
                    color: "#667085",
                    fontSize: "13px",
                    lineHeight: "1.6"
                  }}
                >
                  Upload PDF or image statements and
                  extract Fund Flow information for
                  fraud analysis.
                </p>

                <button
                  onClick={() =>
                    setActivePage("ocr")
                  }
                  style={{
                    border: "1px solid #d0d5dd",
                    background: "#ffffff",
                    padding: "9px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "#344054"
                  }}
                >
                  Open OCR
                </button>

              </div>

            </div>

          </>

        )}

        {/* =================================================
            ANALYSIS PAGE
        ================================================= */}

        {activePage === "analyze" && (

          <>

            <div
              style={cardStyle}
            >

              <h2 style={sectionTitle}>
                Analyze Transaction
              </h2>

              <p style={descriptionStyle}>
  Select a dataset and enter the
  transaction reference to run the
  unified fraud engine.
</p>

{/* Analysis Mode */}
<div
  style={{
    display: "flex",
    gap: "10px",
    marginBottom: "20px"
  }}
>
  <button
    type="button"
    onClick={() => {
      setAnalysisMode("dataset");
      setUserResult(null);
      setError("");
      setMessage("");
    }}
    style={{
      padding: "10px 18px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      background:
        analysisMode === "dataset"
          ? "#2563eb"
          : "#1f2937",
      color: "#fff"
    }}
  >
    Dataset Analysis
  </button>

  <button
    type="button"
    onClick={() => {
      setAnalysisMode("user");
      setResult(null);
      setError("");
      setMessage("");
    }}
    style={{
      padding: "10px 18px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      background:
        analysisMode === "user"
          ? "#2563eb"
          : "#1f2937",
      color: "#fff"
    }}
  >
    New Transaction
  </button>
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      "180px 1fr 130px",
    gap: "10px"
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
                  style={inputStyle}
                >

                  <option value="table1">
                    Table 1
                  </option>

                  <option value="table2">
                    Table 2
                  </option>

                  <option value="table3">
                    Table 3
                  </option>

                  <option value="table4">
                    Table 4
                  </option>

                  <option value="table5">
                    Table 5
                  </option>

                  <option value="table6">
                    Table 6
                  </option>

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
                  style={inputStyle}
                />

                <button
                  onClick={analyzeTransaction}
                  disabled={loading}
                  style={primaryButton}
                >
                  {loading
                    ? "Analyzing..."
                    : "Analyze"}
                </button>

              </div>

            </div>

            {/* NORMAL RESULT */}

            {result && (

              <div style={cardStyle}>

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

                    <p style={eyebrowStyle}>
                      ANALYSIS RESULT
                    </p>

                    <h2
                      style={{
                        margin: "5px 0"
                      }}
                    >
                      {result.details?.transaction_id ||
                        transactionId}
                    </h2>

                    <p style={descriptionStyle}>
                      Dataset:{" "}
                      <strong>
                        {result.details?.table ||
                          tableName}
                      </strong>
                    </p>

                  </div>

                  <RiskBadge
                    risk={
                      result.details
                        ?.final_result
                        ?.risk_level
                    }
                  />

                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "14px",
                    marginTop: "25px"
                  }}
                >

                  <InfoBox
                    label="Final Score"
                    value={
                      result.details?.final_result
                        ?.final_score ?? "N/A"
                    }
                  />

                  <InfoBox
                    label="Adaptive Friction"
                    value={
                      result.details?.adaptive_friction
                        ?.adaptive_friction_score ??
                      "N/A"
                    }
                  />

                  <InfoBox
                    label="Fund Flow"
                    value={
                      result.details?.fund_flow
                        ?.fund_flow_score ??
                      "N/A"
                    }
                  />

                  <InfoBox
                    label="Phishing"
                    value={
                      result.details?.phishing
                        ?.phishing_score ??
                      "N/A"
                    }
                  />

                </div>

                <div
                  style={{
                    marginTop: "30px"
                  }}
                >

                  <h3>
                    Risk Components
                  </h3>

                  <ScoreBar
                    name="Adaptive Friction"
                    score={
                      result.details
                        ?.adaptive_friction
                        ?.adaptive_friction_score
                    }
                    weight="45%"
                  />

                  <ScoreBar
                    name="Fund Flow"
                    score={
                      result.details
                        ?.fund_flow
                        ?.fund_flow_score
                    }
                    weight="35%"
                  />

                  <ScoreBar
                    name="Phishing"
                    score={
                      result.details
                        ?.phishing
                        ?.phishing_score
                    }
                    weight="20%"
                  />

                </div>

                <div
                  style={{
                    marginTop: "30px"
                  }}
                >

                  <h3>
                    Triggered Signals
                  </h3>

                  <div
                    style={{
                      background: "#f8f9fc",
                      border: "1px solid #eaecf0",
                      borderRadius: "10px",
                      padding: "18px"
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
                                marginBottom: "8px",
                                color: "#475467",
                                fontSize: "13px"
                              }}
                            >
                              {signal}
                            </li>

                          )
                        )}

                      </ul>

                    ) : (

                      <p
                        style={{
                          margin: 0,
                          color: "#667085"
                        }}
                      >
                        No major risk signals
                        were triggered.
                      </p>

                    )}

                  </div>

                </div>

                <div
                  style={{
                    marginTop: "30px"
                  }}
                >

                  <h3>
                    AI Explanation
                  </h3>

                  <div
                    style={{
                      background: "#f8f9fc",
                      border: "1px solid #eaecf0",
                      borderRadius: "10px",
                      padding: "18px",
                      lineHeight: "1.7",
                      whiteSpace: "pre-wrap",
                      color: "#475467",
                      fontSize: "13px"
                    }}
                  >
                    {result.ai_explanation?.summary ||
                      result.details?.explanation
                        ?.summary ||
                      "No explanation available."}
                  </div>

                </div>

              </div>

            )}

          </>

        )}

        {/* =================================================
            OCR PAGE
        ================================================= */}

        {activePage === "ocr" && (

          <>

            <div style={cardStyle}>

              <p style={eyebrowStyle}>
                DOCUMENT INTELLIGENCE
              </p>

              <h2 style={sectionTitle}>
                Statement OCR Analysis
              </h2>

              <p style={descriptionStyle}>
                Upload a PDF or image statement.
                The OCR engine extracts Fund Flow
                information for the selected transaction.
              </p>

              <div
                style={{
                  background: "#f8f9fc",
                  border: "1px dashed #98a2b3",
                  borderRadius: "12px",
                  padding: "30px",
                  textAlign: "center"
                }}
              >

                <p
                  style={{
                    marginTop: 0,
                    fontWeight: "600"
                  }}
                >
                  Upload transaction statement
                </p>

                <p
                  style={{
                    color: "#667085",
                    fontSize: "13px"
                  }}
                >
                  Supported formats: PDF, PNG,
                  JPG and JPEG
                </p>

                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleOCRFileChange}
                />

                {ocrFile && (
                  <p
                    style={{
                      color: "#344054",
                      fontSize: "13px",
                      marginTop: "15px"
                    }}
                  >
                    Selected:{" "}
                    <strong>
                      {ocrFile.name}
                    </strong>
                  </p>
                )}

              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "180px 1fr 180px",
                  gap: "10px",
                  marginTop: "18px"
                }}
              >

                <select
                  value={tableName}
                  onChange={(e) =>
                    setTableName(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                >

                  <option value="table1">
                    Table 1
                  </option>

                  <option value="table2">
                    Table 2
                  </option>

                  <option value="table3">
                    Table 3
                  </option>

                  <option value="table4">
                    Table 4
                  </option>

                  <option value="table5">
                    Table 5
                  </option>

                  <option value="table6">
                    Table 6
                  </option>

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
                  style={inputStyle}
                />

                <button
                  onClick={analyzeOCR}
                  disabled={ocrLoading}
                  style={primaryButton}
                >
                  {ocrLoading
                    ? "Analyzing..."
                    : "Analyze Statement"}
                </button>

              </div>

            </div>

            {/* OCR RESULT */}

            {ocrResult && (

              <div style={cardStyle}>

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

                    <p style={eyebrowStyle}>
                      OCR ANALYSIS RESULT
                    </p>

                    <h2>
                      {ocrResult.transaction_id}
                    </h2>

                    <p style={descriptionStyle}>
                      Dataset:{" "}
                      <strong>
                        {ocrResult.table}
                      </strong>
                    </p>

                  </div>

                  <RiskBadge
                    risk={
                      ocrResult.final_result
                        ?.risk_level
                    }
                  />

                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "14px",
                    marginTop: "25px"
                  }}
                >

                  <InfoBox
                    label="Final Risk Score"
                    value={
                      ocrResult.final_result
                        ?.final_score ??
                      "N/A"
                    }
                  />

                  <InfoBox
                    label="Fund Flow Score"
                    value={
                      ocrResult.fund_flow
                        ?.fund_flow_score ??
                      "N/A"
                    }
                  />

                  <InfoBox
                    label="Dataset"
                    value={
                      ocrResult.table ||
                      "N/A"
                    }
                  />

                </div>

                <h3
                  style={{
                    marginTop: "30px"
                  }}
                >
                  Extracted Fund Flow
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(160px, 1fr))",
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
                    [
                      "Total Sent",
                      "TotalSent"
                    ],
                    [
                      "Holding Minutes",
                      "HoldingMinutes"
                    ]
                  ].map(([label, key]) => (

                    <div
                      key={key}
                      style={{
                        background: "#f8f9fc",
                        border: "1px solid #eaecf0",
                        borderRadius: "10px",
                        padding: "16px"
                      }}
                    >

                      <p
                        style={{
                          margin: 0,
                          color: "#667085",
                          fontSize: "12px"
                        }}
                      >
                        {label}
                      </p>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "7px",
                          fontSize: "17px"
                        }}
                      >
                        {ocrResult.ocr
                          ?.parsed_fund_flow?.[key] ??
                          "Not extracted"}
                      </strong>

                    </div>

                  ))}

                </div>

                <div
                  style={{
                    marginTop: "30px"
                  }}
                >

                  <h3>
                    Fund Flow Component
                  </h3>

                  <ScoreBar
                    name="Fund Flow"
                    score={
                      ocrResult.fund_flow
                        ?.fund_flow_score
                    }
                    weight="35%"
                  />

                </div>

                <div
                  style={{
                    marginTop: "30px"
                  }}
                >

                  <h3>
                    Explanation
                  </h3>

                  <div
                    style={{
                      background: "#f8f9fc",
                      border: "1px solid #eaecf0",
                      borderRadius: "10px",
                      padding: "18px",
                      lineHeight: "1.7",
                      color: "#475467",
                      fontSize: "13px"
                    }}
                  >
                    {ocrResult.explanation
                      ?.summary ||
                      "No explanation available."}
                  </div>

                </div>

              </div>

            )}

          </>

        )}

        {/* =================================================
            HISTORY PAGE
        ================================================= */}

        {activePage === "history" && (

          <div style={cardStyle}>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap"
              }}
            >

              <div>

                <p style={eyebrowStyle}>
                  AUDIT & HISTORY
                </p>

                <h2 style={sectionTitle}>
                  Analysis History
                </h2>

                <p style={descriptionStyle}>
                  Review previously completed fraud
                  analyses stored in the system.
                </p>

              </div>

              <button
                onClick={loadHistory}
                disabled={historyLoading}
                style={primaryButton}
              >
                {historyLoading
                  ? "Loading..."
                  : "Load History"}
              </button>

            </div>

            {history.length === 0 ? (

              <div
                style={{
                  marginTop: "25px",
                  padding: "40px",
                  background: "#f8f9fc",
                  borderRadius: "10px",
                  textAlign: "center",
                  color: "#667085"
                }}
              >
                <p>
                  No analysis history loaded.
                </p>

                <p
                  style={{
                    fontSize: "12px"
                  }}
                >
                  Click "Load History" to retrieve
                  stored analyses.
                </p>

              </div>

            ) : (

              <div
                style={{
                  overflowX: "auto",
                  marginTop: "25px"
                }}
              >

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "800px"
                  }}
                >

                  <thead>

                    <tr
                      style={{
                        background: "#f8f9fc"
                      }}
                    >

                      {[
                        "Transaction",
                        "Amount",
                        "Adaptive",
                        "Fund Flow",
                        "Phishing",
                        "Final Score",
                        "Risk",
                        "Date"
                      ].map((heading) => (

                        <th
                          key={heading}
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            color: "#667085",
                            fontSize: "11px",
                            fontWeight: "600",
                            borderBottom:
                              "1px solid #eaecf0"
                          }}
                        >
                          {heading}
                        </th>

                      ))}

                    </tr>

                  </thead>

                  <tbody>

                    {history.map((item) => (

                      <tr key={item.id}>

                        <td style={tableCell}>
                          <strong>
                            {item.transaction_id}
                          </strong>
                        </td>

                        <td style={tableCell}>
                          {item.amount}{" "}
                          {item.currency}
                        </td>

                        <td style={tableCell}>
                          {item.adaptive_score}
                        </td>

                        <td style={tableCell}>
                          {item.fund_flow_score}
                        </td>

                        <td style={tableCell}>
                          {item.phishing_score}
                        </td>

                        <td style={tableCell}>
                          <strong>
                            {item.final_score}
                          </strong>
                        </td>

                        <td style={tableCell}>
                          <RiskBadge
                            risk={item.risk_level}
                          />
                        </td>

                        <td style={tableCell}>
                          {item.created_at}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        )}

      </main>

    </div>
  );
}

// =========================================================
// REUSABLE STYLES
// =========================================================

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #eaecf0",
  borderRadius: "14px",
  padding: "25px",
  marginBottom: "20px",
  boxShadow:
    "0 1px 3px rgba(16,24,40,0.04)"
};

const sectionTitle = {
  margin: "5px 0 0",
  fontSize: "20px",
  color: "#101828"
};

const descriptionStyle = {
  color: "#667085",
  fontSize: "13px",
  lineHeight: "1.6"
};

const eyebrowStyle = {
  margin: 0,
  color: "#667085",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.8px"
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #d0d5dd",
  borderRadius: "8px",
  boxSizing: "border-box",
  background: "#ffffff",
  color: "#101828"
};

const primaryButton = {
  padding: "12px 16px",
  background: "#101828",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  whiteSpace: "nowrap"
};

const tableCell = {
  padding: "13px 12px",
  borderBottom: "1px solid #eaecf0",
  fontSize: "12px",
  color: "#475467"
};

const tagStyle = {
  background: "#f2f4f7",
  color: "#344054",
  padding: "5px 8px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: "600"
};

// =========================================================
// INFO BOX
// =========================================================

const InfoBox = ({ label, value }) => {

  return (
    <div
      style={{
        background: "#f8f9fc",
        border: "1px solid #eaecf0",
        borderRadius: "10px",
        padding: "17px"
      }}
    >

      <p
        style={{
          margin: 0,
          color: "#667085",
          fontSize: "11px"
        }}
      >
        {label}
      </p>

      <h3
        style={{
          margin: "8px 0 0",
          color: "#101828"
        }}
      >
        {value}
      </h3>

    </div>
  );
};

export default App;