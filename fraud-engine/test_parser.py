from ocr.ocr_service import extract_text_from_image
from ocr.fund_flow_parser import parse_fund_flow_text


image_path = "data/OCR_Samples/FundFlow_Statement_6.png"

# 1. Extract text using OCR
text = extract_text_from_image(image_path)

print("\n===== OCR TEXT =====\n")
print(text)

# 2. Parse OCR text
fund_flow = parse_fund_flow_text(text)

print("\n===== PARSED FUND FLOW =====\n")
print(fund_flow)