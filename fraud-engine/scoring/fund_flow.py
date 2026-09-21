def calculate_fund_flow(data):

    # Get values from the actual FundFlow.csv structure
    incoming = data.get("InDegree")
    outgoing = data.get("OutDegree")
    remaining_balance = data.get("RemainingBalance")
    total_sent = data.get("TotalSent")
    holding_minutes = data.get("HoldingMinutes")

    # Validate required fields
    missing_fields = []

    if incoming is None:
        missing_fields.append("InDegree")

    if outgoing is None:
        missing_fields.append("OutDegree")

    if remaining_balance is None:
        missing_fields.append("RemainingBalance")

    if total_sent is None:
        missing_fields.append("TotalSent")

    if holding_minutes is None:
        missing_fields.append("HoldingMinutes")

    if missing_fields:
        return {
            "valid": False,
            "reason": "Missing required fields",
            "missing_fields": missing_fields
        }

    # FF1: Incoming vs outgoing activity
    larger = max(incoming, outgoing)
    smaller = min(incoming, outgoing)

    if larger > 0:
        ff1 = smaller / larger
    else:
        ff1 = 0

    # FF2: Near-zero retained balance
    if total_sent > 0:
        ff2 = 1 - (remaining_balance / total_sent)
        ff2 = max(0, min(ff2, 1))
    else:
        ff2 = 0

    # FF3: Short holding time
    ff3 = 1 - (holding_minutes / 60)
    ff3 = max(0, min(ff3, 1))

    # Final Fund Flow score
    score = (
        ff1 * 0.45
        + ff2 * 0.30
        + ff3 * 0.25
    )

    return {
        "valid": True,
        "ff1_activity_balance": round(ff1, 4),
        "ff2_remaining_balance": round(ff2, 4),
        "ff3_holding_time": round(ff3, 4),
        "fund_flow_score": round(score * 100, 2)
    }