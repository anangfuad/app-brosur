"use client";

import { useState } from "react";

type Dalil = {
  id: number;
  judul: string;
  isi_indo: string;
  teks_arab?: string;
  html_path?: string;
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Dalil[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);

  const fetchResults = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data || []);
      } else {
        console.error("Failed to fetch results");
        setResults([]);
      }
    } catch (err) {
      console.error("Error fetching searching:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults(searchQuery);
  };

  const handleCopyWhatsApp = (e: React.MouseEvent, dalil: Dalil) => {
    e.stopPropagation(); // Mencegah modal terbuka saat tombol klik
    
    // Format bold untuk WA menggunakan asteris (*) dan italic menggunakan underscore (_)
    const text = `*${dalil.judul.trim()}*\n\n${
      dalil.teks_arab ? dalil.teks_arab.trim() + '\n\n' : ''
    }${dalil.isi_indo.trim()}\n\n_Sumber: App-Brosur v2_`;
    
    navigator.clipboard.writeText(text).then(() => {
      alert("Dalil berhasil disalin! Silakan paste di WhatsApp.");
    }).catch(err => {
      console.error("Gagal menyalin text:", err);
      alert("Gagal menyalin teks.");
    });
  };

  const openModal = (htmlPath?: string) => {
    if (htmlPath) {
      setSelectedHtml(`/chm_extractednew/${htmlPath}`);
    }
  };

  const closeModal = () => {
    setSelectedHtml(null);
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
      {/* Hero / Search Section */}
      <section className={`flex flex-col items-center justify-center space-y-6 transition-all duration-500 ${hasSearched ? 'pt-2 pb-4' : 'pt-10 pb-6'} text-center`}>
        {!hasSearched && (
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Cari <span className="text-primary">Dalil & Brosur</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Temukan ribuan referensi dalil dari koleksi brosur Islam dengan cepat dan mudah.
            </p>
          </div>
        )}

        <form 
          onSubmit={handleSearch}
          className="w-full max-w-xl relative group shadow-sm hover:shadow-md transition-shadow duration-300 rounded-full"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-32 py-4 bg-background border border-border rounded-full outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base sm:text-lg"
            placeholder="Cth: Puasa Ramadhan, Zakat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute inset-y-1.5 right-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full font-medium transition-colors active:scale-95 disabled:opacity-70 flex items-center gap-2 touch-manipulation"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : "Cari"}
          </button>
        </form>
      </section>

      {/* Results / Empty State */}
      <section className="flex flex-col items-center pt-4 w-full">
        {!hasSearched ? (
          <div className="bg-muted/50 rounded-2xl p-8 max-w-md w-full text-center space-y-4 border border-border/50">
            <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
            <h3 className="font-semibold text-lg">Mulai Pencarian</h3>
            <p className="text-sm text-muted-foreground">
              Ketik kata kunci di atas untuk mencari dalil dari database brosur.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {["Shalat", "Puasa", "Zakat", "Haji"].map((tag) => (
                <span 
                  key={tag} 
                  className="px-3 py-1 bg-background border border-border rounded-full text-xs font-medium text-foreground cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors" 
                  onClick={() => {
                    setSearchQuery(tag);
                    fetchResults(tag);
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              {isLoading ? "Mencari dalil..." : `Ditemukan ${results.length} hasil untuk "${searchQuery}"`}
            </h3>

            {results.length === 0 && !isLoading && (
              <div className="text-center py-12 border border-dashed rounded-xl border-border bg-muted/30 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 15h.01"/><path d="M11 8v4"/></svg>
                <p>Tidak ada dalil yang cocok dengan kata kunci tersebut.</p>
              </div>
            )}

            <div className="grid gap-4 w-full">
              {results.map((dalil) => (
                <div 
                  key={dalil.id} 
                  className="bg-background border border-border rounded-xl p-5 hover:shadow-md transition-all sm:p-6 cursor-pointer group"
                  onClick={() => openModal(dalil.html_path)}
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                      {dalil.judul}
                    </h4>
                    
                    <button 
                      onClick={(e) => handleCopyWhatsApp(e, dalil)}
                      className="shrink-0 text-primary bg-primary/10 hover:bg-primary hover:text-white p-2 text-sm rounded-full transition-colors flex items-center justify-center"
                      title="Salin untuk WhatsApp"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                  </div>
                  
                  {dalil.teks_arab && (
                    <div className="mb-4 text-right">
                      <p className="font-arabic text-2xl leading-loose text-foreground/90 font-medium" dir="rtl">
                        {dalil.teks_arab}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                    {dalil.isi_indo}
                  </p>

                  {dalil.html_path && (
                    <div className="mt-4 pt-4 border-t border-border/50 text-xs font-medium text-primary flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      Lihat Sumber Asli ({dalil.html_path})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* IFrame Modal for HTML File */}
      {selectedHtml && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-xl shadow-lg w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-foreground truncate pl-2">Viewer Brosur Asli</h3>
              <button 
                onClick={closeModal}
                className="bg-background border border-border rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Tutup"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 w-full bg-white relative">
              {/* Optional loader for iframe */}
              <div className="absolute inset-0 flex items-center justify-center -z-10">
                <svg className="animate-spin h-8 w-8 text-primary/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              </div>
              <iframe 
                src={selectedHtml || ""} 
                className="w-full h-full border-0 bg-transparent"
                title="Brosur Asli"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
