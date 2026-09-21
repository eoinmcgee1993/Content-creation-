const stories = [
  { section: "MONEY", type: "THE SIDE HUSTLE", title: "Everyone wants a side hustle. Few want another job.", text: "From AI services to digital products, the new money desk asks what actually works when the guru leaves the room." },
  { section: "MACHINE", type: "THE SIGNAL", title: "AI promised to change everything. Again.", text: "The machines are getting better, the headlines are getting louder and everyone suddenly has a startup. Here is what actually changed." },
  { section: "BIOHACK", type: "FIELD NOTE", title: "Human enhancement has left the lab.", text: "Peptides, performance drugs and longevity research are colliding with the internet's favourite hobby: experimenting on yourself." },
  { section: "CULTURE", type: "CULTURE", title: "The internet has invented another personality type.", text: "We regret to inform you that it is already monetised." },
  { section: "THE RABBIT HOLE", type: "THE WEIRD ONE", title: "Six things worth knowing before you waste another hour scrolling.", text: "A small public service announcement for people with 47 open tabs." }
];

export default function Home() {
  return <main className="paper">
    <header className="masthead">
      <div className="utility"><span>Tuesday Edition</span><span>Issue 001 · 2026</span><span>€3.99 / month</span></div>
      <h1>DEGEN DIARIES</h1>
      <div className="tagline">THE TWICE-WEEKLY NEWSPAPER FOR THE INTERNET AGE</div>
    </header>
    <nav className="nav">{["MONEY","MACHINE","BIOHACK","CULTURE","RABBIT HOLE","DOSSIER"].map(x => <span key={x}>{x}</span>)}</nav>
    <section className="front">
      <article className="lead"><div className="kicker">MACHINE · THE SIGNAL</div><h2>AI PROMISED TO CHANGE EVERYTHING. AGAIN.</h2><p>The machines are getting better, the headlines are getting louder and everyone suddenly has a startup. Here is what actually changed.</p><button>READ THE EDITION</button></article>
      <div className="side">{stories.slice(0,3).map(s => <article className="story" key={s.title}><div className="kicker">{s.section} · {s.type}</div><h3>{s.title}</h3><p>{s.text}</p></article>)}</div>
    </section>
    <div className="ticker">DEGEN INDEX · ATTENTION SPAN ↓ · AI HYPE ↑ · BTC ? · COMMON SENSE OUT OF STOCK</div>
    <section className="grid">{stories.slice(3).map(s => <article className="story" key={s.title}><div className="kicker">{s.section}</div><h3>{s.title}</h3><p>{s.text}</p></article>)}<article className="dossier"><div className="kicker">THE DOSSIER</div><h3>The machines, the money and the people trying to get rich before lunch.</h3><p>One serious long read in every issue. Proper sources. Proper context. No recycled newsletter sludge.</p></article></section>
    <footer>DEGEN DIARIES · TUESDAY + FRIDAY · ORIGINAL EDITORIAL PUBLICATION · SOURCES DISCLOSED WITH EVERY STORY</footer>
  </main>;
}
