"""
Backend configuration and path constants.
"""

import os
from pathlib import Path

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Downloads directory
DOWNLOADS_DIR = BASE_DIR / "downloads"
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Allowed CORS origins (development + container defaults)
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost",
    "*",
]

# Cache TTL (files older than this in seconds are eligible for auto-cleanup)
MAX_FILE_AGE_SECONDS = 1800  # 30 minutes
