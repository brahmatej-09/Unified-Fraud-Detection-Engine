# Fund Flow Analysis
# ------------------
# This module checks how money moves through an account.
#
# It calculates three risk signals:
#
# FF1 -> Incoming vs outgoing activity
# FF2 -> Amount of money retained in the account
# FF3 -> How long the money was held
#
# Final FF score:
# 45% FF1 + 30% FF2 + 25% FF3


def calculate_fund_flow(data):

    # ---------------------------------------------------------
    # STEP 1: Get the required Fund Flow values
    # ---------------------------------------------------------

    # Number of incoming counterparties/transactions
    incoming = data.get("InDegree")

    # Number of outgoing counterparties/transactions
    outgoing = data.get("OutDegree")

    # Amount of money remaining in the account
    remaining_balance = data.get("RemainingBalance")

    # Total amount that was sent
    total_sent = data.get("TotalSent")

    # How long the funds were held, in minutes
    holding_minutes = data.get("HoldingMinutes")


    # ---------------------------------------------------------
    # STEP 2: Check whether required fields are present
    # ---------------------------------------------------------

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


    # If any required field is missing, stop the calculation.
    if missing_fields:

        return {
            "valid": False,
            "reason": "Missing required fields",
            "missing_fields": missing_fields
        }


    # ---------------------------------------------------------
    # STEP 3: Validate the data types
    # ---------------------------------------------------------
    #
    # The Fund Flow calculations require numeric values.
    # For example:
    #
    #     InDegree = 5       -> valid
    #     InDegree = "five"  -> invalid
    #
    # ---------------------------------------------------------

    numeric_fields = {
        "InDegree": incoming,
        "OutDegree": outgoing,
        "RemainingBalance": remaining_balance,
        "TotalSent": total_sent,
        "HoldingMinutes": holding_minutes
    }

    invalid_fields = []

    for field_name, value in numeric_fields.items():

        if not isinstance(value, (int, float)) or isinstance(value, bool):
            invalid_fields.append(field_name)


    if invalid_fields:

        return {
            "valid": False,
            "reason": "Invalid field types",
            "invalid_fields": invalid_fields
        }


    # ---------------------------------------------------------
    # STEP 4: Validate numeric values
    # ---------------------------------------------------------
    #
    # These values represent counts, money and time.
    # Negative values would not make sense for these fields.
    #
    # Therefore, reject them.
    # ---------------------------------------------------------

    invalid_values = []

    if incoming < 0:
        invalid_values.append("InDegree")

    if outgoing < 0:
        invalid_values.append("OutDegree")

    if remaining_balance < 0:
        invalid_values.append("RemainingBalance")

    if total_sent < 0:
        invalid_values.append("TotalSent")

    if holding_minutes < 0:
        invalid_values.append("HoldingMinutes")


    if invalid_values:

        return {
            "valid": False,
            "reason": "Invalid field values",
            "invalid_fields": invalid_values
        }


    # =========================================================
    # STEP 5: FF1 - Incoming vs Outgoing Activity
    # =========================================================
    #
    # We compare the number of incoming and outgoing activities.
    #
    # The smaller value is divided by the larger value.
    #
    # Example:
    #
    # InDegree  = 2
    # OutDegree = 10
    #
    # FF1 = 2 / 10
    #     = 0.2
    #
    # Weight = 45%
    # =========================================================

    larger = max(incoming, outgoing)
    smaller = min(incoming, outgoing)

    if larger > 0:
        ff1 = smaller / larger
    else:
        # If both incoming and outgoing are zero,
        # there is no activity to compare.
        ff1 = 0


    # =========================================================
    # STEP 6: FF2 - Remaining Balance
    # =========================================================
    #
    # This signal looks at how much of the sent money remains
    # in the account.
    #
    # Formula:
    #
    # FF2 = 1 - (RemainingBalance / TotalSent)
    #
    # The result is limited between 0 and 1.
    #
    # Weight = 30%
    # =========================================================

    if total_sent > 0:

        ff2 = 1 - (remaining_balance / total_sent)

        # Keep the score between 0 and 1.
        ff2 = max(0, min(ff2, 1))

    else:

        # Avoid division by zero when TotalSent is zero.
        ff2 = 0


    # =========================================================
    # STEP 7: FF3 - Holding Time
    # =========================================================
    #
    # Shorter holding time produces a higher risk signal.
    #
    # Formula:
    #
    # FF3 = 1 - (HoldingMinutes / 60)
    #
    # The result is limited between 0 and 1.
    #
    # Weight = 25%
    # =========================================================

    ff3 = 1 - (holding_minutes / 60)

    # Keep the score between 0 and 1.
    ff3 = max(0, min(ff3, 1))


    # =========================================================
    # STEP 8: Calculate Final Fund Flow Score
    # =========================================================
    #
    # FF1 -> 45%
    # FF2 -> 30%
    # FF3 -> 25%
    #
    # The individual signals are between 0 and 1.
    # Multiplying by 100 converts the final score to 0-100.
    # =========================================================

    score = (
        ff1 * 0.45
        + ff2 * 0.30
        + ff3 * 0.25
    )


    # ---------------------------------------------------------
    # STEP 9: Return the Fund Flow analysis
    # ---------------------------------------------------------

    return {
        "valid": True,

        # Individual Fund Flow signals
        "ff1_activity_balance": round(ff1, 4),
        "ff2_remaining_balance": round(ff2, 4),
        "ff3_holding_time": round(ff3, 4),

        # Final Fund Flow score from 0 to 100
        "fund_flow_score": round(score * 100, 2)
    }