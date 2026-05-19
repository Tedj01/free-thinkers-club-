import { useState, useRef, useEffect } from "react";
import { ADMIN_USERNAME, ADMIN_PASSWORD } from "./config.js";

const PAPERS_STORAGE_KEY = "ftc_papers";

function loadPapers() {
  try {
    const raw = localStorage.getItem(PAPERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePapers(papers) {
  try {
    localStorage.setItem(PAPERS_STORAGE_KEY, JSON.stringify(papers));
  } catch {
    /* storage full or unavailable */
  }
}

const CATEGORIES = ["All", "Philosophy", "Science & Society", "Microbiology", "Neuroscience & Philosophy", "Economics", "Political Theory", "Technology & Ethics", "History of Ideas", "Other"];

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}

function StarRating({ value, onChange, readOnly }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => !readOnly && onChange && onChange(n)}
          onMouseEnter={() => !readOnly && setHovered(n)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          style={{
            cursor: readOnly ? "default" : "pointer",
            fontSize: 18,
            color: n <= (hovered || value) ? "#C4872A" : "#d1c9b8",
            transition: "color 0.15s"
          }}
        >★</span>
      ))}
    </div>
  );
}

function Modal({ children, onClose }) {
  useEffect(() => {
    const handler = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, maxWidth: 680, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [papers, setPapers] = useState(loadPapers);

  useEffect(() => {
    savePapers(papers);
  }, [papers]);
  const [view, setView] = useState("home"); // home | submit | admin-login | admin
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [submitForm, setSubmitForm] = useState({ title: "", author: "", abstract: "", category: "Philosophy", file: null });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reviewForm, setReviewForm] = useState({ reviewer: "", rating: 5, comment: "" });
  const [notification, setNotification] = useState(null);
  const fileRef = useRef();

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredPapers = papers.filter(p => {
    const matchCat = filterCategory === "All" || p.category === filterCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q) || p.abstract.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleLogin = () => {
    if (loginForm.username === ADMIN_USERNAME && loginForm.password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setView("home");
      setLoginError("");
      notify("Welcome back, Admin.");
    } else {
      setLoginError("Invalid credentials. Please try again.");
    }
  };

  const handleSubmit = () => {
    if (!submitForm.title || !submitForm.author || !submitForm.abstract) {
      notify("Please fill in all required fields.", "error");
      return;
    }
    const newPaper = {
      id: Date.now(),
      title: submitForm.title,
      author: submitForm.author,
      abstract: submitForm.abstract,
      category: submitForm.category,
      publishedAt: new Date().toISOString(),
      downloads: 0,
      reviews: [],
      fileName: submitForm.file ? submitForm.file.name : "paper.pdf"
    };
    setPapers(prev => [newPaper, ...prev]);
    setSubmitSuccess(true);
    setSubmitForm({ title: "", author: "", abstract: "", category: "Philosophy", file: null });
    setTimeout(() => { setSubmitSuccess(false); setView("home"); }, 2500);
  };

  const handleDelete = (id) => {
    setPapers(prev => prev.filter(p => p.id !== id));
    notify("Publication deleted.");
  };

  const handleAddReview = () => {
    if (!reviewForm.reviewer || !reviewForm.comment) {
      notify("Please fill in your name and comment.", "error");
      return;
    }
    const newReview = {
      id: Date.now(),
      reviewer: reviewForm.reviewer,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      date: new Date().toISOString().split("T")[0]
    };
    setPapers(prev => prev.map(p => p.id === reviewModal ? { ...p, reviews: [...p.reviews, newReview] } : p));
    setReviewForm({ reviewer: "", rating: 5, comment: "" });
    setReviewModal(null);
    if (selectedPaper) setSelectedPaper(prev => ({ ...prev, reviews: [...prev.reviews, newReview] }));
    notify("Review submitted. Thank you!");
  };

  const avgRating = (reviews) => reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;

  const styles = {
    app: { minHeight: "100vh", background: "#F7F3EC", fontFamily: "'Georgia', serif", color: "#1a1208" },
    nav: { background: "#1a1208", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100 },
    logo: { fontFamily: "'Georgia', serif", fontSize: 18, color: "#F0E6CC", letterSpacing: "0.05em", cursor: "pointer", fontStyle: "italic" },
    logoAccent: { color: "#C4872A", fontStyle: "normal", marginRight: 6 },
    navLinks: { display: "flex", gap: 8, alignItems: "center" },
    navBtn: { background: "none", border: "none", color: "#b5a882", fontSize: 14, cursor: "pointer", padding: "6px 14px", borderRadius: 6, fontFamily: "inherit", letterSpacing: "0.03em", transition: "color 0.2s, background 0.2s" },
    navBtnActive: { color: "#F0E6CC", background: "rgba(196,135,42,0.18)" },
    adminBadge: { background: "#C4872A", color: "#1a1208", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, marginLeft: 6, letterSpacing: "0.05em" },
    hero: { background: "linear-gradient(135deg, #1a1208 0%, #2d1f0a 50%, #1a1208 100%)", padding: "5rem 2rem 4rem", textAlign: "center", position: "relative", overflow: "hidden" },
    heroPattern: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(196,135,42,0.07) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(196,135,42,0.05) 0%, transparent 40%)", pointerEvents: "none" },
    heroTitle: { fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#F0E6CC", marginBottom: "1rem", fontStyle: "italic", lineHeight: 1.2 },
    heroSub: { fontSize: 16, color: "#a09070", maxWidth: 560, margin: "0 auto 2rem", lineHeight: 1.8, fontFamily: "sans-serif" },
    heroCta: { display: "inline-block", background: "#C4872A", color: "#1a1208", padding: "12px 32px", borderRadius: 8, border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em", fontFamily: "sans-serif" },
    section: { maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem" },
    sectionTitle: { fontSize: 24, color: "#1a1208", marginBottom: "0.5rem", fontStyle: "italic" },
    sectionLine: { width: 48, height: 2, background: "#C4872A", marginBottom: "2rem", borderRadius: 2 },
    filterRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" },
    searchBox: { border: "1.5px solid #d4c5a9", borderRadius: 8, padding: "8px 14px", fontSize: 14, fontFamily: "sans-serif", background: "#fff", color: "#1a1208", outline: "none", minWidth: 200, flex: 1 },
    catBtn: { border: "1.5px solid #d4c5a9", borderRadius: 20, padding: "5px 14px", fontSize: 13, cursor: "pointer", fontFamily: "sans-serif", transition: "all 0.2s", background: "#fff", color: "#7a6040" },
    catBtnActive: { background: "#C4872A", borderColor: "#C4872A", color: "#fff" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 },
    card: { background: "#fff", border: "1.5px solid #e8dcc8", borderRadius: 14, padding: "1.5rem", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", position: "relative" },
    cardCategory: { fontSize: 11, letterSpacing: "0.12em", color: "#C4872A", fontFamily: "sans-serif", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 },
    cardTitle: { fontSize: 17, color: "#1a1208", marginBottom: 6, lineHeight: 1.4, fontStyle: "italic" },
    cardAuthor: { fontSize: 13, color: "#7a6040", fontFamily: "sans-serif", marginBottom: 10 },
    cardAbstract: { fontSize: 13, color: "#5a4a30", lineHeight: 1.7, fontFamily: "sans-serif", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" },
    cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid #e8dcc8" },
    cardMeta: { fontSize: 12, color: "#a09070", fontFamily: "sans-serif" },
    badge: { background: "#F0E6CC", color: "#7a5010", fontSize: 12, padding: "3px 10px", borderRadius: 20, fontFamily: "sans-serif" },
    btn: { border: "1.5px solid #C4872A", borderRadius: 8, padding: "8px 20px", fontSize: 14, cursor: "pointer", fontFamily: "sans-serif", transition: "all 0.2s" },
    btnPrimary: { background: "#C4872A", color: "#fff", border: "none" },
    btnOutline: { background: "transparent", color: "#C4872A" },
    btnDanger: { background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "sans-serif" },
    input: { width: "100%", border: "1.5px solid #d4c5a9", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "sans-serif", color: "#1a1208", outline: "none", background: "#fff", boxSizing: "border-box" },
    label: { fontSize: 13, color: "#7a6040", fontFamily: "sans-serif", fontWeight: 600, marginBottom: 5, display: "block", letterSpacing: "0.03em" },
    formGroup: { marginBottom: "1.25rem" },
    textarea: { width: "100%", border: "1.5px solid #d4c5a9", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "sans-serif", color: "#1a1208", outline: "none", background: "#fff", boxSizing: "border-box", minHeight: 110, resize: "vertical" },
  };

  const navItem = (label, target) => (
    <button
      style={{ ...styles.navBtn, ...(view === target ? styles.navBtnActive : {}) }}
      onClick={() => setView(target)}
    >{label}</button>
  );

  return (
    <div style={styles.app}>
      {/* Notification */}
      {notification && (
        <div style={{ position: "fixed", top: 80, right: 20, zIndex: 2000, background: notification.type === "error" ? "#c0392b" : "#1a6632", color: "#fff", padding: "10px 20px", borderRadius: 10, fontFamily: "sans-serif", fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          {notification.msg}
        </div>
      )}

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.logo} onClick={() => setView("home")}>
          <span style={styles.logoAccent}>✦</span> Free Thinkers Club
        </div>
        <div style={styles.navLinks}>
          {navItem("Publications", "home")}
          {navItem("Submit Paper", "submit")}
          {isAdmin ? (
            <span style={styles.adminBadge}>ADMIN</span>
          ) : (
            <button style={{ ...styles.navBtn, color: "#C4872A" }} onClick={() => setView("admin-login")}>Admin Login</button>
          )}
          {isAdmin && (
            <button style={{ ...styles.navBtn, color: "#e88" }} onClick={() => { setIsAdmin(false); notify("Logged out."); }}>Logout</button>
          )}
        </div>
      </nav>

      {/* Hero */}
      {view === "home" && (
        <div style={styles.hero}>
          <div style={styles.heroPattern} />
          <div style={{ position: "relative" }}>
            <p style={{ fontFamily: "sans-serif", fontSize: 12, color: "#C4872A", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.5rem" }}>Open Academic Exchange</p>
            <h1 style={styles.heroTitle}>Where ideas breathe freely.</h1>
            <p style={styles.heroSub}>An open platform for sharing, reviewing, and downloading independent research. No gatekeeping. No paywalls. Pure intellectual exchange.</p>
            <button style={styles.heroCta} onClick={() => setView("submit")}>Submit Your Research</button>
          </div>
        </div>
      )}

      {/* Publications */}
      {view === "home" && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Published Works</h2>
          <div style={styles.sectionLine} />

          <div style={styles.filterRow}>
            <input
              type="text"
              placeholder="Search by title, author, or keywords…"
              style={styles.searchBox}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={styles.filterRow}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                style={{ ...styles.catBtn, ...(filterCategory === cat ? styles.catBtnActive : {}) }}
                onClick={() => setFilterCategory(cat)}
              >{cat}</button>
            ))}
          </div>

          {filteredPapers.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <p style={{ fontFamily: "sans-serif", color: "#a09070", fontSize: 15, marginBottom: 8 }}>{searchQuery || filterCategory !== "All" ? "No papers found matching your search." : "No papers published yet."}</p>
              {!searchQuery && filterCategory === "All" && <button style={{ ...styles.btn, ...styles.btnOutline, marginTop: 8 }} onClick={() => setView("submit")}>Be the first to submit a paper →</button>}
            </div>
          )}

          <div style={styles.grid}>
            {filteredPapers.map(paper => (
              <div
                key={paper.id}
                style={styles.card}
                onClick={() => setSelectedPaper(paper)}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.10)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <div style={styles.cardCategory}>{paper.category}</div>
                <h3 style={styles.cardTitle}>{paper.title}</h3>
                <p style={styles.cardAuthor}>{paper.author}</p>
                <p style={{ ...styles.cardMeta, marginBottom: 10, fontFamily: "sans-serif", fontSize: 12, color: "#a09070" }}>Published: {formatDateTime(paper.publishedAt)}</p>
                <p style={styles.cardAbstract}>{paper.abstract}</p>
                <div style={styles.cardFooter}>
                  <span style={styles.cardMeta}>⬇ {paper.downloads} downloads · {paper.reviews.length} review{paper.reviews.length !== 1 ? "s" : ""}</span>
                  {avgRating(paper.reviews) && <span style={styles.badge}>★ {avgRating(paper.reviews)}</span>}
                </div>
                {isAdmin && (
                  <button
                    style={{ ...styles.btnDanger, position: "absolute", top: 12, right: 12, fontSize: 12, padding: "4px 10px" }}
                    onClick={e => { e.stopPropagation(); handleDelete(paper.id); }}
                  >Delete</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Paper */}
      {view === "submit" && (
        <div style={{ ...styles.section, maxWidth: 700 }}>
          <h2 style={styles.sectionTitle}>Submit a Paper</h2>
          <div style={styles.sectionLine} />
          {submitSuccess ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", borderRadius: 14, border: "1.5px solid #e8dcc8" }}>
              <div style={{ fontSize: 48, marginBottom: "1rem" }}>✦</div>
              <h3 style={{ fontStyle: "italic", color: "#1a1208", marginBottom: "0.5rem" }}>Paper Submitted!</h3>
              <p style={{ fontFamily: "sans-serif", color: "#7a6040" }}>Your research has been added to the Free Thinkers Club. Redirecting…</p>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8dcc8", padding: "2rem" }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Paper Title *</label>
                <input style={styles.input} placeholder="The full title of your paper" value={submitForm.title} onChange={e => setSubmitForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Author Name *</label>
                <input style={styles.input} placeholder="Your name or institution" value={submitForm.author} onChange={e => setSubmitForm(p => ({ ...p, author: e.target.value }))} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select style={styles.input} value={submitForm.category} onChange={e => setSubmitForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Abstract *</label>
                <textarea style={styles.textarea} placeholder="A clear summary of your research, its methodology, and key findings…" value={submitForm.abstract} onChange={e => setSubmitForm(p => ({ ...p, abstract: e.target.value }))} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Upload PDF</label>
                <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setSubmitForm(p => ({ ...p, file: e.target.files[0] }))} />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button style={{ ...styles.btn, ...styles.btnOutline }} onClick={() => fileRef.current.click()}>Choose File</button>
                  <span style={{ fontSize: 13, color: "#a09070", fontFamily: "sans-serif" }}>{submitForm.file ? submitForm.file.name : "No file selected"}</span>
                </div>
              </div>
              <button style={{ ...styles.btn, ...styles.btnPrimary, padding: "11px 32px", fontSize: 15 }} onClick={handleSubmit}>Submit Paper →</button>
            </div>
          )}
        </div>
      )}

      {/* Admin Login */}
      {view === "admin-login" && (
        <div style={{ ...styles.section, maxWidth: 420 }}>
          <h2 style={styles.sectionTitle}>Admin Access</h2>
          <div style={styles.sectionLine} />
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8dcc8", padding: "2rem" }}>
            <p style={{ fontFamily: "sans-serif", color: "#7a6040", fontSize: 14, marginBottom: "1.5rem", lineHeight: 1.7 }}>This area is restricted to Free Thinkers Club administrators. Admin access enables deletion of publications.</p>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input style={styles.input} type="text" value={loginForm.username} onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input style={styles.input} type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            {loginError && <p style={{ color: "#c0392b", fontFamily: "sans-serif", fontSize: 13, marginBottom: "1rem" }}>{loginError}</p>}
            <button style={{ ...styles.btn, ...styles.btnPrimary, width: "100%", padding: 12 }} onClick={handleLogin}>Sign In</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: "#1a1208", color: "#7a6040", padding: "2.5rem 2rem", textAlign: "center", fontFamily: "sans-serif", fontSize: 13, marginTop: "4rem" }}>
        <p style={{ fontStyle: "italic", color: "#C4872A", fontSize: 16, marginBottom: 6 }}>Free Thinkers Club</p>
        <p>An open repository for independent academic thought. Knowledge belongs to everyone.</p>
      </footer>

      {/* Paper Detail Modal */}
      {selectedPaper && (
        <Modal onClose={() => setSelectedPaper(null)}>
          <div style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <span style={{ ...styles.cardCategory }}>{selectedPaper.category}</span>
              <button style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#a09070", lineHeight: 1 }} onClick={() => setSelectedPaper(null)}>×</button>
            </div>
            <h2 style={{ fontStyle: "italic", fontSize: 22, color: "#1a1208", marginBottom: 6, lineHeight: 1.3 }}>{selectedPaper.title}</h2>
            <p style={{ fontFamily: "sans-serif", color: "#7a6040", fontSize: 14, marginBottom: 4 }}>{selectedPaper.author}</p>
            <p style={{ fontFamily: "sans-serif", color: "#a09070", fontSize: 13, marginBottom: "1.5rem" }}>Published: {formatDateTime(selectedPaper.publishedAt)}</p>
            <p style={{ fontFamily: "sans-serif", fontSize: 15, lineHeight: 1.8, color: "#3a2a10", marginBottom: "1.5rem" }}>{selectedPaper.abstract}</p>

            <div style={{ display: "flex", gap: 10, marginBottom: "2rem", flexWrap: "wrap" }}>
              <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => { setPapers(prev => prev.map(p => p.id === selectedPaper.id ? { ...p, downloads: p.downloads + 1 } : p)); notify("Download started!"); }}>
                ⬇ Download PDF
              </button>
              <button style={{ ...styles.btn, ...styles.btnOutline }} onClick={() => { setReviewModal(selectedPaper.id); setSelectedPaper(null); }}>
                Write a Review
              </button>
              {isAdmin && (
                <button style={styles.btnDanger} onClick={() => { handleDelete(selectedPaper.id); setSelectedPaper(null); }}>Delete Publication</button>
              )}
            </div>

            <h3 style={{ fontStyle: "italic", fontSize: 17, marginBottom: "1rem", color: "#1a1208" }}>Reviews ({selectedPaper.reviews.length})</h3>
            {selectedPaper.reviews.length === 0 && (
              <p style={{ fontFamily: "sans-serif", color: "#a09070", fontSize: 14 }}>No reviews yet. Be the first to review this paper.</p>
            )}
            {selectedPaper.reviews.map(r => (
              <div key={r.id} style={{ borderTop: "1px solid #e8dcc8", paddingTop: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 14, color: "#1a1208" }}>{r.reviewer}</span>
                  <span style={{ fontFamily: "sans-serif", fontSize: 12, color: "#a09070" }}>{r.date}</span>
                </div>
                <StarRating value={r.rating} readOnly />
                <p style={{ fontFamily: "sans-serif", fontSize: 14, color: "#3a2a10", marginTop: 6, lineHeight: 1.7 }}>{r.comment}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <Modal onClose={() => setReviewModal(null)}>
          <div style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontStyle: "italic", fontSize: 19, color: "#1a1208" }}>Submit a Review</h3>
              <button style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#a09070" }} onClick={() => setReviewModal(null)}>×</button>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Your Name</label>
              <input style={styles.input} placeholder="How should we attribute this review?" value={reviewForm.reviewer} onChange={e => setReviewForm(p => ({ ...p, reviewer: e.target.value }))} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Rating</label>
              <StarRating value={reviewForm.rating} onChange={v => setReviewForm(p => ({ ...p, rating: v }))} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Your Review</label>
              <textarea style={styles.textarea} placeholder="Share your thoughts on the methodology, arguments, and contribution of this paper…" value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleAddReview}>Submit Review</button>
              <button style={{ ...styles.btn, ...styles.btnOutline }} onClick={() => setReviewModal(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
