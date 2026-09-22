from fastapi import FastAPI, UploadFile, File, Form

import shutil
import os

from ocr.fund_flow_parser import parse_fund_flow_text

from ocr.ocr_service import (
    extract_text_from_image,
    extract_text_from_pdf
)

from scoring.adaptive_friction import calculate_adaptive_friction
from scoring.fund_flow import calculate_fund_flow
from scoring.phishing import calculate_phishing
from scoring.final_score import calculate_final_score
from scoring.explanation import generate_explanation

from data_loader import get_transaction


app = FastAPI(title="Fraud Detection Engine")


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    return {
        "status": "ok",
        "message": "Fraud engine is running"
    }


# ============================================================
# BASIC OCR
# ============================================================

@app.post("/ocr")
async def process_ocr(file: UploadFile = File(...)):

    os.makedirs("temp", exist_ok=True)

    file_path = f"temp/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:

        filename = file.filename.lower()

        # -----------------------------
        # PDF
        # -----------------------------

        if filename.endswith(".pdf"):

            text = extract_text_from_pdf(
                file_path
            )

        # -----------------------------
        # Image
        # -----------------------------

        elif filename.endswith(
            (".png", ".jpg", ".jpeg")
        ):

            text = extract_text_from_image(
                file_path
            )

        else:

            return {
                "success": False,
                "message":
                    "Only pdf, png, jpg and jpeg files are supported"
            }

        return {
            "success": True,
            "filename": file.filename,
            "text": text
        }

    finally:

        if os.path.exists(file_path):
            os.remove(file_path)


# ============================================================
# OCR → FUND FLOW ANALYSIS
# ============================================================

@app.post("/ocr/fund-flow")
async def process_fund_flow_ocr(
    file: UploadFile = File(...)
):

    os.makedirs("temp", exist_ok=True)

    file_path = f"temp/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:

        filename = file.filename.lower()

        # ====================================================
        # 1. OCR
        # ====================================================

        if filename.endswith(".pdf"):

            text = extract_text_from_pdf(
                file_path
            )

        elif filename.endswith(
            (".png", ".jpg", ".jpeg")
        ):

            text = extract_text_from_image(
                file_path
            )

        else:

            return {
                "success": False,
                "message":
                    "Only pdf, png, jpg and jpeg files are supported"
            }

        # ====================================================
        # 2. Parse OCR text
        # ====================================================

        fund_flow = parse_fund_flow_text(
            text
        )

        # ====================================================
        # 3. Calculate Fund Flow score
        # ====================================================

        fund_flow_result = calculate_fund_flow(
            fund_flow
        )

        # ====================================================
        # 4. Return result
        # ====================================================

        return {
            "success": True,
            "filename": file.filename,
            "fund_flow": fund_flow,
            "fund_flow_analysis": fund_flow_result,
            "ocr_text": text
        }

    finally:

        if os.path.exists(file_path):
            os.remove(file_path)


# ============================================================
# OCR → COMPLETE FRAUD ANALYSIS
# ============================================================

@app.post("/ocr/analyze")
async def analyze_ocr_transaction(

    file: UploadFile = File(...),

    transaction_id: str = Form(""),

    table_name: str = Form("table1")

):

    os.makedirs("temp", exist_ok=True)

    file_path = f"temp/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:

        # ====================================================
        # 1. Validate table
        # ====================================================

        allowed_tables = {
            "table1",
            "table2",
            "table3",
            "table4",
            "table5",
            "table6"
        }

        if table_name not in allowed_tables:

            return {
                "valid": False,
                "message": "Invalid table name"
            }

        if not transaction_id:

            return {
                "valid": False,
                "message": "Transaction ID is required"
            }

        # ====================================================
        # 2. OCR statement
        # ====================================================

        filename = file.filename.lower()

        if filename.endswith(".pdf"):

            text = extract_text_from_pdf(
                file_path
            )

        elif filename.endswith(
            (".png", ".jpg", ".jpeg")
        ):

            text = extract_text_from_image(
                file_path
            )

        else:

            return {
                "valid": False,
                "message":
                    "Only pdf, png, jpg and jpeg files are supported"
            }

        # ====================================================
        # 3. Parse Fund Flow from OCR
        #    IMPORTANT:
        #    Pass transaction_id so the parser extracts
        #    the correct record from the statement.
        # ====================================================

        ocr_fund_flow = parse_fund_flow_text(
            text,
            transaction_id
        )

        # ====================================================
        # 4. Load Adaptive + Phishing
        #    from selected dataset
        # ====================================================

        table_path = f"data/{table_name}"

        transaction = get_transaction(
            table_path,
            transaction_id
        )

        if not transaction["adaptive_friction"]:

            return {
                "valid": False,
                "message": "Transaction not found",
                "table": table_name,
                "transaction_id": transaction_id
            }

        # ====================================================
        # 5. Adaptive Friction
        # ====================================================

        adaptive_result = calculate_adaptive_friction(
            transaction["adaptive_friction"]
        )

        # ====================================================
        # 6. Fund Flow from OCR
        # ====================================================

        fund_flow_result = calculate_fund_flow(
            ocr_fund_flow
        )

        # ====================================================
        # 7. Phishing
        # ====================================================

        phishing_result = calculate_phishing(
            transaction["phishing"]
            if transaction["phishing"]
            else {}
        )

        # ====================================================
        # 8. Validation
        # ====================================================

        validation_errors = []

        for name, result in [
            ("Adaptive Friction", adaptive_result),
            ("Fund Flow OCR", fund_flow_result),
            ("Phishing", phishing_result)
        ]:

            if not result["valid"]:

                validation_errors.append({
                    "component": name,
                    "reason": result["reason"],
                    "missing_fields":
                        result["missing_fields"]
                })

        if validation_errors:

            return {
                "valid": False,
                "table": table_name,
                "transaction_id": transaction_id,
                "validation_errors":
                    validation_errors,
                "ocr_text": text,
                "parsed_fund_flow":
                    ocr_fund_flow
            }

        # ====================================================
        # 9. Final Fraud Score
        # ====================================================

        final_result = calculate_final_score(

            adaptive_result[
                "adaptive_friction_score"
            ],

            fund_flow_result[
                "fund_flow_score"
            ],

            phishing_result[
                "phishing_score"
            ]
        )

        # ====================================================
        # 10. Explanation
        # ====================================================

        explanation = generate_explanation(

            adaptive_result,

            fund_flow_result,

            phishing_result,

            final_result
        )

        # ====================================================
        # 11. Return complete analysis
        # ====================================================

        return {

            "valid": True,

            "table":
                table_name,

            "transaction_id":
                transaction_id,

            "source":
                "OCR + Dataset",

            "adaptive_friction":
                adaptive_result,

            "fund_flow":
                fund_flow_result,

            "phishing":
                phishing_result,

            "final_result":
                final_result,

            "explanation":
                explanation,

            "ocr": {
                "filename":
                    file.filename,

                "parsed_fund_flow":
                    ocr_fund_flow,

                "text":
                    text
            }
        }

    finally:

        if os.path.exists(file_path):
            os.remove(file_path)


# ============================================================
# ANALYZE DATA SENT DIRECTLY TO PYTHON
# ============================================================

@app.post("/analyze")
def analyze_transaction(data: dict):

    # ========================================================
    # 1. Adaptive Friction
    # ========================================================

    adaptive_result = calculate_adaptive_friction(
        data.get("adaptive_friction", {})
    )

    # ========================================================
    # 2. Fund Flow
    # ========================================================

    fund_flow_result = calculate_fund_flow(
        data.get("fund_flow", {})
    )

    # ========================================================
    # 3. Phishing
    # ========================================================

    phishing_result = calculate_phishing(
        data.get("phishing", {})
    )

    # ========================================================
    # 4. Validation
    # ========================================================

    validation_errors = []

    if not adaptive_result["valid"]:

        validation_errors.append({
            "component": "Adaptive Friction",
            "reason": adaptive_result["reason"],
            "missing_fields":
                adaptive_result["missing_fields"]
        })

    if not fund_flow_result["valid"]:

        validation_errors.append({
            "component": "Fund Flow",
            "reason": fund_flow_result["reason"],
            "missing_fields":
                fund_flow_result["missing_fields"]
        })

    if not phishing_result["valid"]:

        validation_errors.append({
            "component": "Phishing",
            "reason": phishing_result["reason"],
            "missing_fields":
                phishing_result["missing_fields"]
        })

    # ========================================================
    # 5. Reject invalid transaction
    # ========================================================

    if validation_errors:

        return {
            "valid": False,
            "message":
                "Transaction could not be analyzed",
            "validation_errors":
                validation_errors
        }

    # ========================================================
    # 6. Final Fraud Score
    # ========================================================

    final_result = calculate_final_score(

        adaptive_result[
            "adaptive_friction_score"
        ],

        fund_flow_result[
            "fund_flow_score"
        ],

        phishing_result[
            "phishing_score"
        ]
    )

    # ========================================================
    # 7. Explanation
    # ========================================================

    explanation = generate_explanation(

        adaptive_result,

        fund_flow_result,

        phishing_result,

        final_result
    )

    # ========================================================
    # 8. Return complete result
    # ========================================================

    return {

        "valid": True,

        "adaptive_friction":
            adaptive_result,

        "fund_flow":
            fund_flow_result,

        "phishing":
            phishing_result,

        "final_result":
            final_result,

        "explanation":
            explanation
    }


# ============================================================
# ANALYZE TRANSACTION FROM A SPECIFIC DATASET TABLE
# ============================================================

@app.get(
    "/analyze/{table_name}/{transaction_id}"
)
def analyze_real_transaction(
    table_name: str,
    transaction_id: str
):

    # ========================================================
    # Allowed datasets
    # ========================================================

    allowed_tables = {
        "table1",
        "table2",
        "table3",
        "table4",
        "table5",
        "table6"
    }

    if table_name not in allowed_tables:

        return {
            "valid": False,
            "message":
                "Invalid table name"
        }

    # ========================================================
    # Dataset path
    # ========================================================

    table_path = f"data/{table_name}"

    # ========================================================
    # Load transaction
    # ========================================================

    transaction = get_transaction(
        table_path,
        transaction_id
    )

    # ========================================================
    # Check transaction
    # ========================================================

    if not transaction[
        "adaptive_friction"
    ]:

        return {

            "valid": False,

            "table":
                table_name,

            "transaction_id":
                transaction_id,

            "message":
                "Transaction not found"
        }

    # ========================================================
    # 1. Adaptive Friction
    # ========================================================

    adaptive_result = calculate_adaptive_friction(

        transaction[
            "adaptive_friction"
        ]
    )

    # ========================================================
    # 2. Fund Flow
    # ========================================================

    fund_flow_result = calculate_fund_flow(

        transaction[
            "fund_flow"
        ]
        if transaction["fund_flow"]
        else {}
    )

    # ========================================================
    # 3. Phishing
    # ========================================================

    phishing_result = calculate_phishing(

        transaction[
            "phishing"
        ]
        if transaction["phishing"]
        else {}
    )

    # ========================================================
    # 4. Validation
    # ========================================================

    validation_errors = []

    for name, result in [

        (
            "Adaptive Friction",
            adaptive_result
        ),

        (
            "Fund Flow",
            fund_flow_result
        ),

        (
            "Phishing",
            phishing_result
        )

    ]:

        if not result["valid"]:

            validation_errors.append({

                "component": name,

                "reason":
                    result["reason"],

                "missing_fields":
                    result["missing_fields"]
            })

    # ========================================================
    # 5. Reject invalid transaction
    # ========================================================

    if validation_errors:

        return {

            "valid": False,

            "table":
                table_name,

            "transaction_id":
                transaction_id,

            "validation_errors":
                validation_errors
        }

    # ========================================================
    # 6. Final Fraud Score
    # ========================================================

    final_result = calculate_final_score(

        adaptive_result[
            "adaptive_friction_score"
        ],

        fund_flow_result[
            "fund_flow_score"
        ],

        phishing_result[
            "phishing_score"
        ]
    )

    # ========================================================
    # 7. Explanation
    # ========================================================

    explanation = generate_explanation(

        adaptive_result,

        fund_flow_result,

        phishing_result,

        final_result
    )

    # ========================================================
    # 8. Final Response
    # ========================================================

    return {

        "valid": True,

        "table":
            table_name,

        "transaction_id":
            transaction_id,

        "adaptive_friction":
            adaptive_result,

        "fund_flow":
            fund_flow_result,

        "phishing":
            phishing_result,

        "final_result":
            final_result,

        "explanation":
            explanation
    }