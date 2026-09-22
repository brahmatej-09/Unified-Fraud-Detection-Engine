from ocr.ocr_service import (
    extract_text_from_image,
    extract_text_from_pdf
)


print("\n===== PDF OCR =====\n")

pdf_path = "data/OCR_Samples/FundFlow_Statement_5.pdf"

pdf_text = extract_text_from_pdf(pdf_path)

print(pdf_text)


print("\n===== IMAGE OCR =====\n")

image_path = "data/OCR_Samples/FundFlow_Statement_6.png"

image_text = extract_text_from_image(image_path)

print(image_text)