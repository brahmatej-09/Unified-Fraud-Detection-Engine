import html
import json
import os


def _safe(value):
    """Convert a value to safe HTML text."""
    if value is None:
        return "Not provided"

    if isinstance(value, (dict, list)):
        return html.escape(
            json.dumps(value, indent=2, default=str)
        ).replace("\n", "<br>")

    return html.escape(str(value))


def generate_str_html(str_data, output_dir="reports"):
    """
    Generate an HTML Suspicious Transaction Report from
    the structured STR data produced by generate_str().
    """

    if not str_data.get("generated", False):
        return {
            "generated": False,
            "reason": str_data.get(
                "reason",
                "STR was not generated."
            )
        }

    os.makedirs(output_dir, exist_ok=True)

    header = str_data.get("report_header", {})
    transaction = str_data.get("transaction_summary", {})
    risk = str_data.get("risk_assessment", {})
    evidence = str_data.get("supporting_evidence", {})
    explanation = str_data.get("explanation", {})
    analyst = str_data.get("analyst_review", {})

    report_id = header.get("report_id", "STR-UNKNOWN")

    file_path = os.path.join(
        output_dir,
        f"{report_id}.html"
    )

    recommended_actions = risk.get(
        "recommended_action", []
    )

    signals = explanation.get("signals", [])

    actions_html = "".join(
        f"<li>{_safe(action)}</li>"
        for action in recommended_actions
    )

    signals_html = "".join(
        f"<li>{_safe(signal)}</li>"
        for signal in signals
    )

    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>
        Suspicious Transaction Report - {_safe(report_id)}
    </title>

    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #222;
            line-height: 1.5;
        }}

        h1 {{
            text-align: center;
            margin-bottom: 5px;
        }}

        h2 {{
            border-bottom: 2px solid #333;
            padding-bottom: 6px;
            margin-top: 35px;
        }}

        .subtitle {{
            text-align: center;
            margin-bottom: 30px;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }}

        th, td {{
            border: 1px solid #ccc;
            padding: 9px;
            text-align: left;
            vertical-align: top;
        }}

        th {{
            font-weight: bold;
        }}

        .risk {{
            font-size: 22px;
            font-weight: bold;
        }}

        .score {{
            font-size: 28px;
            font-weight: bold;
        }}

        ul {{
            margin-top: 8px;
        }}

        .explanation {{
            padding: 12px;
            border: 1px solid #ccc;
            margin-top: 10px;
        }}

        .signature {{
            height: 60px;
        }}

        .footer {{
            margin-top: 40px;
            font-size: 12px;
            text-align: center;
        }}

        @media print {{
            body {{
                margin: 20px;
            }}
        }}
    </style>
</head>

<body>

    <h1>Suspicious Transaction Report</h1>

    <div class="subtitle">
        Unified Fraud Detection Engine
    </div>


    <h2>1. Report Header</h2>

    <table>
        <tr>
            <th>Reporting Institution</th>
            <td>{_safe(header.get("reporting_institution"))}</td>
        </tr>

        <tr>
            <th>Report ID</th>
            <td>{_safe(header.get("report_id"))}</td>
        </tr>

        <tr>
            <th>Date of Report</th>
            <td>{_safe(header.get("date_of_report"))}</td>
        </tr>

        <tr>
            <th>Prepared By</th>
            <td>{_safe(header.get("prepared_by"))}</td>
        </tr>

        <tr>
            <th>Contact</th>
            <td>{_safe(header.get("contact"))}</td>
        </tr>
    </table>


    <h2>2. Transaction Summary</h2>

    <table>
        <tr>
            <th>Transaction ID</th>
            <td>{_safe(transaction.get("transaction_id"))}</td>
        </tr>

        <tr>
            <th>Date / Time</th>
            <td>{_safe(transaction.get("transaction_date_time"))}</td>
        </tr>

        <tr>
            <th>Channel</th>
            <td>{_safe(transaction.get("channel"))}</td>
        </tr>

        <tr>
            <th>Amount</th>
            <td>{_safe(transaction.get("amount"))}</td>
        </tr>

        <tr>
            <th>Currency</th>
            <td>{_safe(transaction.get("currency"))}</td>
        </tr>

        <tr>
            <th>Geolocation</th>
            <td>{_safe(transaction.get("geolocation"))}</td>
        </tr>

        <tr>
            <th>Device Fingerprint</th>
            <td>{_safe(transaction.get("device_fingerprint"))}</td>
        </tr>

        <tr>
            <th>Merchant</th>
            <td>{_safe(transaction.get("merchant"))}</td>
        </tr>

        <tr>
            <th>Merchant Category</th>
            <td>{_safe(transaction.get("merchant_category"))}</td>
        </tr>

        <tr>
            <th>Beneficiary</th>
            <td>{_safe(transaction.get("beneficiary"))}</td>
        </tr>
    </table>


    <h2>3. Risk Assessment</h2>

    <table>
        <tr>
            <th>Component</th>
            <th>Sub-score</th>
            <th>Weight</th>
        </tr>

        <tr>
            <td>Adaptive Friction</td>
            <td>
                {_safe(
                    risk.get("adaptive_friction", {})
                    .get("sub_score")
                )}
            </td>
            <td>45%</td>
        </tr>

        <tr>
            <td>Fund Flow</td>
            <td>
                {_safe(
                    risk.get("fund_flow", {})
                    .get("sub_score")
                )}
            </td>
            <td>35%</td>
        </tr>

        <tr>
            <td>Phishing</td>
            <td>
                {_safe(
                    risk.get("phishing", {})
                    .get("sub_score")
                )}
            </td>
            <td>20%</td>
        </tr>
    </table>

    <table>
        <tr>
            <th>Consolidated Risk Score</th>
            <td class="score">
                {_safe(risk.get("consolidated_risk_score"))}
            </td>
        </tr>

        <tr>
            <th>Risk Level</th>
            <td class="risk">
                {_safe(risk.get("risk_level"))}
            </td>
        </tr>
    </table>


    <h2>4. Recommended Actions</h2>

    <ul>
        {actions_html}
    </ul>


    <h2>5. Risk Explanation</h2>

    <div class="explanation">
        <strong>Summary:</strong><br>
        {_safe(explanation.get("summary"))}
    </div>

    <h3>Triggered Signals</h3>

    <ul>
        {signals_html}
    </ul>


    <h2>6. Supporting Evidence</h2>

    <table>
        <tr>
            <th>Evidence Type</th>
            <th>Evidence</th>
        </tr>

        <tr>
            <td>Adaptive Friction</td>
            <td>{_safe(evidence.get("adaptive_friction"))}</td>
        </tr>

        <tr>
            <td>Fund Flow</td>
            <td>{_safe(evidence.get("fund_flow"))}</td>
        </tr>

        <tr>
            <td>Phishing</td>
            <td>{_safe(evidence.get("phishing"))}</td>
        </tr>

        <tr>
            <td>OCR</td>
            <td>{_safe(evidence.get("ocr"))}</td>
        </tr>
    </table>


    <h2>7. Analyst Review &amp; Sign-off</h2>

    <table>
        <tr>
            <th>Analyst Name</th>
            <td>{_safe(analyst.get("analyst_name"))}</td>
        </tr>

        <tr>
            <th>Analyst ID</th>
            <td>{_safe(analyst.get("analyst_id"))}</td>
        </tr>

        <tr>
            <th>Review Date / Time</th>
            <td>{_safe(analyst.get("review_date_time"))}</td>
        </tr>

        <tr>
            <th>Electronic Signature</th>
            <td class="signature">
                {_safe(analyst.get("electronic_signature"))}
            </td>
        </tr>
    </table>


    <div class="footer">
        Generated by Unified Fraud Detection Engine
    </div>

</body>
</html>
"""

    with open(
        file_path,
        "w",
        encoding="utf-8"
    ) as file:
        file.write(html_content)

    return {
        "generated": True,
        "report_id": report_id,
        "file_path": file_path
    }