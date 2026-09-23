from scoring.fund_flow import calculate_fund_flow


def test_valid_fund_flow():
    data = {
        "InDegree": 10,
        "OutDegree": 5,
        "RemainingBalance": 50000,
        "TotalSent": 100000,
        "HoldingMinutes": 30
    }

    result = calculate_fund_flow(data)

    assert result["valid"] is True
    assert result["fund_flow_score"] >= 0
    assert result["fund_flow_score"] <= 100


def test_missing_required_fields():
    data = {
        "InDegree": 10,
        "OutDegree": 5
    }

    result = calculate_fund_flow(data)

    assert result["valid"] is False
    assert "missing_fields" in result


def test_negative_value_is_rejected():
    data = {
        "InDegree": 10,
        "OutDegree": 5,
        "RemainingBalance": -500,
        "TotalSent": 100000,
        "HoldingMinutes": 30
    }

    result = calculate_fund_flow(data)

    assert result["valid"] is False
    assert "invalid_fields" in result