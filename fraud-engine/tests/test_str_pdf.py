from reporting.str_pdf import generate_str_pdf


def test_generate_str_pdf(tmp_path):

    str_data = {
        "generated": True,

        "report_header": {
            "reporting_institution": "Unified Fraud Detection Engine",
            "report_id": "STR-PDF-TEST-001",
            "date_of_report": "2026-09-23 05:00:00 UTC",
            "prepared_by": "Fraud Detection Engine",
            "contact": ""
        },

        "transaction_summary": {
            "transaction_id": "TEST-STR-001",
            "transaction_date_time": None,
            "channel": None,
            "amount": None,
            "currency": None,
            "geolocation": None,
            "device_fingerprint": None,
            "merchant": None,
            "merchant_category": None,
            "beneficiary": None
        },

        "risk_assessment": {
            "adaptive_friction": {
                "sub_score": 100,
                "weight": 45
            },
            "fund_flow": {
                "sub_score": 100,
                "weight": 35
            },
            "phishing": {
                "sub_score": 0,
                "weight": 20
            },
            "consolidated_risk_score": 80,
            "risk_level": "High",
            "recommended_action": [
                "Immediate hold of the transaction",
                "Customer outreach for verification",
                "Analyst investigation",
                "Generate a draft STR",
                "Escalate to Admin for final sign-off"
            ]
        },

        "supporting_evidence": {
            "adaptive_friction": None,
            "fund_flow": None,
            "phishing": None,
            "ocr": None
        },

        "explanation": {
            "summary": (
                "AF1 - Device fingerprint change = 1. "
                "The current device fingerprint differs from the stored profile, "
                "which contributes to transaction risk."
            ),
            "triggered_signals": [
                {
                    "reason": (
                        "AF1 - Device fingerprint change = 1. "
                        "The current device fingerprint differs from the stored profile."
                    )
                },
                {
                    "reason": (
                        "AF2 - Distance risk factor = 1.0000. "
                        "The transaction distance is significantly high."
                    )
                }
            ]
        },

        "analyst_review": {
            "analyst_name": "",
            "analyst_id": "",
            "review_date_time": "",
            "electronic_signature": ""
        }
    }

    result = generate_str_pdf(
        str_data,
        output_dir=str(tmp_path)
    )

    assert result["generated"] is True

    pdf_path = tmp_path / "STR-PDF-TEST-001.pdf"

    assert pdf_path.exists()
    assert pdf_path.stat().st_size > 0