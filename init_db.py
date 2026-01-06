import sqlite3

conn = sqlite3.connect("dalil.db")
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS dalil_clean (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    judul TEXT,
    tahun INTEGER,
    preview TEXT,
    html_path TEXT
)
""")

conn.commit()
conn.close()

print("✅ Database dalil.db siap")