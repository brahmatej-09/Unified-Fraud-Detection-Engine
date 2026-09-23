from pathlib import Path
from html import unescape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)


def _display(value):
    """Convert missing values into a readable report value."""
    if value is None or value == "":
        return "Not provided"

    if isinstance(value, (dict, list)):
        return str(value)

    return unescape(str(value))


def _make_table(data, col_widths=None):
    """Create a consistently styled PDF table."""
    table = Table(data, colWidths=col_widths, repeatRows=1)

    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8E8E8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    return table


def generate_str_pdf(str_data, output_dir="reports"):
    """
    Generate a PDF Suspicious Transaction Report.

    Returns:
        {
            "generated": True,
            "report_id": "...",
            "file_path": "..."
        }
    """

    if not str_data or not str_data.get("generated"):
        return {
            "generated": False,
            "reason": "No generated STR data was provided."
        }

    report_header = str_data.get("report_header", {})
    transaction_summary = str_data.get("transaction_summary", {})
    risk_assessment = str_data.get("risk_assessment", {})
    supporting_evidence = str_data.get("supporting_evidence", {})
    analyst_review = str_data.get("analyst_review", {})
    explanation = str_data.get("explanation", {})

    report_id = report_header.get("report_id")

    if not report_id:
        return {
            "generated": False,
            "reason": "STR report ID is missing."
        }

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    pdf_path = output_path / f"{report_id}.pdf"

    # Create the PDF document.
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title="Suspicious Transaction Report",
        author="Unified Fraud Detection Engine",
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "STRTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=20,
        leading=24,
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        "STRSubtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=11,
        spaceAfter=18,
    )

    heading_style = ParagraphStyle(
        "STRHeading",
        parent=styles["Heading2"],
        fontSize=13,
        leading=16,
        spaceBefore=12,
        spaceAfter=8,
    )

    body_style = ParagraphStyle(
        "STRBody",
        parent=styles["BodyText"],
        fontSize=9,
        leading=13,
        spaceAfter=6,
    )

    small_style = ParagraphStyle(
        "STRSmall",
        parent=styles["BodyText"],
        fontSize=8,
        leading=11,
    )

    story = []

    # ---------------------------------------------------------
    # Title
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "Suspicious Transaction Report",
            title_style
        )
    )

    story.append(
        Paragraph(
            "Unified Fraud Detection Engine",
            subtitle_style
        )
    )

    # ---------------------------------------------------------
    # 1. Report Header
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "1. Report Header",
            heading_style
        )
    )

    header_data = [
        ["Reporting Institution", _display(report_header.get("reporting_institution"))],
        ["Report ID", _display(report_header.get("report_id"))],
        ["Date of Report", _display(report_header.get("date_of_report"))],
        ["Prepared By", _display(report_header.get("prepared_by"))],
        ["Contact", _display(report_header.get("contact"))],
    ]

    story.append(
        _make_table(
            header_data,
            col_widths=[55 * mm, 120 * mm]
        )
    )

    # ---------------------------------------------------------
    # 2. Transaction Summary
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "2. Transaction Summary",
            heading_style
        )
    )

    transaction_data = [
        ["Transaction ID", _display(transaction_summary.get("transaction_id"))],
        ["Date / Time", _display(transaction_summary.get("transaction_date_time"))],
        ["Channel", _display(transaction_summary.get("channel"))],
        ["Amount", _display(transaction_summary.get("amount"))],
        ["Currency", _display(transaction_summary.get("currency"))],
        ["Geolocation", _display(transaction_summary.get("geolocation"))],
        ["Device Fingerprint", _display(transaction_summary.get("device_fingerprint"))],
        ["Merchant", _display(transaction_summary.get("merchant"))],
        ["Merchant Category", _display(transaction_summary.get("merchant_category"))],
        ["Beneficiary", _display(transaction_summary.get("beneficiary"))],
    ]

    story.append(
        _make_table(
            transaction_data,
            col_widths=[55 * mm, 120 * mm]
        )
    )

    # ---------------------------------------------------------
    # 3. Risk Assessment
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "3. Risk Assessment",
            heading_style
        )
    )

    af = risk_assessment.get("adaptive_friction", {})
    ff = risk_assessment.get("fund_flow", {})
    ph = risk_assessment.get("phishing", {})

    risk_data = [
        ["Component", "Sub-score", "Weight"],
        [
            "Adaptive Friction",
            _display(af.get("sub_score")),
            f"{_display(af.get('weight'))}%"
        ],
        [
            "Fund Flow",
            _display(ff.get("sub_score")),
            f"{_display(ff.get('weight'))}%"
        ],
        [
            "Phishing",
            _display(ph.get("sub_score")),
            f"{_display(ph.get('weight'))}%"
        ],
    ]

    story.append(
        _make_table(
            risk_data,
            col_widths=[80 * mm, 45 * mm, 50 * mm]
        )
    )

    story.append(Spacer(1, 6))

    score_data = [
        [
            "Consolidated Risk Score",
            _display(risk_assessment.get("consolidated_risk_score"))
        ],
        [
            "Risk Level",
            _display(risk_assessment.get("risk_level"))
        ],
    ]

    score_table = Table(
        score_data,
        colWidths=[100 * mm, 75 * mm]
    )

    score_table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    story.append(score_table)

    # ---------------------------------------------------------
    # 4. Recommended Actions
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "4. Recommended Actions",
            heading_style
        )
    )

    recommended_action = risk_assessment.get("recommended_action")

    if isinstance(recommended_action, list):
        for action in recommended_action:
            story.append(
                Paragraph(
                    f"• {_display(action)}",
                    body_style
                )
            )
    elif recommended_action:
        for action in str(recommended_action).split("\n"):
            if action.strip():
                story.append(
                    Paragraph(
                        f"• {_display(action)}",
                        body_style
                    )
                )
    else:
        story.append(
            Paragraph(
                "No recommended actions provided.",
                body_style
            )
        )

    # ---------------------------------------------------------
    # 5. Risk Explanation
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "5. Risk Explanation",
            heading_style
        )
    )

    summary = ""

    if isinstance(explanation, dict):
        summary = explanation.get("summary", "")

    if summary:
        story.append(
            Paragraph(
                f"<b>Summary:</b> {_display(summary)}",
                body_style
            )
        )

    triggered_signals = []

    if isinstance(explanation, dict):
        triggered_signals = explanation.get(
            "triggered_signals",
            []
        )

    if triggered_signals:
        story.append(
            Paragraph(
                "Triggered Signals",
                ParagraphStyle(
                    "SignalHeading",
                    parent=styles["Heading3"],
                    fontSize=11,
                    spaceBefore=8,
                    spaceAfter=6,
                )
            )
        )

        for signal in triggered_signals:
            if isinstance(signal, dict):
                signal_text = signal.get(
                    "reason",
                    signal.get("signal", str(signal))
                )
            else:
                signal_text = str(signal)

            story.append(
                Paragraph(
                    f"• {_display(signal_text)}",
                    body_style
                )
            )

    # ---------------------------------------------------------
    # 6. Supporting Evidence
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "6. Supporting Evidence",
            heading_style
        )
    )

    evidence_data = [
        ["Evidence Type", "Evidence"],
        [
            "Adaptive Friction",
            _display(supporting_evidence.get("adaptive_friction"))
        ],
        [
            "Fund Flow",
            _display(supporting_evidence.get("fund_flow"))
        ],
        [
            "Phishing",
            _display(supporting_evidence.get("phishing"))
        ],
        [
            "OCR",
            _display(supporting_evidence.get("ocr"))
        ],
    ]

    story.append(
        _make_table(
            evidence_data,
            col_widths=[55 * mm, 120 * mm]
        )
    )

    # ---------------------------------------------------------
    # 7. Analyst Review & Sign-off
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "7. Analyst Review & Sign-off",
            heading_style
        )
    )

    analyst_data = [
        [
            "Analyst Name",
            _display(analyst_review.get("analyst_name"))
        ],
        [
            "Analyst ID",
            _display(analyst_review.get("analyst_id"))
        ],
        [
            "Review Date / Time",
            _display(analyst_review.get("review_date_time"))
        ],
        [
            "Electronic Signature",
            _display(analyst_review.get("electronic_signature"))
        ],
    ]

    story.append(
        _make_table(
            analyst_data,
            col_widths=[55 * mm, 120 * mm]
        )
    )

    story.append(Spacer(1, 15))

    story.append(
        Paragraph(
            "Generated by Unified Fraud Detection Engine",
            small_style
        )
    )

    # Build the PDF.
    doc.build(story)

    return {
        "generated": True,
        "report_id": report_id,
        "file_path": str(pdf_path),
    }