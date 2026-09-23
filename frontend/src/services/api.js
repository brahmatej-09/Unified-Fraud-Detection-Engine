const API_URL = "http://localhost:5001";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      window.dispatchEvent(
        new Event("auth-expired")
      );
    }

    let errorMessage = `HTTP error! status: ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData.validation_errors) {
        errorMessage =
          errorData.validation_errors
            .map(
              (item) =>
                `${item.component}: ${item.missing_fields?.join(", ")}`
            )
            .join(" | ");
      } else {
        errorMessage =
          errorData.message ||
          errorData.reason ||
          errorMessage;
      }
    } catch (e) {
      // Ignore JSON parse errors
    }

    throw new Error(errorMessage);
  }

  return await response.json();
};

export const fraudApi = {

  async login(email, password) {
    const response = await fetch(
      `${API_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    return await handleResponse(response);
  },

  async register(name, email, password) {
    const response = await fetch(
      `${API_URL}/api/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      }
    );

    return await handleResponse(response);
  },

  async getRiskScore(data) {
    const response = await fetch(
      `${API_URL}/api/fraud/risk-score`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    return await handleResponse(response);
  },

  async analyzeDataset(
    tableName,
    transactionId
  ) {
    const response = await fetch(
      `${API_URL}/api/fraud/analyze/${tableName}/${transactionId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    return await handleResponse(response);
  },

  async analyzeOCR(file) {
    const formData = new FormData();

    formData.append("file", file);

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/ocr/analyze`,
      {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
        body: formData,
      }
    );

    return await handleResponse(response);
  },

  async getHistory() {
    const response = await fetch(
      `${API_URL}/api/history`,
      {
        headers: getAuthHeaders(),
      }
    );

    return await handleResponse(response);
  },
};