import re


def parse_fund_flow_text(text):
    """
    Convert OCR-extracted fund-flow statement text into
    structured records expected by the fraud engine.

    The parser recognizes the labels used in the actual
    OCR statement and returns all transaction records.
    """

    records = []

    # --------------------------------------------------------
    # Normalize OCR text
    # --------------------------------------------------------

    text = text.replace(",", "")
    text = text.replace("$", "")
    text = text.replace("Γé¼", "")
    text = text.replace("Γé╣", "")

    # --------------------------------------------------------
    # Split the statement into transaction records
    # --------------------------------------------------------

    record_blocks = re.split(
        r"RECORD\s+\d+\s+OF\s+\d+",
        text,
        flags=re.IGNORECASE
    )

    # --------------------------------------------------------
    # Parse each transaction record
    # --------------------------------------------------------

    for block in record_blocks:

        transaction_match = re.search(
            r"TRANSACTION\s+REF\s*\n?\s*([A-Z0-9\-]+)",
            block,
            re.IGNORECASE
        )

        if not transaction_match:
            continue

        transaction_id = transaction_match.group(1).strip()

        result = {
            "transactionId": transaction_id,
            "ledger_record": None,
            "currency": None,
            "InDegree": None,
            "OutDegree": None,
            "RemainingBalance": None,
            "TotalSent": None,
            "HoldingMinutes": None
        }

        # ----------------------------------------------------
        # Ledger Record
        # ----------------------------------------------------

        match = re.search(
            r"LEDGER\s+RECORD\s*\n?\s*([A-Z0-9\-]+)",
            block,
            re.IGNORECASE
        )

        if match:
            result["ledger_record"] = match.group(1).strip()

        # ----------------------------------------------------
        # Settlement Currency
        # ----------------------------------------------------

        match = re.search(
            r"SETTLEMENT\s+CURRENCY\s*\n?\s*([A-Z]+)",
            block,
            re.IGNORECASE
        )

        if match:
            result["currency"] = match.group(1).strip()

        # ----------------------------------------------------
        # Incoming Counterparties → InDegree
        # ----------------------------------------------------

        match = re.search(
            r"INCOMING\s+COUNTERPARTIES\s*\n?\s*(\d+)",
            block,
            re.IGNORECASE
        )

        if match:
            result["InDegree"] = int(match.group(1))

        # ----------------------------------------------------
        # Outgoing Counterparties → OutDegree
        # ----------------------------------------------------

        match = re.search(
            r"OUTGOING\s+COUNTERPARTIES\s*\n?\s*(\d+)",
            block,
            re.IGNORECASE
        )

        if match:
            result["OutDegree"] = int(match.group(1))

        # ----------------------------------------------------
        # Holding Minutes
        # ----------------------------------------------------

        match = re.search(
            r"HOLDING\s+MINUTES\s*\n?\s*(\d+(?:\.\d+)?)",
            block,
            re.IGNORECASE
        )

        if match:
            result["HoldingMinutes"] = float(match.group(1))

        # ----------------------------------------------------
        # Total Sent
        # ----------------------------------------------------

        match = re.search(
            r"TOTAL\s+SENT\s*\n?\s*(-?\d+(?:\.\d+)?)",
            block,
            re.IGNORECASE
        )

        if match:
            result["TotalSent"] = float(match.group(1))

        # ----------------------------------------------------
        # Balance Retained → RemainingBalance
        # ----------------------------------------------------

        match = re.search(
            r"BALANCE\s+RETAINED\s*\n?\s*(-?\d+(?:\.\d+)?)",
            block,
            re.IGNORECASE
        )

        if match:
            result["RemainingBalance"] = float(match.group(1))

        records.append(result)

    return records