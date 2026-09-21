from fastapi import FastAPI
from scoring.adaptive_friction import calculate_adaptive_friction
from scoring.fund_flow import calculate_fund_flow
from scoring.phishing import calculate_phishing
from scoring.final_score import calculate_final_score
from data_loader import get_transaction
from scoring.explanation import generate_explanation
app = FastAPI(title="Fraud Detection Engine")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "Fraud engine is running"
    }


@app.post("/analyze")
def analyze_transaction(data: dict):

    # -----------------------------
    # 1. Calculate Adaptive Friction
    # -----------------------------
    adaptive_result = calculate_adaptive_friction(
        data.get("adaptive_friction", {})
    )

    # -----------------------------
    # 2. Calculate Fund Flow
    # -----------------------------
    fund_flow_result = calculate_fund_flow(
        data.get("fund_flow", {})
    )

    # -----------------------------
    # 3. Calculate Phishing
    # -----------------------------
    phishing_result = calculate_phishing(
        data.get("phishing", {})
    )

    # -----------------------------
    # 4. Check validation
    # -----------------------------
    validation_errors = []

    if not adaptive_result["valid"]:
        validation_errors.append({
            "component": "Adaptive Friction",
            "reason": adaptive_result["reason"],
            "missing_fields": adaptive_result["missing_fields"]
        })

    if not fund_flow_result["valid"]:
        validation_errors.append({
            "component": "Fund Flow",
            "reason": fund_flow_result["reason"],
            "missing_fields": fund_flow_result["missing_fields"]
        })

    if not phishing_result["valid"]:
        validation_errors.append({
            "component": "Phishing",
            "reason": phishing_result["reason"],
            "missing_fields": phishing_result["missing_fields"]
        })

    # -----------------------------
    # 5. Reject invalid transaction
    # -----------------------------
    if validation_errors:

        return {
            "valid": False,
            "message": "Transaction could not be analyzed",
            "validation_errors": validation_errors
        }

    # -----------------------------
    # 6. Calculate final score
    # -----------------------------
    final_result = calculate_final_score(
        adaptive_result["adaptive_friction_score"],
        fund_flow_result["fund_flow_score"],
        phishing_result["phishing_score"]
    )

    # -----------------------------
    # 7. Return complete result
    # -----------------------------
    return {
        "valid": True,
        "adaptive_friction": adaptive_result,
        "fund_flow": fund_flow_result,
        "phishing": phishing_result,
        "final_result": final_result
    }
@app.get("/analyze/{transaction_id}")
def analyze_real_transaction(transaction_id: str):

    table_path = "data/table1"

    transaction = get_transaction(
        table_path,
        transaction_id
    )

    if not transaction["adaptive_friction"]:
        return {
            "valid": False,
            "message": "Transaction not found"
        }

    adaptive_result = calculate_adaptive_friction(
        transaction["adaptive_friction"]
    )

    fund_flow_result = calculate_fund_flow(
        transaction["fund_flow"]
        if transaction["fund_flow"]
        else {}
    )

    phishing_result = calculate_phishing(
        transaction["phishing"]
        if transaction["phishing"]
        else {}
    )

    validation_errors = []

    for name, result in [
        ("Adaptive Friction", adaptive_result),
        ("Fund Flow", fund_flow_result),
        ("Phishing", phishing_result)
    ]:
        if not result["valid"]:
            validation_errors.append({
                "component": name,
                "reason": result["reason"],
                "missing_fields": result["missing_fields"]
            })

    if validation_errors:
        return {
            "valid": False,
            "transaction_id": transaction_id,
            "validation_errors": validation_errors
        }

    final_result = calculate_final_score(
        adaptive_result["adaptive_friction_score"],
        fund_flow_result["fund_flow_score"],
        phishing_result["phishing_score"]
    )
    explanation = generate_explanation(
    adaptive_result,
    fund_flow_result,
    phishing_result,
    final_result
    )
    return {

    "valid": True,

    "transaction_id": transaction_id,

    "adaptive_friction": adaptive_result,

    "fund_flow": fund_flow_result,

    "phishing": phishing_result,

    "final_result": final_result,

    "explanation": explanation

}