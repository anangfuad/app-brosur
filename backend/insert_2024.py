import os
import sqlite3
from bs4 import BeautifulSoup

# =========================
# PATH
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# DATABASE UTAMA (SATU DENGAN BACKEND)
DB_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "..", "dalil.db")
)

# FOLDER HTML 2024 (REKURSIF)
HTML_DIR = os.path.abspath(
    os.path.join(BASE_DIR, "..", "chm_extractednew", "2024")
)

# =========================
# VALIDASI AWAL
# =========================
if not os.path.exists(DB_PATH):
    raise FileNotFoundError(f"❌ Database tidak ditemukan: {DB_PATH}")

if not os.path.exists(HTML_DIR):
    raise FileNotFoundError(f"❌ Folder HTML tidak ditemukan: {HTML_DIR}")

# =========================
# KONEKSI DB
# =========================
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# =========================
# SCAN FILE HTML (REKURSIF)
# =========================
html_files = []

for root, dirs, files in os.walk(HTML_DIR):
    for f in files:
        if f.lower().endswith((".htm", ".html")):

            html_files.append(os.path.join(root, f))

print(f"📂 Ditemukan {len(html_files)} file HTML tahun 2024")

inserted = 0
skipped = 0

# =========================
# INSERT DATA
# =========================
for file_path in html_files:
    try:
        with open(file_path, "r", encoding="windows-1256", errors="ignore") as f:
            soup = BeautifulSoup(f.read(), "html.parser")

        text = soup.get_text(separator=" ", strip=True)

        if not text or len(text) < 200:
            skipped += 1
            continue

        judul = soup.title.string.strip() if soup.title else os.path.basename(file_path)
        isi_indo = text
        preview_indo = text[:300]

        # RELATIVE PATH UNTUK BACKEND
        rel_path = os.path.relpath(
            file_path,
            os.path.join(BASE_DIR, "..")
        ).replace("\\", "/")

        cursor.execute("""
            INSERT INTO dalil_clean
            (judul, tahun, preview_indo, isi_indo, html_path)
            VALUES (?, ?, ?, ?, ?)
        """, (
            judul,
            2024,
            preview_indo,
            isi_indo,
            rel_path
        ))

        inserted += 1

    except Exception as e:
        print(f"⚠️ Gagal proses: {file_path}")
        print(f"   Error: {e}")
        skipped += 1

# =========================
# COMMIT & CLOSE
# =========================
conn.commit()
conn.close()

print(f"✅ Berhasil insert {inserted} dalil tahun 2024")
print(f"⏭️ Dilewati {skipped} file (kosong / error)")
