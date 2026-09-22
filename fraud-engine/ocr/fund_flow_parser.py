import re


def parse_fund_flow_text(text):
    """
    Convert OCR-extracted statement text into
    the Fund Flow fields expected by the fraud engine.
    """

    result = {
        "InDegree": None,
        "OutDegree": None,
        "RemainingBalance": None,
        "TotalSent": None,
        "HoldingMinutes": None
    }

    # Normalize OCR text
    text = text.replace(",", "")
    text = text.replace("$", "")
    text = text.replace("€", "")
    text = text.replace("₹", "")

    # -----------------------------
    # InDegree
    # -----------------------------

    match = re.search(
        r"InDegree\s*[:\-]?\s*(\d+)",
        text,
        re.IGNORECASE
    )

    if match:
        result["InDegree"] = int(match.group(1))

    # -----------------------------
    # OutDegree
    # -----------------------------

    match = re.search(
        r"OutDegree\s*[:\-]?\s*(\d+)",
        text,
        re.IGNORECASE
    )

    if match:
        result["OutDegree"] = int(match.group(1))

    # -----------------------------
    # Remaining Balance
    # -----------------------------

    match = re.search(
        r"RemainingBalance\s*[:\-]?\s*(-?\d+(?:\.\d+)?)",
        text,
        re.IGNORECASE
    )

    if match:
        result["RemainingBalance"] = float(
            match.group(1)
        )

    # -----------------------------
    # Total Sent
    # -----------------------------

    match = re.search(
        r"TotalSent\s*[:\-]?\s*(\d+(?:\.\d+)?)",
        text,
        re.IGNORECASE
    )

    if match:
        result["TotalSent"] = float(
            match.group(1)
        )

    # -----------------------------
    # Holding Minutes
    # -----------------------------

    match = re.search(
        r"HoldingMinutes\s*[:\-]?\s*(\d+(?:\.\d+)?)",
        text,
        re.IGNORECASE
    )

    if match:
        result["HoldingMinutes"] = float(
            match.group(1)
        )

    return result