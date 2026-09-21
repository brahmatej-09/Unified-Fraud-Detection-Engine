def calculate_adaptive_friction(data):

    live = data.get("liveTransaction", {})
    stored = data.get("storedProfile", {})

    # Required fields
    amount = live.get("amount")
    historical_mean = stored.get("historicalAvgAmount")
    distance_km = live.get("distanceKm")

    current_device = live.get("deviceFingerprint")
    stored_device = stored.get("knownDeviceFingerprint")

    # Validate required fields
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

    if missing_fields:
        return {
            "valid": False,
            "reason": "Missing required fields",
            "missing_fields": missing_fields
        }

    # AF1: Device fingerprint change
    fingerprint_changed = (
        current_device.get("os") != stored_device.get("os")
        or current_device.get("browser") != stored_device.get("browser")
        or current_device.get("ipAddress") != stored_device.get("ipAddress")
        or current_device.get("userAgent") != stored_device.get("userAgent")
    )

    af1 = 1 if fingerprint_changed else 0

    # AF2: Distance risk
    af2 = min(distance_km / 1500, 1)

    # AF3: Amount risk
    if historical_mean > 0:
        af3 = max(
            0,
            min((amount - historical_mean) / historical_mean, 1)
        )
    else:
        af3 = 0

    # Final Adaptive Friction score
    score = (
        af1 * 0.50
        + af2 * 0.30
        + af3 * 0.20
    )

    return {
        "valid": True,
        "af1_device_change": af1,
        "af2_distance": af2,
        "af3_amount": af3,
        "adaptive_friction_score": round(score * 100, 2)
    }