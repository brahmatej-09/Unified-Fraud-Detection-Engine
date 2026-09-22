from datetime import datetime


def calculate_phishing(data):

    submitted_at = data.get("submittedAt")
    domain = data.get("domain", {})
    certificate = data.get("certificate", {})
    local_listing = data.get("localListing")

    # Registration date is inside the domain object
    registration_date = domain.get("registrationDate")

    missing_fields = []

    if not registration_date:
        missing_fields.append("domain.registrationDate")

    if not submitted_at:
        missing_fields.append("submittedAt")

    if certificate is None:
        missing_fields.append("certificate")

    if local_listing is None:
        missing_fields.append("localListing")

    if missing_fields:
        return {
            "valid": False,
            "reason": "Missing required fields",
            "missing_fields": missing_fields
        }

    # --------------------------------
    # DOMAIN AGE
    # --------------------------------

    registration = datetime.fromisoformat(
        registration_date.replace("Z", "+00:00")
    )

    submitted = datetime.fromisoformat(
        submitted_at.replace("Z", "+00:00")
    )

    age_days = (submitted - registration).days

    ph1 = 1 - min(age_days / 180, 1)

    ph1 = max(0, min(ph1, 1))

    # --------------------------------
    # CERTIFICATE
    # --------------------------------

    self_signed = certificate.get(
        "selfSigned",
        False
    )

    valid_from = certificate.get("validFrom")
    valid_to = certificate.get("validTo")

    if valid_from and valid_to:

        valid_from_date = datetime.fromisoformat(
            valid_from.replace("Z", "+00:00")
        )

        valid_to_date = datetime.fromisoformat(
            valid_to.replace("Z", "+00:00")
        )

        validity_days = (
            valid_to_date - valid_from_date
        ).days

    else:
        validity_days = 0

    ph2 = (
        1
        if self_signed or validity_days < 30
        else 0
    )

    # --------------------------------
    # BLACKLIST
    # --------------------------------

    ph3 = (
        1
        if local_listing.lower() == "blacklist"
        else 0
    )

    # --------------------------------
    # FINAL PHISHING SCORE
    # --------------------------------

    score = (
        ph1 * 0.40
        + ph2 * 0.30
        + ph3 * 0.30
    )

    return {
        "valid": True,
        "ph1_domain_age": round(ph1, 4),
        "ph2_certificate": ph2,
        "ph3_blacklist": ph3,
        "phishing_score": round(score * 100, 2)
    }