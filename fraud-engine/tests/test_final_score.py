from scoring.final_score import calculate_final_score


def test_very_low_risk():
    result = calculate_final_score(
        adaptive_score=10,
        fund_flow_score=10,
        phishing_score=10
    )

    assert result["final_score"] == 10
    assert result["risk_level"] == "Very Low"
    assert "recommended_action" in result


def test_medium_risk():
    result = calculate_final_score(
        adaptive_score=50,
        fund_flow_score=50,
        phishing_score=50
    )

    assert result["final_score"] == 50
    assert result["risk_level"] == "Medium"


def test_critical_risk():
    result = calculate_final_score(
        adaptive_score=100,
        fund_flow_score=100,
        phishing_score=100
    )

    assert result["final_score"] == 100
    assert result["risk_level"] == "Critical"