from datetime import datetime, timezone


def generate_str(
    transaction_id,
    final_result,
    adaptive_result,
    fund_flow_result,
    phishing_result,
    explanation,
    transaction_data=None,
    evidence=None
):
    """
    Generate a structured Suspicious Transaction Report (STR).

    This function prepares the STR data.
    PDF/HTML generation can be added separately.
    """

    transaction_data = transaction_data or {}
    evidence = evidence or {}

    risk_level = final_result.get("risk_level")
    final_score = final_result.get("final_score")

    # STR generation is required for High and Critical transactions.
    if risk_level not in {"High", "Critical"}:
        return {
            "generated": False,
            "reason": (
                "STR generation is only required for "
                "High and Critical risk levels."
            ),
            "risk_level": risk_level,
            "final_score": final_score
        }

    report_id = (
    f"STR-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"
)

    # ============================================================
    # REPORT HEADER
    # ============================================================

    report_header = {
        "reporting_institution": "Unified Fraud Detection Engine",
        "report_id": report_id,
        "date_of_report": datetime.now(timezone.utc).strftime(
    "%Y-%m-%d %H:%M:%S UTC"
),
        "prepared_by": "Fraud Detection Engine",
        "contact": ""
    }

    # ============================================================
    # TRANSACTION SUMMARY
    # ============================================================

    transaction_summary = {
        "transaction_id": transaction_id,
        "transaction_date_time": transaction_data.get(
            "transaction_date_time"
        ),
        "channel": transaction_data.get("channel"),
        "amount": transaction_data.get("amount"),
        "currency": transaction_data.get("currency"),
        "geolocation": transaction_data.get("geolocation"),
        "device_fingerprint": transaction_data.get(
            "device_fingerprint"
        ),
        "merchant": transaction_data.get("merchant"),
        "merchant_category": transaction_data.get(
            "merchant_category"
        ),
        "beneficiary": transaction_data.get("beneficiary")
    }

    # ============================================================
    # RISK ASSESSMENT
    # ============================================================

    risk_assessment = {
        "adaptive_friction": {
            "sub_score": adaptive_result.get(
                "adaptive_friction_score"
            ),
            "weight": 45,
            "result": adaptive_result
        },
        "fund_flow": {
            "sub_score": fund_flow_result.get(
                "fund_flow_score"
            ),
            "weight": 35,
            "result": fund_flow_result
        },
        "phishing": {
            "sub_score": phishing_result.get(
                "phishing_score"
            ),
            "weight": 20,
            "result": phishing_result
        },
        "consolidated_risk_score": final_score,
        "risk_level": risk_level,
        "recommended_action": final_result.get(
            "recommended_action"
        )
    }

    # ============================================================
    # SUPPORTING EVIDENCE
    # ============================================================

    supporting_evidence = {
        "adaptive_friction": evidence.get(
            "adaptive_friction"
        ),
        "fund_flow": evidence.get(
            "fund_flow"
        ),
        "phishing": evidence.get(
            "phishing"
        ),
        "ocr": evidence.get(
            "ocr"
        )
    }

    # ============================================================
    # ANALYST REVIEW & SIGN-OFF
    # ============================================================

    analyst_review = {
        "analyst_name": "",
        "analyst_id": "",
        "review_date_time": "",
        "electronic_signature": ""
    }

    # ============================================================
    # COMPLETE STR
    # ============================================================

    return {
        "generated": True,
        "report_type": "Suspicious Transaction Report",
        "report_header": report_header,
        "transaction_summary": transaction_summary,
        "risk_assessment": risk_assessment,
        "supporting_evidence": supporting_evidence,
        "explanation": explanation,
        "analyst_review": analyst_review
    }