from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_analyze_valid_transaction():
    response = client.get(
        "/analyze/table1/TXN-2026-02"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["valid"] is True
    assert data["transaction_id"] == "TXN-2026-02"

    # Verify all three scoring components
    assert data["adaptive_friction"]["valid"] is True
    assert data["fund_flow"]["valid"] is True
    assert data["phishing"]["valid"] is True

    # Verify final score and risk band
    assert data["final_result"]["final_score"] == 14.43
    assert data["final_result"]["risk_level"] == "Very Low"

    # Verify YAML-based recommended action
    assert "recommended_action" in data["final_result"]
    assert len(data["final_result"]["recommended_action"]) > 0

    # Verify explanation
    assert data["explanation"]["risk_level"] == "Very Low"
    assert len(data["explanation"]["signals"]) > 0


def test_analyze_invalid_transaction():
    response = client.get(
        "/analyze/table1/TXN-2026-01"
    )

    assert response.status_code == 200

    data = response.json()

    # TXN-2026-01 contains missing required fields
    assert data["valid"] is False
    assert "validation_errors" in data


def test_risk_score_generates_str_for_high_risk():
    payload = {
        "transaction_id": "TEST-STR-001",

        "adaptive_friction": {
            "liveTransaction": {
                "amount": 2000,
                "distanceKm": 1500,
                "deviceFingerprint": {
                    "os": "Windows",
                    "browser": "Chrome",
                    "ipAddress": "10.0.0.1",
                    "userAgent": "Test-Agent"
                }
            },
            "storedProfile": {
                "historicalAvgAmount": 1000,
                "knownDeviceFingerprint": {
                    "os": "Linux",
                    "browser": "Firefox",
                    "ipAddress": "10.0.0.2",
                    "userAgent": "Old-Agent"
                }
            }
        },

        "fund_flow": {
            "InDegree": 1,
            "OutDegree": 1,
            "RemainingBalance": 0,
            "TotalSent": 100,
            "HoldingMinutes": 0
        },

        "phishing": {
            "submittedAt": "2026-07-01T00:00:00Z",
            "domain": {
                "registrationDate": "2026-01-01T00:00:00Z"
            },
            "certificate": {
                "selfSigned": False,
                "validFrom": "2026-01-01T00:00:00Z",
                "validTo": "2027-01-01T00:00:00Z"
            },
            "localListing": "clean"
        }
    }

    response = client.post(
        "/risk-score",
        json=payload
    )

    assert response.status_code == 200

    data = response.json()

    # Verify transaction was successfully analyzed
    assert data["valid"] is True

    # Verify High risk was calculated
    assert data["final_result"]["final_score"] == 80
    assert data["final_result"]["risk_level"] == "High"

    # Verify STR was automatically generated
    assert "str" in data
    assert data["str"]["generated"] is True

    # Verify STR details
    assert data["str"]["report_type"] == "Suspicious Transaction Report"

    assert (
        data["str"]["transaction_summary"]["transaction_id"]
        == "TEST-STR-001"
    )

    assert (
        data["str"]["risk_assessment"]["consolidated_risk_score"]
        == 80
    )

    assert (
        data["str"]["risk_assessment"]["risk_level"]
        == "High"
    )