from scoring.adaptive_friction import calculate_adaptive_friction


def test_valid_adaptive_friction():
    data = {
        "liveTransaction": {
            "amount": 67600,
            "distanceKm": 500,
            "deviceFingerprint": {
                "os": "Windows 11",
                "browser": "Edge 126.0",
                "ipAddress": "203.0.113.45",
                "userAgent": "Mozilla/5.0"
            }
        },
        "storedProfile": {
            "historicalAvgAmount": 26000,
            "knownDeviceFingerprint": {
                "os": "Windows 11",
                "browser": "Edge 126.0",
                "ipAddress": "203.0.113.45",
                "userAgent": "Mozilla/5.0"
            }
        }
    }

    result = calculate_adaptive_friction(data)

    assert result["valid"] is True
    assert result["adaptive_friction_score"] >= 0
    assert result["adaptive_friction_score"] <= 100


def test_missing_required_fields():
    data = {
        "liveTransaction": {
            "amount": 67600
        },
        "storedProfile": {
            "historicalAvgAmount": 26000
        }
    }

    result = calculate_adaptive_friction(data)

    assert result["valid"] is False
    assert "missing_fields" in result


def test_negative_amount_is_rejected():
    data = {
        "liveTransaction": {
            "amount": -100,
            "distanceKm": 500,
            "deviceFingerprint": {
                "os": "Windows 11",
                "browser": "Edge 126.0",
                "ipAddress": "203.0.113.45",
                "userAgent": "Mozilla/5.0"
            }
        },
        "storedProfile": {
            "historicalAvgAmount": 26000,
            "knownDeviceFingerprint": {
                "os": "Windows 11",
                "browser": "Edge 126.0",
                "ipAddress": "203.0.113.45",
                "userAgent": "Mozilla/5.0"
            }
        }
    }

    result = calculate_adaptive_friction(data)

    assert result["valid"] is False
    assert "invalid_fields" in result