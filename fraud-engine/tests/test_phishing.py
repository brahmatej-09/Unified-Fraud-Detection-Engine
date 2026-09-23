from scoring.phishing import calculate_phishing


def test_valid_phishing_data():
    data = {
        "submittedAt": "2026-07-15T10:00:00Z",
        "domain": {
            "registrationDate": "2026-01-01T10:00:00Z"
        },
        "certificate": {
            "selfSigned": False,
            "validFrom": "2026-01-01T00:00:00Z",
            "validTo": "2027-01-01T00:00:00Z"
        },
        "localListing": "none"
    }

    result = calculate_phishing(data)

    assert result["valid"] is True
    assert result["phishing_score"] >= 0
    assert result["phishing_score"] <= 100


def test_missing_required_fields():
    data = {
        "submittedAt": "2026-07-15T10:00:00Z",
        "domain": {},
        "certificate": {},
        "localListing": "none"
    }

    result = calculate_phishing(data)

    assert result["valid"] is False
    assert "missing_fields" in result


def test_blacklisted_domain():
    data = {
        "submittedAt": "2026-07-15T10:00:00Z",
        "domain": {
            "registrationDate": "2026-01-01T10:00:00Z"
        },
        "certificate": {
            "selfSigned": False,
            "validFrom": "2026-01-01T00:00:00Z",
            "validTo": "2027-01-01T00:00:00Z"
        },
        "localListing": "blacklist"
    }

    result = calculate_phishing(data)

    assert result["valid"] is True
    assert result["ph3_blacklist"] == 1