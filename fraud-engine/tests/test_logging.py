import logging
import os

from logging_config import LOG_FILE, setup_logging


def test_logging_setup():
    setup_logging()

    logger = logging.getLogger("fraud_engine_test")

    logger.info("Test log entry")

    assert os.path.exists(LOG_FILE)

    with open(LOG_FILE, "r", encoding="utf-8") as file:
        contents = file.read()

    assert "Test log entry" in contents