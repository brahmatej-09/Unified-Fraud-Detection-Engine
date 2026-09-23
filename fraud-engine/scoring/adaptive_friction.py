# Adaptive Friction
# -----------------
# This module checks whether a transaction appears to be coming
# from the legitimate user/device.
#
# It calculates three risk signals:
#
# AF1 -> Device fingerprint change
# AF2 -> Distance between the current transaction and known location
# AF3 -> Transaction amount compared with the user's historical average
#
# Final AF score:
# 50% AF1 + 30% AF2 + 20% AF3


def calculate_adaptive_friction(data):

    # ---------------------------------------------------------
    # STEP 1: Get the transaction and stored user information
    # ---------------------------------------------------------

    # Information about the current transaction
    live = data.get("liveTransaction", {})

    # Information about the user's previously known profile
    stored = data.get("storedProfile", {})


    # ---------------------------------------------------------
    # STEP 2: Extract the fields required for Adaptive Friction
    # ---------------------------------------------------------

    # Current transaction amount
    amount = live.get("amount")

    # User's historical average transaction amount
    historical_mean = stored.get("historicalAvgAmount")

    # Distance associated with the current transaction
    distance_km = live.get("distanceKm")

    # Device information from the current transaction
    current_device = live.get("deviceFingerprint")

    # Device information stored in the user's profile
    stored_device = stored.get("knownDeviceFingerprint")


    # ---------------------------------------------------------
    # STEP 3: Check whether required fields are present
    # ---------------------------------------------------------

    missing_fields = []

    if amount is None:
        missing_fields.append("liveTransaction.amount")

    if historical_mean is None:
        missing_fields.append("storedProfile.historicalAvgAmount")

    if distance_km is None:
        missing_fields.append("liveTransaction.distanceKm")

    if current_device is None:
        missing_fields.append("liveTransaction.deviceFingerprint")

    if stored_device is None:
        missing_fields.append("storedProfile.knownDeviceFingerprint")


    # If any required field is missing, do not calculate the score.
    if missing_fields:

        return {
            "valid": False,
            "reason": "Missing required fields",
            "missing_fields": missing_fields
        }


    # ---------------------------------------------------------
    # STEP 4: Check whether numeric fields contain numbers
    # ---------------------------------------------------------

    # These fields must contain numbers because we perform
    # mathematical calculations on them.

    invalid_fields = []

    if not isinstance(amount, (int, float)) or isinstance(amount, bool):
        invalid_fields.append("liveTransaction.amount")

    if not isinstance(historical_mean, (int, float)) or isinstance(historical_mean, bool):
        invalid_fields.append("storedProfile.historicalAvgAmount")

    if not isinstance(distance_km, (int, float)) or isinstance(distance_km, bool):
        invalid_fields.append("liveTransaction.distanceKm")


    # If a field contains something like "2500" instead of
    # a number, reject the input rather than calculating incorrectly.
    if invalid_fields:

        return {
            "valid": False,
            "reason": "Invalid field types",
            "invalid_fields": invalid_fields
        }


    # ---------------------------------------------------------
    # STEP 5: Check whether numeric values are valid
    # ---------------------------------------------------------

    # Transaction amount cannot be negative.
    # Historical average cannot be negative.
    # Distance cannot be negative.

    invalid_values = []

    if amount < 0:
        invalid_values.append("liveTransaction.amount")

    if historical_mean < 0:
        invalid_values.append("storedProfile.historicalAvgAmount")

    if distance_km < 0:
        invalid_values.append("liveTransaction.distanceKm")


    if invalid_values:

        return {
            "valid": False,
            "reason": "Invalid field values",
            "invalid_fields": invalid_values
        }


    # ---------------------------------------------------------
    # STEP 6: Validate device information
    # ---------------------------------------------------------

    # These four fields are used to compare the current device
    # with the device stored in the user's profile.

    device_fields = [
        "os",
        "browser",
        "ipAddress",
        "userAgent"
    ]


    # Check the current transaction's device information.
    for field in device_fields:

        if not current_device.get(field):

            return {
                "valid": False,
                "reason": "Missing required device field",
                "missing_fields": [
                    f"liveTransaction.deviceFingerprint.{field}"
                ]
            }


    # Check the stored device information.
    for field in device_fields:

        if not stored_device.get(field):

            return {
                "valid": False,
                "reason": "Missing required stored device field",
                "missing_fields": [
                    f"storedProfile.knownDeviceFingerprint.{field}"
                ]
            }


    # =========================================================
    # STEP 7: AF1 - Device Fingerprint Change
    # =========================================================
    #
    # We compare the current device with the device stored
    # in the user's profile.
    #
    # If ANY important device property changes, we consider
    # the device fingerprint to have changed.
    #
    # AF1:
    #     1 = device changed
    #     0 = device unchanged
    #
    # Weight = 50%
    # =========================================================

    fingerprint_changed = (
        current_device.get("os") != stored_device.get("os")
        or current_device.get("browser") != stored_device.get("browser")
        or current_device.get("ipAddress") != stored_device.get("ipAddress")
        or current_device.get("userAgent") != stored_device.get("userAgent")
    )

    # Convert True/False into 1/0 for scoring.
    af1 = 1 if fingerprint_changed else 0


    # =========================================================
    # STEP 8: AF2 - Distance Risk
    # =========================================================
    #
    # A larger transaction distance represents greater risk.
    #
    # Formula from the problem statement:
    #
    #     AF2 = min(distance / 1500, 1)
    #
    # The maximum normalized value is 1.
    #
    # Weight = 30%
    # =========================================================

    af2 = min(distance_km / 1500, 1)


    # =========================================================
    # STEP 9: AF3 - Transaction Amount Risk
    # =========================================================
    #
    # We compare the current transaction amount with the
    # user's historical average amount.
    #
    # Formula:
    #
    #     (amount - historical_average) / historical_average
    #
    # The result is limited between 0 and 1.
    #
    # Weight = 20%
    # =========================================================

    if historical_mean > 0:

        af3 = max(
            0,
            min(
                (amount - historical_mean) / historical_mean,
                1
            )
        )

    else:

        # If the historical average is 0, we cannot divide by it.
        # Therefore, we use 0 for this signal.
        af3 = 0


    # =========================================================
    # STEP 10: Calculate the Final Adaptive Friction Score
    # =========================================================
    #
    # AF1 -> 50%
    # AF2 -> 30%
    # AF3 -> 20%
    #
    # The individual signals are between 0 and 1.
    # Multiplying the final result by 100 converts it to 0-100.
    # =========================================================

    score = (
        af1 * 0.50
        + af2 * 0.30
        + af3 * 0.20
    )


    # ---------------------------------------------------------
    # STEP 11: Return the result
    # ---------------------------------------------------------

    return {
        "valid": True,

        # Individual signal results
        "af1_device_change": af1,
        "af2_distance": af2,
        "af3_amount": af3,

        # Final AF score between 0 and 100
        "adaptive_friction_score": round(score * 100, 2)
    }