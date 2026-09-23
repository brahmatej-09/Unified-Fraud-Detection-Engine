from reporting.str_generator import generate_str
from reporting.str_html import generate_str_html


def test_generate_str_html(tmp_path):

    final_result = {
        "final_score": 80,
        "risk_level": "High",
        "recommended_action": [
            "Immediate hold of the transaction",
            "Generate a draft STR"
        ]
    }

    adaptive_result = {
        "valid": True,
        "adaptive_friction_score": 100
    }

    fund_flow_result = {
        "valid": True,
        "fund_flow_score": 100
    }

    phishing_result = {
        "valid": True,
        "phishing_score": 0
    }

    explanation = {
        "risk_level": "High",
        "summary": "Test high-risk transaction.",
        "signals": [
            "AF1 - Device fingerprint change = 1."
        ]
    }

    str_data = generate_str(
        transaction_id="TEST-STR-001",
        final_result=final_result,
        adaptive_result=adaptive_result,
        fund_flow_result=fund_flow_result,
        phishing_result=phishing_result,
        explanation=explanation
    )

    result = generate_str_html(
        str_data,
        output_dir=str(tmp_path)
    )

    assert result["generated"] is True

    html_file = tmp_path / f'{str_data["report_header"]["report_id"]}.html'

    assert html_file.exists()

    content = html_file.read_text(encoding="utf-8")

    assert "Suspicious Transaction Report" in content
    assert "TEST-STR-001" in content
    assert "80" in content
    assert "High" in content
    assert "Adaptive Friction" in content
    assert "Fund Flow" in content
    assert "Phishing" in content