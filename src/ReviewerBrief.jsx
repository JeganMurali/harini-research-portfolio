import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, ease, prefersReducedMotion } from './motion'
import { capabilities } from './content'
import { useDialogA11y } from './useDialogA11y'

const EMAIL = 'harini_20221059@students.iisertirupati.ac.in'
const SUBJECT = encodeURIComponent('PhD enquiry — Harini Madheswaran')
const THESIS_SUPERVISOR = 'Dr. Pavithra Lakshminarasimhan Chavali'

// The order a PhD committee screens an applicant in: who and what stage → the question they own →
// where they want to go (fit) → evidence of research experience → bench skills → output → how to reach them.
const SECTIONS = [
  { id: 'glance', t: '0:00', label: 'At a glance' },
  { id: 'research', t: '0:10', label: 'Current research' },
  { id: 'direction', t: '0:30', label: 'PhD direction' },
  { id: 'experience', t: '0:45', label: 'Experience' },
  { id: 'methods', t: '1:05', label: 'Methods' },
  { id: 'output', t: '1:20', label: 'Output & contact' },
]

// Where each project happened (the projects' own data carries period, role and supervisor).
const PLACE = { 'split-gfp': 'IISER Tirupati', tmem135: 'IISER Tirupati', coral: 'CSIR-NIO, Goa', biocon: 'Biocon, Bengaluru', 'bacterial-signals': 'IISER Tirupati', neuronexus: 'IISER Tirupati · team' }
const ORDER = ['split-gfp', 'tmem135', 'coral', 'biocon', 'bacterial-signals', 'neuronexus']

function Arrow() { return <span aria-hidden="true">↗</span> }

export default function ReviewerBrief({ onClose, onOpenProject, onGo, projects, thesisSteps, interests, paper }) {
  const backdrop = useRef(null)
  const scroller = useRef(null)
  const rail = useRef(null)
  const closing = useRef(false)
  const [active, setActive] = useState('glance')
  const [copied, setCopied] = useState(false)

  // Exit plays first (≈65% of the entrance, accelerating), then the parent unmounts us.
  const requestClose = (then) => {
    if (closing.current) return
    closing.current = true
    const done = () => { onClose(); then?.() }
    if (prefersReducedMotion()) return done()
    gsap.timeline({ onComplete: done })
      .to(backdrop.current.querySelector('.brief'), { y: 12, opacity: 0, duration: .26, ease: ease.exit })
      .to(backdrop.current, { opacity: 0, duration: .22, ease: ease.exit }, .06)
  }
  const dialogRef = useDialogA11y(() => requestClose())

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined
    const q = gsap.utils.selector(backdrop.current)
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: ease.enter } })
        .fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: .25, ease: ease.signature })
        .fromTo(q('.brief'), { y: 18, opacity: 0, scale: .985 }, { y: 0, opacity: 1, scale: 1, duration: .5 }, .05)
        .fromTo(q('.brief__index li, .brief__section'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .45, stagger: .04 }, .2)
    }, backdrop)
    return () => ctx.revert()
  }, [])

  // Index follows reading position; the rail fills like the site's left progress rail.
  useEffect(() => {
    const root = scroller.current
    const io = new IntersectionObserver((entries) => {
      const seen = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (seen) setActive(seen.target.dataset.section)
    }, { root, rootMargin: '-20% 0px -65% 0px' })
    root.querySelectorAll('[data-section]').forEach(s => io.observe(s))
    const onScroll = () => {
      const max = root.scrollHeight - root.clientHeight
      if (rail.current) rail.current.style.transform = `scaleY(${max ? root.scrollTop / max : 0})`
    }
    root.addEventListener('scroll', onScroll, { passive: true }); onScroll()
    return () => { io.disconnect(); root.removeEventListener('scroll', onScroll) }
  }, [])

  useEffect(() => {
    if (!copied) return undefined
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const jump = (id) => scroller.current.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  const copy = async () => { try { await navigator.clipboard.writeText(EMAIL); setCopied(true) } catch { /* insecure context: the mailto link still works */ } }
  const print = () => {
    document.documentElement.classList.add('is-printing-brief')
    const off = () => { document.documentElement.classList.remove('is-printing-brief'); removeEventListener('afterprint', off) }
    addEventListener('afterprint', off)
    window.print()
  }
  const evidence = (id) => requestClose(() => onOpenProject(id))
  const go = (href) => requestClose(() => onGo(href))

  const rows = ORDER.map(id => projects.find(p => p.id === id)).filter(Boolean)

  return (
    <div className="brief-backdrop" ref={backdrop} onMouseDown={() => requestClose()}>
      <article ref={dialogRef} className="brief" role="dialog" aria-modal="true" aria-label="Reviewer brief: Harini Madheswaran" tabIndex={-1} onMouseDown={(e) => e.stopPropagation()}>
        <aside className="brief__aside">
          <p className="brief__kicker">For PhD reviewers</p>
          <p className="brief__title">The 90-second brief</p>
          <nav className="brief__index" aria-label="Brief sections">
            <i className="brief__rail" aria-hidden="true"><i ref={rail} /></i>
            <ol>
              {SECTIONS.map(s => (
                <li key={s.id} className={active === s.id ? 'is-active' : ''}>
                  <button onClick={() => jump(s.id)}><i aria-hidden="true" /><b>{s.t}</b><span>{s.label}</span></button>
                </li>
              ))}
            </ol>
          </nav>
          <div className="brief__tools">
            <a href="/documents/Harini_Madheswaran_CV.docx" download>Download CV <Arrow /></a>
            <button onClick={print}>Save as PDF <Arrow /></button>
          </div>
        </aside>

        <button className="brief__close" onClick={() => requestClose()} aria-label="Close reviewer brief"><i /><i /></button>

        <div className="brief__scroll" ref={scroller}>
          <section className="brief__section brief__glance" data-section="glance">
            <h2>Harini Madheswaran</h2>
            <p className="brief__lede">Experimental biologist studying how cells organise, communicate and adapt — seeking a PhD in <em>mechanistic cell biology and disease.</em></p>
            <dl className="brief__facts">
              <div><dt>Programme</dt><dd>BS–MS · Biology major, Chemistry minor</dd></div>
              <div><dt>Institution</dt><dd>IISER Tirupati · 2022–present, completing 2027</dd></div>
              <div><dt>Current thesis</dt><dd>WDR62 · actin architecture · cell movement</dd></div>
              <div><dt>Based in</dt><dd>Tirupati, India · IST (UTC+5:30)</dd></div>
            </dl>
          </section>

          <section className="brief__section" data-section="research">
            <header className="brief__head"><span>01</span><h3>Current research</h3><button className="brief__see" onClick={() => go('#current-question')}>See thesis <Arrow /></button></header>
            <p className="brief__meta">MS thesis · 24 May 2026–present · Supervisor: {THESIS_SUPERVISOR}, IISER Tirupati</p>
            <p className="brief__statement">Mechanistic dissection of WDR62</p>
            <p className="brief__body">WDR62 is classically linked to spindle organisation and primary microcephaly. In this thesis, I test a less explored, non-mitotic role in actin architecture and protrusion dynamics in U251 and HeLa cells.</p>
            <ol className="brief__steps">
              {thesisSteps.map((s, i) => <li key={s.title}><b>0{i + 1} · {s.title}</b><span>{s.copy}</span></li>)}
            </ol>
          </section>

          <section className="brief__section" data-section="direction">
            <header className="brief__head"><span>02</span><h3>PhD direction & fit</h3></header>
            <p className="brief__statement">Mechanistic cell biology and disease</p>
            <p className="brief__body">Doctoral research exploring how signalling, cellular architecture and tissue environments are remodelled during cancer progression and other disease states.</p>
            <ul className="brief__interests">
              {interests.map(r => <li key={r.id}><b>{r.title}</b><span>{r.line}</span></li>)}
            </ul>
          </section>

          <section className="brief__section" data-section="experience">
            <header className="brief__head"><span>03</span><h3>Research experience</h3></header>
            <table className="brief__table">
              <thead><tr><th scope="col">When</th><th scope="col">Role · where</th><th scope="col">What I did</th><th scope="col"><span className="sr-only">Evidence</span></th></tr></thead>
              <tbody>
                <tr>
                  <td>24 May 2026–present</td>
                  <td><b>MS thesis</b><small>IISER Tirupati · {THESIS_SUPERVISOR}</small></td>
                  <td>WDR62 in actin architecture and protrusion dynamics (U251, HeLa).</td>
                  <td><button className="brief__see" onClick={() => go('#current-question')}>Thesis <Arrow /></button></td>
                </tr>
                {rows.map(p => (
                  <tr key={p.id}>
                    <td>{p.period || '—'}</td>
                    <td><b>{p.status}</b><small>{PLACE[p.id]}{p.supervisor ? ` · ${p.supervisor}` : ''}</small></td>
                    <td>{p.contribution}</td>
                    <td><button className="brief__see" onClick={() => evidence(p.id)}>Dossier <Arrow /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="brief__section" data-section="methods">
            <header className="brief__head"><span>04</span><h3>Hands-on methods</h3><button className="brief__see" onClick={() => go('#methods')}>See profile <Arrow /></button></header>
            <div className="brief__methods">
              {capabilities.map(c => (
                <div key={c.id}>
                  <b>{c.title}</b>
                  <p>{c.methods.join(' · ')}</p>
                  <small>Demonstrated in {c.evidence}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="brief__section" data-section="output">
            <header className="brief__head"><span>05</span><h3>Output</h3><button className="brief__see" onClick={() => go('#publication')}>See paper <Arrow /></button></header>
            <p className="brief__meta">{paper.status}</p>
            <p className="brief__paper">{paper.title}</p>
            <p className="brief__body">{paper.authors.map(a => `${a.name} (${a.role.toLowerCase()}, ${a.affiliation})`).join(' · ')}</p>

            <div className="brief__contact">
              <p className="brief__statement">Let’s talk about a PhD.</p>
              <div className="brief__contact-row">
                <a className="brief__primary" href={`mailto:${EMAIL}?subject=${SUBJECT}`}>Email me <Arrow /></a>
                <button className="brief__ghost" onClick={copy} aria-live="polite">{copied ? 'Copied ✓' : 'Copy email'}</button>
                <a className="brief__ghost" href="/documents/Harini_Madheswaran_CV.docx" download>CV <Arrow /></a>
                <a className="brief__ghost" href="https://linkedin.com/in/harini3101051926" target="_blank" rel="noreferrer">LinkedIn <Arrow /></a>
              </div>
              <p className="brief__fine">{EMAIL} · +91 94430 82449</p>
            </div>
          </section>
        </div>
      </article>
    </div>
  )
}
