import pytesseract
from PIL import Image
from pdf2image import convert_from_path


def extract_text_from_image(image_path):
    """
    Extract text from a PNG/JPG/image file.
    """

    image = Image.open(image_path)

    text = pytesseract.image_to_string(image)

    return text


def extract_text_from_pdf(pdf_path):
    """
    Convert PDF pages into images and extract text
    using Tesseract OCR.
    """

    pages = convert_from_path(pdf_path)

    extracted_text = []

    for page_number, page in enumerate(pages, start=1):

        text = pytesseract.image_to_string(page)

        extracted_text.append(
            f"--- Page {page_number} ---\n{text}"
        )

    return "\n".join(extracted_text)