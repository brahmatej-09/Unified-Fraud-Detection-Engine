import os
import yaml


def load_risk_bands():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(base_dir, "risk_bands.yaml")

    with open(config_path, "r", encoding="utf-8") as file:
        config = yaml.safe_load(file)

    return config["risk_bands"]


def calculate_final_score(adaptive_score, fund_flow_score, phishing_score):
    final_score = (
        adaptive_score * 0.45
        + fund_flow_score * 0.35
        + phishing_score * 0.20
    )

    final_score = round(final_score, 2)

    risk_bands = load_risk_bands()

    risk_band = None

    for band in risk_bands:
        if band["min_score"] <= final_score <= band["max_score"]:
            risk_band = band
            break

    if risk_band is None:
        raise ValueError(
            f"No risk band configured for score {final_score}"
        )

    return {
        "final_score": final_score,
        "risk_level": risk_band["name"],
        "recommended_action": risk_band["recommended_action"]
    }