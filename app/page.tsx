"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useState } from "react";

type Market = "NSE" | "BSE";
type Notice = { exchange: Market; date: string; title: string; category: string; description?: string; url?: string };
type Result = { query: string; notices: Notice[]; message?: string };

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const tabCopy = {
  NSE: { label: "NSE symbol", placeholder: "e.g. RELIANCE", helper: "Use the NSE trading symbol, such as RELIANCE or TCS.", title: "NSE board meetings & actions" },
  BSE: { label: "BSE script code", placeholder: "e.g. 500325", helper: "Use the six-digit BSE script code, such as 500325.", title: "BSE notices & circulars" },
};

function displayDate(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? value : dateFormatter.format(parsed); }

export default function Home() {
  const [market, setMarket] = useState<Market>("NSE");
  const [values, setValues] = useState<Record<Market, string>>({ NSE: "", BSE: "" });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const copy = tabCopy[market];

  async function search(event: FormEvent) {
    event.preventDefault();
    const value = values[market].trim();
    if (!value) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch(`/api/notices?q=${encodeURIComponent(value)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not load disclosures right now.");
      setResult(data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "We could not load disclosures right now."); }
    finally { setLoading(false); }
  }

  function switchTab(tab: Market) {
    setMarket(tab); setResult(null); setError("");
  }

  return <main>
    <nav><a className="wordmark" href="#top">CIRCULAR <i>LOOKUP</i></a><span>Made for fast, confident support</span></nav>
    <section className="hero" id="top">
      <motion.p className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>BSE × NSE</motion.p>
      <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08, duration: .6 }}>Find the filing.<br /><em>Keep the customer moving.</em></motion.h1>
      <motion.p className="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .24 }}>A focused lookup for customer-support teams handling corporate-action and board-meeting queries.</motion.p>
      <motion.form onSubmit={search} className="lookup-panel" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3, duration: .5 }}>
        <div className="tabs" role="tablist" aria-label="Exchange">
          {(["NSE", "BSE"] as Market[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={market === tab} className={market === tab ? "active" : ""} onClick={() => switchTab(tab)}>
            {market === tab && <motion.span className="tab-fill" layoutId="tab-fill" transition={{ type: "spring", bounce: .18, duration: .5 }} />}{tab}
          </button>)}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={market} className="input-area" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .2 }}>
            <label htmlFor="lookup-value">{copy.label}</label>
            <div className="search-row"><input id="lookup-value" value={values[market]} onChange={(event) => setValues({ ...values, [market]: event.target.value })} placeholder={copy.placeholder} autoComplete="off" inputMode={market === "BSE" ? "numeric" : "text"} /><button disabled={loading}>{loading ? "Searching…" : "Search"}<span>↗</span></button></div>
            <p>{copy.helper}</p>
          </motion.div>
        </AnimatePresence>
      </motion.form>
    </section>

    <section className="results" aria-live="polite">
      <AnimatePresence mode="wait">
        {loading && <motion.div className="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><span /><span /><span /> Fetching official exchange data</motion.div>}
        {error && <motion.div className="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>}
        {result && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <div className="result-header"><p className="eyebrow">{copy.title}</p><h2>{result.query}</h2><span>{result.notices.length} update{result.notices.length === 1 ? "" : "s"}</span></div>
          {result.message && <p className="message">{result.message}</p>}
          {result.notices.length ? <div className="notice-grid">{result.notices.map((notice, index) => <motion.article className="notice-card" key={`${notice.date}-${notice.title}-${index}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .05, .3) }} whileHover={{ y: -5 }}>
            <div className="card-top"><span className={`badge ${notice.exchange.toLowerCase()}`}>{notice.exchange}</span><time>{displayDate(notice.date)}</time></div><p className="category">{notice.category}</p><h3>{notice.title}</h3>
            {notice.description && <p className="description">{notice.description}</p>}{notice.url ? <a href={notice.url} target="_blank" rel="noreferrer">Open official filing <span>↗</span></a> : <span className="unavailable">Source link unavailable</span>}
          </motion.article>)}</div> : <div className="empty"><span>⌁</span><p>No recent records were returned for this {market === "BSE" ? "script code" : "symbol"}.</p></div>}
        </motion.div>}
        {!loading && !result && !error && <motion.div className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span>⌁</span><p>Choose an exchange, enter its identifier,<br />and the disclosures will appear here.</p></motion.div>}
      </AnimatePresence>
    </section>
    <footer><span>Official BSE and NSE data · Always verify details in the source filing</span><a href="https://github.com/palakramchandani/bse-tool" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
  </main>;
}
