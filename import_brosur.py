import sqlite3
from pathlib import Path
import re

BASE_DIR = Path(__file__).resolve().parent
BROSUR_DIR = BASE_DIR / "chm_extractednew"

conn = sqlite3.connect("dalil.db")
cur = conn.cursor()

total = 0

for year_dir in sorted(BROSUR_DIR.iterdir()):
    if not year_dir.is_dir():
        continue

    tahun = year_dir.name

    for html_file in year_dir.rglob("*.htm"):
        try:
            # ⚠️ BACA HANYA UNTUK PREVIEW (latin aman)
            content = html_file.read_text(
                encoding="windows-1256",
                errors="ignore"
            )

            # ambil title sederhana
            m = re.search(r"<title>(.*?)</title>", content, re.I | re.S)
            judul = m.group(1).strip() if m else html_file.stem

            # preview TANPA arab
            preview = re.sub(r"<[^>]+>", " ", content)
            preview = re.sub(r"\s+", " ", preview)
            preview = preview[:300]

            cur.execute("""
                INSERT INTO dalil_clean (judul, tahun, preview, html_path)
                VALUES (?, ?, ?, ?)
            """, (
                judul,
                int(tahun) if tahun.isdigit() else None,
                preview,
                str(html_file.relative_to(BASE_DIR))
            ))

            total += 1

        except Exception as e:
            print("Skip:", html_file, e)

conn.commit()
conn.close()

print(f"✅ Import selesai. Total: {total}")