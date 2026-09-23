from reporting.str_generator import generate_str


def test_str_generated_for_high_risk():

    final_result = {
        "final_score": 72.5,
        "risk_level": "High",
        "recommended_action": [
            "Immediate hold of the transaction"
        ]
    }

    adaptive_result = {
        "valid": True,
        "adaptive_friction_score": 70
    }

    fund_flow_result = {
        "valid": True,
        "fund_flow_score": 75
    }

    phishing_result = {
        "valid": True,
        "phishing_score": 72
    }

    explanation = {
        "risk_level": "High",
        "summary": "High-risk transaction detected.",
        "signals": [
            "Device fingerprint change detected."
        ]
    }

    result = generate_str(
        transaction_id="TXN-TEST-001",
        final_result=final_result,
        adaptive_result=adaptive_result,
        fund_flow_result=fund_flow_result,
        phishing_result=phishing_result,
        explanation=explanation
    )

    assert result["generated"] is True
    assert result["report_type"] == "Suspicious Transaction Report"
    assert result["risk_assessment"]["consolidated_risk_score"] == 72.5
    assert result["risk_assessment"]["risk_level"] == "High"
    assert result["transaction_summary"]["transaction_id"] == "TXN-TEST-001"


def test_str_not_generated_for_medium_risk():

    final_result = {
        "final_score": 54.39,
        "risk_level": "Medium",
        "recommended_action": [
            "Analyst-level review"
        ]
    }

    result = generate_str(
        transaction_id="TXN-TEST-002",
        final_result=final_result,
        adaptive_result={},
        fund_flow_result={},
        phishing_result={},
        explanation={}
    )

    assert result["generated"] is False
    assert result["risk_level"] == "Medium"