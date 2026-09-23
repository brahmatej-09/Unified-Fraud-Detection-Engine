from fastapi import FastAPI, File, UploadFile, Form

import shutil
import os
import logging

from logging_config import setup_logging
from reporting.str_generator import generate_str
from reporting.str_html import generate_str_html
from reporting.str_pdf import generate_str_pdf

setup_logging()

logger = logging.getLogger("fraud_engine")

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
                    "Only PDF, PNG, JPG and JPEG files are supported"
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
                    "Only PDF, PNG, JPG and JPEG files are supported"
            }

        # ====================================================
        # 2. Parse OCR text
        # ====================================================

        fund_flow = parse_fund_flow_text(
            text
        )

        # Calculate Fund Flow score for each OCR transaction
        fund_flow_results = []

        for record in fund_flow:

            result = calculate_fund_flow(record)

            fund_flow_results.append({
                "transaction": record,
                "analysis": result
            })

        # ====================================================
        # 4. Return result
        # ====================================================

        return {
            "success": True,
            "filename": file.filename,

            "fund_flow": fund_flow,

            "fund_flow_analysis":
                fund_flow_results,

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
    file: UploadFile = File(...)
):

    os.makedirs("temp", exist_ok=True)

    file_path = f"temp/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:

        # ====================================================
        # 1. OCR statement
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
                    "Only PDF, PNG, JPG and JPEG files are supported"
            }

        # ====================================================
        # 2. Parse Fund Flow from OCR
        # ====================================================

        ocr_fund_flow_list = parse_fund_flow_text(
            text
        )

        # Find the first transaction in the OCR results
        if not ocr_fund_flow_list:
            return {
                "valid": False,
                "message": "No transaction data found in the document.",
                "ocr_text": text
            }
            
        records = []
        
        for ocr_fund_flow in ocr_fund_flow_list:
            transaction_id = ocr_fund_flow.get("transactionId")
            
            if not transaction_id:
                records.append({
                    "valid": False,
                    "message": "Could not extract a Transaction ID from this record.",
                    "parsed_fund_flow": ocr_fund_flow
                })
                continue

            # ====================================================
            # 3. Load Adaptive + Phishing from database
            # ====================================================

            transaction = None
            found_table = None

            allowed_tables = ["table1", "table2", "table3", "table4", "table5", "table6"]

            best_incomplete_transaction = None
            best_incomplete_table = None

            for t_name in allowed_tables:
                table_path = f"data/{t_name}"
                txn = get_transaction(table_path, transaction_id)
                
                if txn and txn.get("adaptive_friction") and txn.get("phishing"):
                    af_res = calculate_adaptive_friction(txn.get("adaptive_friction"))
                    ph_res = calculate_phishing(txn.get("phishing"))
                    
                    if af_res.get("valid") and ph_res.get("valid"):
                        transaction = txn
                        found_table = t_name
                        break
                    elif best_incomplete_transaction is None:
                        best_incomplete_transaction = txn
                        best_incomplete_table = t_name
                elif txn and (txn.get("adaptive_friction") or txn.get("phishing")):
                    if best_incomplete_transaction is None:
                        best_incomplete_transaction = txn
                        best_incomplete_table = t_name

            if transaction is None and best_incomplete_transaction is not None:
                transaction = best_incomplete_transaction
                found_table = best_incomplete_table

            if transaction is None:
                transaction = {
                    "adaptive_friction": {},
                    "phishing": {}
                }

            # ====================================================
            # 4. Adaptive Friction
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
                    error = {
                        "component": name,
                        "reason": result["reason"]
                    }
                    if "missing_fields" in result:
                        error["missing_fields"] = result["missing_fields"]
                    if "invalid_fields" in result:
                        error["invalid_fields"] = result["invalid_fields"]
                    validation_errors.append(error)

            if validation_errors:
                records.append({
                    "valid": False,
                    "table": found_table,
                    "transaction_id": transaction_id,
                    "validation_errors": validation_errors,
                    "parsed_fund_flow": ocr_fund_flow
                })
                continue

            # ====================================================
            # 5. Final Fraud Score
            # ====================================================

            final_result = calculate_final_score(
                adaptive_result["adaptive_friction_score"],
                fund_flow_result["fund_flow_score"],
                phishing_result["phishing_score"]
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
            # Generate STR for High/Critical Risk
            # ====================================================
            
            str_data = None
            if final_result.get("risk_level") in {"High", "Critical"}:
                str_result = generate_str(
                    transaction_id=transaction_id,
                    final_result=final_result,
                    adaptive_result=adaptive_result,
                    fund_flow_result=fund_flow_result,
                    phishing_result=phishing_result,
                    explanation=explanation,
                    transaction_data={"transaction_id": transaction_id}
                )
                
                # We won't generate html/pdf here to save time, but we keep the JSON output
                str_data = str_result

            records.append({
                "valid": True,
                "table": found_table,
                "transaction_id": transaction_id,
                "source": "OCR + Dataset",
                "adaptive_friction": adaptive_result,
                "fund_flow": fund_flow_result,
                "phishing": phishing_result,
                "final_result": final_result,
                "explanation": explanation,
                "str": str_data,
                "parsed_fund_flow": ocr_fund_flow
            })

        return {
            "valid": True,
            "records": records,
            "extracted_text": text
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

    # Store all validation errors found in the
    # Adaptive Friction, Fund Flow and Phishing results.
    validation_errors = []

    # --------------------------------------------------------
    # Adaptive Friction validation
    # --------------------------------------------------------

    if not adaptive_result["valid"]:

        error = {
            "component": "Adaptive Friction",
            "reason": adaptive_result["reason"]
        }

        if "missing_fields" in adaptive_result:
            error["missing_fields"] = adaptive_result["missing_fields"]

        if "invalid_fields" in adaptive_result:
            error["invalid_fields"] = adaptive_result["invalid_fields"]

        validation_errors.append(error)

    # --------------------------------------------------------
    # Fund Flow validation
    # --------------------------------------------------------

    if not fund_flow_result["valid"]:

        error = {
            "component": "Fund Flow",
            "reason": fund_flow_result["reason"]
        }

        if "missing_fields" in fund_flow_result:
            error["missing_fields"] = fund_flow_result["missing_fields"]

        if "invalid_fields" in fund_flow_result:
            error["invalid_fields"] = fund_flow_result["invalid_fields"]

        validation_errors.append(error)

    # --------------------------------------------------------
    # Phishing validation
    # --------------------------------------------------------

    if not phishing_result["valid"]:

        error = {
            "component": "Phishing",
            "reason": phishing_result["reason"]
        }

        if "missing_fields" in phishing_result:
            error["missing_fields"] = phishing_result["missing_fields"]

        if "invalid_fields" in phishing_result:
            error["invalid_fields"] = phishing_result["invalid_fields"]

        validation_errors.append(error)

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
# REQUIRED RISK SCORE API
# ============================================================

@app.post("/risk-score")
def risk_score(data: dict):
    """
    Calculate the complete fraud risk score for a transaction.

    For High and Critical risk levels, an STR, HTML report,
    and PDF report are also generated.
    """

    logger.info("Risk score request received")

    result = analyze_transaction(data)

    if not result.get("valid", False):

        logger.warning(
            "Risk score request rejected | validation_errors=%s",
            result.get("validation_errors")
        )

        return result

    final_result = result.get(
        "final_result",
        {}
    )

    risk_level = final_result.get(
        "risk_level"
    )

    # Generate STR only for High and Critical transactions
    if risk_level in {"High", "Critical"}:

        str_result = generate_str(
            transaction_id=data.get("transaction_id"),
            final_result=final_result,
            adaptive_result=result.get(
                "adaptive_friction",
                {}
            ),
            fund_flow_result=result.get(
                "fund_flow",
                {}
            ),
            phishing_result=result.get(
                "phishing",
                {}
            ),
            explanation=result.get(
                "explanation",
                {}
            ),
            transaction_data=data
        )

        result["str"] = str_result

        # Generate HTML report for the STR
        html_result = generate_str_html(
            str_result,
            output_dir="reports"
        )

        result["str_html"] = html_result

        # Generate PDF report for the STR
        pdf_result = generate_str_pdf(
            str_result,
            output_dir="reports"
        )

        result["str_pdf"] = pdf_result

        logger.info(
            "STR generated | transaction_id=%s | risk_level=%s",
            data.get("transaction_id"),
            risk_level
        )

    return result


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
        ("Adaptive Friction", adaptive_result),
        ("Fund Flow", fund_flow_result),
        ("Phishing", phishing_result)
    ]:

        if not result["valid"]:

            error = {
                "component": name,
                "reason": result["reason"]
            }

            if "missing_fields" in result:
                error["missing_fields"] = result["missing_fields"]

            if "invalid_fields" in result:
                error["invalid_fields"] = result["invalid_fields"]

            validation_errors.append(error)

    # ========================================================
    # 5. Reject invalid transaction
    # ========================================================

    if validation_errors:

        logger.warning(
            "Transaction rejected | table=%s | transaction_id=%s | validation_errors=%s",
            table_name,
            transaction_id,
            validation_errors
        )

        return {
            "valid": False,
            "table": table_name,
            "transaction_id": transaction_id,
            "validation_errors": validation_errors
        }

    # ========================================================
    # 6. Final Fraud Score
    # ========================================================

    final_result = calculate_final_score(
        adaptive_result["adaptive_friction_score"],
        fund_flow_result["fund_flow_score"],
        phishing_result["phishing_score"]
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
    # 8. Generate STR for High and Critical transactions
    # ========================================================

    str_result = None
    str_html_result = None
    str_pdf_result = None

    if final_result["risk_level"] in {"High", "Critical"}:

        # Use only information actually present in the company dataset.
        # Fields not supplied by the dataset remain None.
        transaction_data = {
            "transaction_date_time": None,
            "channel": None,
            "amount": transaction["adaptive_friction"]["liveTransaction"].get("amount"),
            "currency": transaction["adaptive_friction"]["liveTransaction"].get("currency"),
            "geolocation": None,
            "device_fingerprint": transaction["adaptive_friction"]["liveTransaction"].get(
                "deviceFingerprint"
            ),
            "merchant": None,
            "merchant_category": None,
            "beneficiary": None
        }

        # Preserve the original company records as STR evidence.
        evidence = {
            "adaptive_friction": transaction["adaptive_friction"],
            "fund_flow": transaction["fund_flow"],
            "phishing": transaction["phishing"]
        }

        str_result = generate_str(
            transaction_id=transaction_id,
            final_result=final_result,
            adaptive_result=adaptive_result,
            fund_flow_result=fund_flow_result,
            phishing_result=phishing_result,
            explanation=explanation,
            transaction_data=transaction_data,
            evidence=evidence
        )

        # Generate HTML STR report
        str_html_result = generate_str_html(
            str_result,
            output_dir="reports"
        )

        # Generate PDF STR report
        str_pdf_result = generate_str_pdf(
            str_result,
            output_dir="reports"
        )

        logger.info(
            "STR generated | table=%s | transaction_id=%s | risk_level=%s",
            table_name,
            transaction_id,
            final_result["risk_level"]
        )

    # ========================================================
    # 9. Final Response
    # ========================================================

    return {
        "valid": True,
        "table": table_name,
        "transaction_id": transaction_id,

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

        "str":
            str_result,

        "str_html":
            str_html_result,

        "str_pdf":
            str_pdf_result
    }