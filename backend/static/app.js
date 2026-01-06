// =========================
// GLOBAL STATE
// =========================
const API = "http://127.0.0.1:8000";

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
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

async function cari() {
  const q = document.getElementById("keyword").value.trim();
  const hasilDiv = document.getElementById("hasil");

  if (q.length < 2) {
    hasilDiv.innerHTML = "";
    return;
  }

  lastKeyword = q;
  hasilDiv.innerHTML = "Mencari…";

  const res = await fetch(`${API}/search/indo?q=${encodeURIComponent(q)}`);
  if (!res.ok) {
    hasilDiv.innerHTML = "Gagal mengambil data";
    return;
  }

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
        <button onclick="bukaDetail(${item.id})">Lihat selengkapnya</button>
      </div>
    `
    )
    .join("");
}

// =========================
// DETAIL VIEW
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
// 🔥 HIGHLIGHT DI IFRAME
// =========================
function highlightInIframe(keyword) {
  const iframe = document.getElementById("detailFrame");
  if (!iframe || !keyword) return;

  iframe.onload = () => {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return;

    highlights = [];
    activeIndex = -1;

    // 🔥 Inject CSS ke iframe (FIX UTAMA)
    const style = doc.createElement("style");
    style.innerHTML = `
      mark.hl {
        background: yellow;
        padding: 0 2px;
      }
      mark.hl.active {
        background: #39ff14;
        color: black;
      }
    `;
    doc.head.appendChild(style);

    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");

    const walker = doc.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const nodes = [];
    let node;

    while ((node = walker.nextNode())) {
      if (/[\u0600-\u06FF]/.test(node.nodeValue)) continue; // skip Arab
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
  highlights.forEach((el, i) => {
    el.classList.toggle("active", i === activeIndex);
  });

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
