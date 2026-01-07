# 📚 APP-BROSUR v1

Aplikasi web ringan untuk **pencarian dalil berbasis terjemah Indonesia**, dengan tampilan HTML asli hasil ekstraksi CHM.

Project ini dirancang **sederhana, stabil, dan ramah deployment gratis**, tanpa framework frontend berat.

---

## 🎯 Tujuan Aplikasi

- Memudahkan pencarian dalil berdasarkan **terjemah Bahasa Indonesia**
- Menampilkan **preview kontekstual** hasil pencarian
- Menyajikan **dokumen HTML asli** sebagai rujukan (bukan UI)
- Nyaman dibaca di **mobile maupun desktop**

---

## ✨ Fitur Utama

- 🔍 Search cepat & relevan (kolom `isi_indo`)
- 🧩 Snippet preview kontekstual
- 📄 Detail dalil dalam **HTML asli (iframe)**
- 🖍️ Highlight keyword (skip teks Arab)
- ⬆⬇ Navigasi highlight (next / prev)
- 📱 Mobile-friendly (tanpa merusak desktop)

---

## 🧠 Konsep Arsitektur

Pemisahan tegas antara **UI layer** dan **Content layer**:

- **UI Layer**

  - Search
  - List hasil
  - Preview snippet
  - Menggunakan card / box

- **Content Layer**

  - HTML brosur hasil ekstrak CHM
  - Ditampilkan apa adanya
  - **Tanpa box / styling UI**
  - Fokus sebagai dokumen rujukan

---

## 🏗️ Struktur Folder (FINAL – WAJIB DIPERTAHANKAN)

```
app-brosur/
├── backend/
│   ├── static/
│   │   ├── index.html   # Frontend utama
│   │   ├── app.js       # Logic frontend
│   │   └── style.css    # Styling UI
│   └── main.py          # FastAPI (Linux-safe)
│
├── chm_extractednew/    # HTML hasil ekstraksi CHM (WAJIB di root)
│   ├── 1998/
│   ├── 2013/
│   └── ...
│
├── dalil.db             # SQLite database (WAJIB di root)
├── requirements.txt
├── .gitignore
└── README.md
```

❗ **Catatan penting**:

- `chm_extractednew/` **tidak boleh** berada di dalam `backend/`
- `dalil.db` **harus** di root project
- Struktur di atas sudah **final dan stabil**

---

## 🧩 Teknologi yang Digunakan

- **Backend**: FastAPI
- **Database**: SQLite
- **Frontend**: HTML + CSS + Vanilla JavaScript
- **Hosting**: Railway (gratis)
- **OS Dev**: Windows 11
- **Server Target**: Linux

---

## 🔥 Masalah Kritis & Solusi

### ❌ Masalah

Path HTML di database masih menggunakan format Windows:

```
chm_extractednew\1998\19980118.htm
```

Di server Linux (Railway), path ini **tidak dikenali**.

---

### ✅ Solusi Final (SUDAH DITERAPKAN)

Normalisasi path di `backend/main.py`:

```python
rel_path = row["html_path"].replace("\\", "/").lstrip("/")
html_path = os.path.abspath(os.path.join(BASE_DIR, rel_path))
```

Hasil path valid di Linux:

```
/app/chm_extractednew/1998/19980118.htm
```

✔ File HTML terbaca
✔ iframe tampil normal
✔ Highlight bekerja

---

## 🚀 Cara Menjalankan (Local)

### 1️⃣ Install dependency

```bash
pip install -r requirements.txt
```

### 2️⃣ Jalankan server

```bash
uvicorn backend.main:app --reload
```

### 3️⃣ Akses aplikasi

```
http://127.0.0.1:8000
```

---

## ☁️ Cara Deploy (Railway)

1. Push project ke GitHub
2. Hubungkan repo ke Railway
3. Railway akan otomatis:

   - Install dependency
   - Menjalankan FastAPI

4. Akses via subdomain Railway

> Tidak perlu konfigurasi server manual

---

## 🔐 Keamanan & Batasan

- CORS dibatasi seperlunya
- Tidak ada autentikasi (read-only)
- Cocok untuk:

  - Aplikasi rujukan
  - Internal komunitas
  - Public reference ringan

---

## 📦 Backup Data (Disarankan)

Secara berkala backup:

- `dalil.db`
- Folder `chm_extractednew/`

Bisa dikompres:

```bash
zip -r backup-app-brosur.zip dalil.db chm_extractednew/
```

---

## 📌 Status Proyek

- ✅ **STABIL**
- ✅ **DEPLOY BERHASIL**
- ✅ **MOBILE & DESKTOP AMAN**
- 🏷️ Versi: **app-brosur v1 (final stabil)**

---

## 🙏 Penutup

Aplikasi ini dibuat dengan prinsip:

> _Sederhana, fungsional, dan menghormati konten sebagai ilmu._

Bukan sekadar UI, tapi **alat bantu rujukan**.

---

Jika ingin melanjutkan pengembangan:

- Versi v2 (fitur lanjutan)
- Domain custom
- Cache & optimasi performa

Silakan lanjutkan sesuai kebutuhan 🙌
