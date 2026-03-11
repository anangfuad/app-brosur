from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
import sqlite3
import os

# =========================
# APP
# =========================
app = FastAPI(title="App Brosur v1.0")

# =========================
# BASE DIR
# Root project (/app di Railway)
# =========================
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# =========================
# STATIC FILES (Frontend)
# =========================
STATIC_DIR = os.path.join(BASE_DIR, "backend", "static")

if os.path.isdir(STATIC_DIR):
    app.mount(
        "/static",
        StaticFiles(directory=STATIC_DIR, html=True),
        name="static"
    )
else:
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
    return {"status": "ok", "version": "v1.0"}


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
# 🔍 SEARCH (isi terjemah Indonesia)
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
# 🔍 SEARCH V2 (Multi-kata, Konteks, Filter Tahun)
# =========================

# Kamus Sinonim (Bisa ditambah kapan saja)
SINONIM = {
    "ramadan":  ["ramadan", "ramadhan", "ramadlan", "romadhon", "romadhlan"],
    "ramadhan": ["ramadan", "ramadhan", "ramadlan", "romadhon", "romadhlan"],
    "ramadlan": ["ramadan", "ramadhan", "ramadlan", "romadhon", "romadhlan"],
    "shalat":   ["shalat", "sholat", "salat", "solat"],
    "sholat":   ["shalat", "sholat", "salat", "solat"],
    "salat":    ["shalat", "sholat", "salat", "solat"],
    "zakat":    ["zakat", "jakat"],
    "wudhu":    ["wudhu", "wudlu", "wudu"],
    "wudlu":    ["wudhu", "wudlu", "wudu"],
    "hadits":   ["hadits", "hadis", "hadith"],
    "hadis":    ["hadits", "hadis", "hadith"],
    "nasihat":  ["nasihat", "nasehat"],
    "nasehat":  ["nasihat", "nasehat"],
}

@app.get("/search/v2")
def search_v2(q: str = Query(..., min_length=2), tahun: int | None = None):
    conn = get_conn()
    cur = conn.cursor()

    # Pisahkan kata kunci dan ubah jadi lowercase
    raw_keywords = q.split()
    base_keywords = [k.lower() for k in raw_keywords if len(k) > 1]
    
    if not base_keywords:
        return []

    # Ekspansi sinonim
    expanded_keywords = []
    for k in base_keywords:
        if k in SINONIM:
            expanded_keywords.extend(SINONIM[k])
        else:
            expanded_keywords.append(k)
            
    # Hapus duplikat dari ekspansi
    keywords = list(set(expanded_keywords))

    # Bangun query OR untuk membatasi hasil pencarian dari DB
    or_conditions = []
    params = []
    
    for k in keywords:
        or_conditions.append("isi_indo LIKE ?")
        params.append(f"%{k}%")
        
    where_clause = " OR ".join(or_conditions)
    
    # Filter tahun jika ada
    if tahun is not None:
        where_clause = f"({where_clause}) AND tahun = ?"
        params.append(tahun)

    query = f"""
        SELECT id, judul, tahun, isi_indo
        FROM dalil_clean
        WHERE {where_clause}
    """
    
    cur.execute(query, tuple(params))
    rows = cur.fetchall()
    conn.close()

    results = []
    q_lower = q.lower().strip()

    for r in rows:
        isi = r["isi_indo"] or ""
        isi_lower = isi.lower()

        score = 0
        matches = 0

        # Hitung frekuensi per kata (Layer 3 & 4 base)
        matched_keywords = []
        for k in keywords:
            count = isi_lower.count(k)
            if count > 0:
                matched_keywords.append(k)
                score += count # Skor berdasar frekuensi
        
        matches = len(matched_keywords)
        
        # Layer 3: Context Match (Skor berdasar kepadatan unik kata yang cocok)
        score += (matches * 100)
        
        # Limit frequency score impact for single word searches
        if len(base_keywords) == 1:
            # For single words, cap frequency score so year has more impact
            score = min(score, 110) # 100 from match + max 10 from freq
            
        # Layer 2: AND Match (Semua kata dasar ada, meski terpisah)
        # Note: we check against base_keywords length, not expanded keywords
        base_match_count = sum(1 for bk in base_keywords if any(ek in matched_keywords for ek in SINONIM.get(bk, [bk])))
        if base_match_count == len(base_keywords) and len(base_keywords) > 1:
            score += 500
            
        # Layer 1: Phrase Match (Skor terbesar jika berurutan persis)
        # Check if any variation of the exact phrase exists
        if q_lower in isi_lower:
            score += 2000

        if score > 0:
            # Gunakan semua keyword untuk snippet agar highligting lebih maksimal
            snippet = make_snippet(isi, keywords)

            results.append({
                "id": r["id"],
                "judul": r["judul"],
                "tahun": r["tahun"],
                "preview": snippet,
                "score": score,
                "matches": matches
            })

    # Urutkan berdasar: 
    # 1. Skor (Phrase > AND > Context)
    # 2. MATCHES (Berapa kata unik yang kena)
    # 3. TAHUN (Terbaru di atas)
    results.sort(
        key=lambda x: (x["score"] // 100, x["matches"], x["tahun"] or 0, x["score"] % 100),
        reverse=True
    )

    return results[:20]


# =========================
# 📄 DETAIL DALIL (HTML ASLI CHM)
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

    # 🔥 FIX UTAMA: normalisasi path Windows → Linux
    rel_path = row["html_path"].replace("\\", "/").lstrip("/")
    html_path = os.path.abspath(os.path.join(BASE_DIR, rel_path))

    # log debug (muncul di Railway)
    print("BASE_DIR :", BASE_DIR)
    print("HTML PATH:", html_path)

    if not os.path.isfile(html_path):
        raise HTTPException(
            status_code=404,
            detail=f"File HTML tidak ditemukan: {rel_path}"
        )

    # baca binary (AMAN encoding Arab)
    with open(html_path, "rb") as f:
        content = f.read()

    return Response(
        content=content,
        media_type="text/html; charset=windows-1256"
    )

# =========================
# 📚 BACA BROSUR (MODE GABUT)
# =========================
@app.get("/brosur")
def list_brosur(tahun: int | None = None):
    conn = get_conn()
    cur = conn.cursor()

    if tahun:
        cur.execute("""
            SELECT id, judul, tahun
            FROM dalil_clean
            WHERE tahun = ?
            ORDER BY judul ASC
        """, (tahun,))
    else:
        cur.execute("""
            SELECT id, judul, tahun
            FROM dalil_clean
            ORDER BY tahun DESC, judul ASC
        """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": r["id"],
            "judul": r["judul"],
            "tahun": r["tahun"]
        }
        for r in rows
    ]
