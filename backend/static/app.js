// =========================
// GLOBAL STATE
// =========================
const API = "";

let timer = null;
let lastKeyword = "";

let highlights = [];
let activeIndex = -1;

// =========================
// SEARCH HANDLER
// =========================
function handleInput() {
  clearTimeout(timer);
  timer = setTimeout(cari, 400);
}

function highlight(text, keyword) {
  if (!keyword) return text;
  
  // Pisahkan kata, hapus spasi ekstra, dan buang kata pendek (< 2 huruf)
  const keywords = keyword.split(/\s+/).filter(k => k.length > 1);
  if (!keywords.length) return text;

  // Escape masing-masing kata lalu gabung dengan OR (|)
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

async function cari() {
  const q = document.getElementById("keyword").value.trim();
  const searchTahun = document.getElementById("searchTahunSelect").value;
  const hasilDiv = document.getElementById("hasil");

  if (q.length < 2) {
    hasilDiv.innerHTML = "";
    return;
  }

  lastKeyword = q;
  hasilDiv.innerHTML = "Mencari…";

  try {
    let url = `${API}/search/v2?q=${encodeURIComponent(q)}`;
    if (searchTahun) {
      url += `&tahun=${searchTahun}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");

    const data = await res.json();

    if (data.length === 0) {
      hasilDiv.innerHTML = "<p>Tidak ditemukan.</p>";
      return;
    }

    hasilDiv.innerHTML = data
      .map(
        (item) => `
        <div class="card">
          <h3>${item.judul || "Tanpa Judul"}</h3>
          <div class="tahun">Tahun: ${item.tahun || "-"}</div>
          <p>${highlight(item.preview, q)}</p>
          <button onclick="bukaDetail(${item.id})">
            Lihat selengkapnya
          </button>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error(err);
    hasilDiv.innerHTML = "Gagal mengambil data";
  }
}

// =========================
// DETAIL VIEW (SEARCH MODE)
// =========================
function bukaDetail(id) {
  const hasilDiv = document.getElementById("hasil");

  hasilDiv.innerHTML = `
    <div id="highlightNav" class="highlight-nav hidden">
      <button onclick="prevHighlight()">⬆</button>
      <span id="counter">0 / 0</span>
      <button onclick="nextHighlight()">⬇</button>
    </div>

    <button onclick="kembali()">← Kembali ke hasil</button>

    <iframe id="detailFrame" src="${API}/dalil/${id}"></iframe>
  `;

  highlightInIframe(lastKeyword);
}

function kembali() {
  document.getElementById("keyword").value = lastKeyword;
  cari();
}

// =========================
// HIGHLIGHT DI IFRAME
// =========================
function highlightInIframe(keyword) {
  const iframe = document.getElementById("detailFrame");
  if (!iframe || !keyword) return;

  iframe.onload = () => {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return;

    highlights = [];
    activeIndex = -1;

    const style = doc.createElement("style");
    style.innerHTML = `
      mark.hl { background: yellow; }
      mark.hl.active { background: #39ff14; color: black; }
    `;
    doc.head.appendChild(style);

    // Pisahkan kata, hapus spasi ekstra, dan buang kata pendek (< 2 huruf)
    const keywords = keyword.split(/\s+/).filter(k => k.length > 1);
    if (!keywords.length) return;

    // Escape masing-masing kata lalu gabung dengan OR (|)
    const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const regex = new RegExp(`(${escaped})`, "gi");

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let node;

    while ((node = walker.nextNode())) {
      if (/[\u0600-\u06FF]/.test(node.nodeValue)) continue;
      if (regex.test(node.nodeValue)) nodes.push(node);
    }

    nodes.forEach((textNode) => {
      const span = doc.createElement("span");
      span.innerHTML = textNode.nodeValue.replace(
        regex,
        '<mark class="hl">$1</mark>'
      );
      textNode.parentNode.replaceChild(span, textNode);
    });

    highlights = Array.from(doc.querySelectorAll("mark.hl"));

    if (highlights.length > 0) {
      activeIndex = 0;
      setActiveHighlight();
      document.getElementById("highlightNav").classList.remove("hidden");
    }
  };
}

// =========================
// NAVIGASI HIGHLIGHT
// =========================
function setActiveHighlight() {
  highlights.forEach((el, i) =>
    el.classList.toggle("active", i === activeIndex)
  );

  document.getElementById("counter").textContent = `${activeIndex + 1} / ${
    highlights.length
  }`;

  highlights[activeIndex].scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function nextHighlight() {
  if (!highlights.length) return;
  activeIndex = (activeIndex + 1) % highlights.length;
  setActiveHighlight();
}

function prevHighlight() {
  if (!highlights.length) return;
  activeIndex = (activeIndex - 1 + highlights.length) % highlights.length;
  setActiveHighlight();
}

// =========================
// MODE GABUT - BACA BROSUR
// =========================
let brosurData = [];
let tahunTerakhirDipilih = "";

async function loadBrosur() {
  const listDiv = document.getElementById("brosurList");
  const select = document.getElementById("tahunSelect");

  listDiv.innerHTML = "Memuat brosur…";
  select.innerHTML = `<option value="">-- Pilih Tahun --</option>`;

  try {
    const res = await fetch(`${API}/brosur`);
    if (!res.ok) throw new Error("Gagal fetch /brosur");

    brosurData = await res.json();

    if (brosurData.length === 0) {
      listDiv.innerHTML = "Tidak ada data brosur.";
      return;
    }

    const years = [...new Set(brosurData.map((b) => b.tahun))].sort(
      (a, b) => b - a
    );

    const searchSelect = document.getElementById("searchTahunSelect");

    years.forEach((y) => {
      // Untuk menu baca brosur
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      select.appendChild(opt);

      // Untuk menu filter pencarian
      if (searchSelect) {
        const optSearch = document.createElement("option");
        optSearch.value = y;
        optSearch.textContent = y;
        searchSelect.appendChild(optSearch);
      }
    });

    listDiv.innerHTML = "Silakan pilih tahun.";
  } catch (err) {
    console.error(err);
    listDiv.innerHTML = "Gagal memuat brosur.";
  }
}

function renderBrosurByTahun() {
  const tahun = document.getElementById("tahunSelect").value;
  tahunTerakhirDipilih = tahun;

  const listDiv = document.getElementById("brosurList");

  if (!tahun) {
    listDiv.innerHTML = "";
    return;
  }

  const filtered = brosurData.filter((b) => String(b.tahun) === tahun);

  listDiv.innerHTML = `
    <div class="brosur-cards">
      ${filtered
        .map(
          (b) => `
        <div class="brosur-card"
             onclick="bukaBrosur(${b.id})">
          <div class="brosur-judul">
            ${b.judul || "Tanpa Judul"}
          </div>
          <div class="brosur-meta">
            Tahun ${b.tahun}
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

// =========================
// BUKA BROSUR (IFRAME MODE)
// =========================
function bukaBrosur(id) {
  document.querySelector(".brosur-filter").style.display = "none";
  document.getElementById("brosurList").style.display = "none";

  const iframe = document.getElementById("detailFrame");
  iframe.src = `${API}/dalil/${id}`;
  iframe.style.display = "block";

  document.getElementById("btnBack").style.display = "inline-block";
}

// =========================
// KEMBALI KE LIST BROSUR
// =========================
function kembaliKeBrosur() {
  const iframe = document.getElementById("detailFrame");
  iframe.src = "";
  iframe.style.display = "none";

  document.querySelector(".brosur-filter").style.display = "block";
  document.getElementById("brosurList").style.display = "block";

  document.getElementById("btnBack").style.display = "none";

  document.getElementById("tahunSelect").value = tahunTerakhirDipilih;
  renderBrosurByTahun();
}

// =========================
// INIT
// =========================
loadBrosur();
