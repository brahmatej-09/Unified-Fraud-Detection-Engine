import re


def parse_fund_flow_text(text, transaction_id=None):

    result = {
        "InDegree": None,
        "OutDegree": None,
        "RemainingBalance": None,
        "TotalSent": None,
        "HoldingMinutes": None
    }

    # ---------------------------------------------------------
    # Normalize OCR text
    # ---------------------------------------------------------

    text = text.replace(",", "")
    text = text.replace("$", "")
    text = text.replace("€", "")
    text = text.replace("₹", "")

    # ---------------------------------------------------------
    # Find the correct transaction record
    # ---------------------------------------------------------

    if transaction_id:

        transaction_pattern = re.compile(
            rf"TRANSACTION\s+REF\s*"
            rf"(?:\n|\r\n|\s)+"
            rf"{re.escape(transaction_id)}"
            rf"(.*?)(?=RECORD\s+\d+\s+OF\s+\d+|AMOUNTS\s+IN|$)",
            re.IGNORECASE | re.DOTALL
        )

        match = transaction_pattern.search(text)

        if not match:
            return result

        record_text = match.group(1)

    else:

        record_text = text

    # ---------------------------------------------------------
    # INCOMING COUNTERPARTIES
    # ---------------------------------------------------------

    match = re.search(
        r"INCOMING\s+COUNTERPARTIES\s*"
        r"(?:\n|\r\n|\s)+"
        r"(\d+|N/A)",
        record_text,
        re.IGNORECASE
    )

    if match:
        value = match.group(1)

        if value.upper() != "N/A":
            result["InDegree"] = int(value)

    # ---------------------------------------------------------
    # OUTGOING COUNTERPARTIES
    # ---------------------------------------------------------

    match = re.search(
        r"OUTGOING\s+COUNTERPARTIES\s*"
        r"(?:\n|\r\n|\s)+"
        r"(\d+|N/A)",
        record_text,
        re.IGNORECASE
    )

    if match:
        value = match.group(1)

        if value.upper() != "N/A":
            result["OutDegree"] = int(value)

    # ---------------------------------------------------------
    # HOLDING MINUTES
    # ---------------------------------------------------------

    match = re.search(
        r"HOLDING\s+MINUTES\s*"
        r"(?:\n|\r\n|\s)+"
        r"(\d+(?:\.\d+)?)",
        record_text,
        re.IGNORECASE
    )

    if match:
        result["HoldingMinutes"] = float(
            match.group(1)
        )

    # ---------------------------------------------------------
    # TOTAL SENT
    # ---------------------------------------------------------

    match = re.search(
        r"TOTAL\s+SENT\s*"
        r"(?:\n|\r\n|\s)+"
        r"(\d+(?:\.\d+)?)",
        record_text,
        re.IGNORECASE
    )

    if match:
        result["TotalSent"] = float(
            match.group(1)
        )

    # ---------------------------------------------------------
    # BALANCE RETAINED
    # ---------------------------------------------------------

    match = re.search(
        r"BALANCE\s+RETAINED\s*"
        r"(?:\n|\r\n|\s)+"
        r"(-?\d+(?:\.\d+)?)",
        record_text,
        re.IGNORECASE
    )

    if match:
        result["RemainingBalance"] = float(
            match.group(1)
        )

    return result