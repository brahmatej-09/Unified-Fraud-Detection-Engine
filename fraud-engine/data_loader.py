import json
import pandas as pd


def load_table(table_path):

    with open(
        f"{table_path}/Adaptive_Friction.json",
        "r"
    ) as file:
        adaptive_data = json.load(file)

    fund_flow_data = pd.read_csv(
        f"{table_path}/FundFlow.csv"
    )

    with open(
        f"{table_path}/Phishing_Sites.json",
        "r"
    ) as file:
        phishing_data = json.load(file)

    return {
        "adaptive_friction": adaptive_data,
        "fund_flow": fund_flow_data,
        "phishing": phishing_data
    }


def get_transaction(table_path, transaction_id):

    data = load_table(table_path)

    # -----------------------------
    # ADAPTIVE FRICTION
    # -----------------------------

    adaptive = next(
        (
            item
            for item in data["adaptive_friction"]
            if item.get("transactionId") == transaction_id
        ),
        None
    )

    # -----------------------------
    # FUND FLOW
    # -----------------------------

    fund_flow_rows = data["fund_flow"][
        data["fund_flow"]["TransactionId"] == transaction_id
    ]

    if not fund_flow_rows.empty:
        fund_flow = fund_flow_rows.iloc[0].to_dict()
    else:
        fund_flow = None

    # -----------------------------
    # PHISHING
    # -----------------------------

    phishing = next(
        (
            item
            for item in data["phishing"]
            if item.get("transactionId") == transaction_id
        ),
        None
    )

    return {
        "adaptive_friction": adaptive,
        "fund_flow": fund_flow,
        "phishing": phishing
    }