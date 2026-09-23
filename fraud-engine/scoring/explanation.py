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
            "AF1 - Device fingerprint change = 1. "
            "The current device fingerprint differs from the stored profile, "
            "which contributes to transaction risk."
        )

    if adaptive_result["af2_distance"] > 0.5:
        reasons.append(
            f"AF2 - Distance risk factor = {adaptive_result['af2_distance']:.4f}. "
            "The transaction distance is significantly high and contributes to risk."
        )

    if adaptive_result["af3_amount"] > 0.5:
        reasons.append(
            f"AF3 - Amount risk factor = {adaptive_result['af3_amount']:.4f}. "
            "The transaction amount is significantly higher than the historical average "
            "and contributes to risk."
        )

    # Fund Flow
    if fund_flow_result["ff1_activity_balance"] < 0.5:
        reasons.append(
            f"FF1 - Activity balance factor = {fund_flow_result['ff1_activity_balance']:.4f}. "
            "The incoming and outgoing fund-flow activity is imbalanced, "
            "which contributes to risk."
        )

    if fund_flow_result["ff2_remaining_balance"] > 0.7:
        reasons.append(
            f"FF2 - Remaining balance factor = {fund_flow_result['ff2_remaining_balance']:.4f}. "
            "A large portion of funds has been transferred out, leaving a low retained balance."
        )

    if fund_flow_result["ff3_holding_time"] > 0.5:
        reasons.append(
            f"FF3 - Holding-time risk factor = {fund_flow_result['ff3_holding_time']:.4f}. "
            "Funds were held for a relatively short period, which contributes to risk."
        )

    # Phishing
    if phishing_result["ph1_domain_age"] > 0.5:
        reasons.append(
            f"PH1 - Domain-age risk factor = {phishing_result['ph1_domain_age']:.4f}. "
            "The domain is relatively young and contributes to phishing risk."
        )

    if phishing_result["ph2_certificate"] == 1:
        reasons.append(
            f"PH2 - Certificate risk factor = {phishing_result['ph2_certificate']}. "
            "The website certificate has a high-risk characteristic."
        )

    if phishing_result["ph3_blacklist"] == 1:
        reasons.append(
            f"PH3 - Blacklist risk factor = {phishing_result['ph3_blacklist']}. "
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