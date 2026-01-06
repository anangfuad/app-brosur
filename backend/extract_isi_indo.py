import sqlite3
import os
import re
from bs4 import BeautifulSoup

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "dalil.db")


def is_latin_text(text: str) -> bool:
    """
    Anggap teks Indonesia jika mayoritas karakter ASCII / latin
    """
    if not text:
        return False

    latin_chars = sum(1 for c in text if ord(c) < 128)
    return latin_chars / len(text) > 0.7


def clean_text(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_isi_indo_from_html(html_path: str) -> str:
    with open(html_path, "r", encoding="windows-1256", errors="ignore") as f:
        soup = BeautifulSoup(f, "html.parser")

    # buang script & style
    for tag in soup(["script", "style"]):
        tag.decompose()

    texts = []

    for el in soup.find_all(["p", "div", "span"]):
        t = el.get_text(separator=" ", strip=True)
        if len(t) < 20:
            continue
        if is_latin_text(t):
            texts.append(t)

    return clean_text(" ".join(texts))


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("""
        SELECT id, html_path
        FROM dalil_clean
        WHERE isi_indo IS NULL
          AND html_path IS NOT NULL
    """)

    rows = cur.fetchall()
    print(f"🔍 Ditemukan {len(rows)} dalil untuk diproses")

    for r in rows:
        html_file = os.path.join(BASE_DIR, r["html_path"])
        if not os.path.exists(html_file):
            continue

        isi_indo = extract_isi_indo_from_html(html_file)

        if len(isi_indo) < 100:
            # terlalu pendek → skip (kemungkinan gagal extract)
            continue

        cur.execute(
            "UPDATE dalil_clean SET isi_indo=? WHERE id=?",
            (isi_indo, r["id"])
        )

        print(f"✅ Dalil {r['id']} terisi ({len(isi_indo)} chars)")

    conn.commit()
    conn.close()
    print("🎉 Selesai")


if __name__ == "__main__":
    main()
