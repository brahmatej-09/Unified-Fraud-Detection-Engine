def generate_explanation(
    adaptive_result,
    fund_flow_result,
    phishing_result,
    final_result
):

    reasons = []

    # Adaptive Friction
    if adaptive_result["af1_device_change"] == 1:
        reasons.append(
            "Device fingerprint changed from the stored profile."
        )

    if adaptive_result["af2_distance"] > 0.5:
        reasons.append(
            "Transaction distance is significantly high."
        )

    if adaptive_result["af3_amount"] > 0.5:
        reasons.append(
            "Transaction amount is significantly higher than the historical average."
        )

    # Fund Flow
    if fund_flow_result["ff1_activity_balance"] < 0.5:
        reasons.append(
            "Fund flow shows an imbalance between incoming and outgoing activity."
        )

    if fund_flow_result["ff2_remaining_balance"] > 0.7:
        reasons.append(
            "A large portion of funds has been transferred out, leaving a low retained balance."
        )

    if fund_flow_result["ff3_holding_time"] > 0.5:
        reasons.append(
            "Funds were held for a relatively short period."
        )

    # Phishing
    if phishing_result["ph1_domain_age"] > 0.5:
        reasons.append(
            "The domain is relatively young."
        )

    if phishing_result["ph2_certificate"] == 1:
        reasons.append(
            "The website certificate has a high-risk characteristic."
        )

    if phishing_result["ph3_blacklist"] == 1:
        reasons.append(
            "The domain appears on the local blacklist."
        )

    if not reasons:
        reasons.append(
            "No major risk signals were triggered."
        )

    return {
        "risk_level": final_result["risk_level"],
        "summary": " ".join(reasons),
        "signals": reasons
    }