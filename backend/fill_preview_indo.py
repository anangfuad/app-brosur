import sqlite3
import re
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "dalil.db")

ANCHORS = [
    r"Rasulullah\s+SAW\s+bersabda",
    r"Nabi\s+shallallahu",
    r"Dari\s+.+?\s+ia\s+berkata",
    r"Allah\s+Ta[’']?ala\s+berfirman",
    r"Allah\s+berfirman",
]

NOISE_PATTERNS = [
    r"Jl\.\s.*",
    r"Telp\s*\(.*?\)",
    r"Fax.*",
    r"Surakarta\s*\d+",
    r"\(\d{3,4}\)",
]

MAX_LEN = 700


def clean_noise(text: str) -> str:
    for p in NOISE_PATTERNS:
        text = re.sub(p, "", text, flags=re.IGNORECASE)
    return text.strip()


def cut_from_anchor(text: str) -> str:
    for a in ANCHORS:
        m = re.search(a, text, flags=re.IGNORECASE)
        if m:
            return text[m.start():].strip()
    return text.strip()


def trim_length(text: str) -> str:
    if len(text) <= MAX_LEN:
        return text
    cut = text[:MAX_LEN]
    # potong di spasi terakhir
    return cut.rsplit(" ", 1)[0]


conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("""
    SELECT id, preview_indo
    FROM dalil_clean
    WHERE preview_indo IS NOT NULL
""")

rows = cur.fetchall()
updated = 0

for dalil_id, preview in rows:
    if not preview:
        continue

    original = preview

    preview = clean_noise(preview)
    preview = cut_from_anchor(preview)
    preview = trim_length(preview)

    if preview != original:
        cur.execute(
            "UPDATE dalil_clean SET preview_indo = ? WHERE id = ?",
            (preview, dalil_id),
        )
        updated += 1

conn.commit()
conn.close()

print(f"Preview difilter (refine). Total diperbaiki: {updated}")
