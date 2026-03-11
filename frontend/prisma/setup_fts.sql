-- Jalankan SQL ini di menu Vercel Postgres -> Storage -> Query Murni
-- Gunanya untuk menambahkan kolom tsvector dan index GIN (Full-Text Search) yang lebih optimal
-- Note: pastikan nama tabel (contoh: "Dalil") disesuaikan dengan yang di Prisma.

-- 1. Tambah kolom tsvector untuk bahasa indonesian
ALTER TABLE "Dalil" ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (to_tsvector('indonesian', isi_indo)) STORED;

-- 2. Buat GIN index di atas kolom tersebut
CREATE INDEX dalil_isi_indo_fts_idx ON "Dalil" USING GIN (search_vector);

-- 3. Saat query lewat Prisma / SQL Raw, gunakan:
-- SELECT * FROM "Dalil" WHERE search_vector @@ to_tsquery('indonesian', 'keyword');
