def calculate_final_score(adaptive_score, fund_flow_score, phishing_score):

    final_score = (
        adaptive_score * 0.45
        + fund_flow_score * 0.35
        + phishing_score * 0.20
    )

    # Determine risk level
    if final_score <= 20:
        risk_level = "Very Low"
    elif final_score <= 40:
        risk_level = "Low"
    elif final_score <= 60:
        risk_level = "Medium"
    elif final_score <= 80:
        risk_level = "High"
    else:
        risk_level = "Critical"

    return {
        "final_score": round(final_score, 2),
        "risk_level": risk_level
    }