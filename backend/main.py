from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
import sqlite3
import os

# =========================
# APP
# =========================
app = FastAPI(title="App Brosur v0.4")

# =========================
# BASE PATH (AMAN LINTAS OS)
# =========================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# =========================
# STATIC FILES
# =========================
STATIC_DIR = os.path.join(BASE_DIR, "backend", "static")

if os.path.isdir(STATIC_DIR):
    app.mount(
        "/static",
        StaticFiles(directory=STATIC_DIR, html=True),
        name="static"
    )
else:
    # optional log biar nggak crash di production
    print(f"[WARN] Static directory not found: {STATIC_DIR}")

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# DATABASE
# =========================
DB_PATH = os.path.join(BASE_DIR, "dalil.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# =========================
# ROOT
# =========================
@app.get("/")
def root():
    return {"status": "ok", "version": "v0.4"}


# =========================
# Helper: snippet kontekstual
# =========================
def make_snippet(text: str, keywords, radius=150):
    if not text:
        return ""

    lower = text.lower()

    for k in keywords:
        pos = lower.find(k)
        if pos != -1:
            start = max(0, pos - radius)
            end = min(len(text), pos + len(k) + radius)

            snippet = text[start:end].strip()

            if start > 0:
                snippet = "..." + snippet
            if end < len(text):
                snippet = snippet + "..."

            return snippet

    return text[:radius] + "..."


# =========================
# 🔍 SEARCH (isi terjemah)
# =========================
@app.get("/search/indo")
def search_indo(q: str = Query(..., min_length=2)):
    conn = get_conn()
    cur = conn.cursor()

    keywords = [k.lower() for k in q.split() if len(k) > 1]

    cur.execute("""
        SELECT id, judul, tahun, isi_indo
        FROM dalil_clean
        WHERE isi_indo LIKE ?
    """, (f"%{q}%",))

    rows = cur.fetchall()
    conn.close()

    results = []

    for r in rows:
        isi = r["isi_indo"] or ""
        isi_lower = isi.lower()

        score = sum(isi_lower.count(k) for k in keywords)

        if score > 0:
            snippet = make_snippet(isi, keywords)

            results.append({
                "id": r["id"],
                "judul": r["judul"],
                "tahun": r["tahun"],
                "preview": snippet,
                "score": score
            })

    results.sort(
        key=lambda x: (x["score"], x["tahun"] or 0),
        reverse=True
    )

    return results[:20]


# alias kompatibilitas
@app.get("/search")
def search_alias(q: str = Query(..., min_length=2)):
    return search_indo(q)


# =========================
# 📄 DETAIL DALIL (HTML ASLI)
# =========================
@app.get("/dalil/{dalil_id}")
def dalil_detail(dalil_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        "SELECT html_path FROM dalil_clean WHERE id=?",
        (dalil_id,)
    )
    row = cur.fetchone()
    conn.close()

    if not row or not row["html_path"]:
        raise HTTPException(status_code=404, detail="Dalil tidak ditemukan")

    html_path = os.path.join(BASE_DIR, row["html_path"])

    if not os.path.exists(html_path):
        raise HTTPException(status_code=404, detail="File HTML tidak ditemukan")

    # Baca binary (AMAN encoding Arab)
    with open(html_path, "rb") as f:
        content = f.read()

    return Response(
        content=content,
        media_type="text/html; charset=windows-1256"
    )
