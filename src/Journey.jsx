import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from './motion'
import IiserMark from './profile/IiserMark'
import { BioconMark, CsirMark } from './journey/marks'

// The three cities, at their real coordinates. The map is an equirectangular slice of southern India.
const LON = [72.4, 81], LAT = [11.2, 17.2], MAP_W = 600, MAP_H = 520
const proj = (lon, lat) => ({ x: (lon - LON[0]) / (LON[1] - LON[0]) * MAP_W, y: (LAT[1] - lat) / (LAT[1] - LAT[0]) * MAP_H })
const CITIES = {
  // label: placed on the side of each city that no route leg passes through.
  // The emblem sits on the city; its label goes on the side no route passes through.
  tirupati: { name: 'Tirupati', region: 'Andhra Pradesh', org: 'IISER Tirupati', ...proj(79.42, 13.63), side: 'right', Mark: IiserMark },
  bengaluru: { name: 'Bengaluru', region: 'Karnataka', org: 'Biocon', ...proj(77.59, 12.97), side: 'below', Mark: BioconMark },
  goa: { name: 'Goa', region: 'Dona Paula', org: 'CSIR-NIO', ...proj(73.83, 15.49), side: 'above', Mark: CsirMark },
}

const THESIS_SUPERVISOR = 'Dr. Pavithra Lakshminarasimhan Chavali'

// Each stop is one chapter of experience. Project-level facts (period, supervisor, contribution) come from
// the projects data, so the journey, the dossiers and the reviewer brief can never disagree.
const STOPS = [
  {
    id: 'iiser', city: 'tirupati', org: 'IISER Tirupati', full: 'Indian Institute of Science Education and Research',
    role: 'BS–MS student', detail: 'Biology major · Chemistry minor', when: '2022–May 2024', span: 'Foundation years',
    lesson: 'Learning to think across disciplines.',
    copy: 'Biology gave me the living system; chemistry taught me to reason through interactions, conditions and evidence.',
    work: [{ project: 'bacterial-signals', label: 'Winter literature project' }],
    tags: ['Biology', 'Chemistry', 'Literature review'],
  },
  {
    id: 'biocon', city: 'bengaluru', org: 'Biocon', full: 'Active pharmaceutical ingredient (API) R&D',
    role: 'Industrial training', detail: 'API R&D · Bengaluru', when: '3 Jun–31 Jul 2024', span: '8 weeks',
    lesson: 'Precision became part of the experiment.',
    copy: 'API R&D showed me that reproducibility is built through analytical discipline, documentation, safety and process control—not technique alone.',
    work: [{ project: 'biocon', label: 'What I did' }],
    tags: ['TLC', 'Preparative HPLC', 'Karl Fischer', 'SOP-led workflows'],
  },
  {
    id: 'nio', city: 'goa', org: 'CSIR-NIO', full: 'CSIR–National Institute of Oceanography',
    role: 'Research internship', detail: 'Marine microbiology · Goa', when: '19 May–25 Jul 2025', span: '10 weeks',
    lesson: 'Biology expanded into a community.',
    copy: 'Working with coral-associated microbes taught me to follow biological activity through culture conditions, extraction and antimicrobial screening.',
    work: [{ project: 'coral', label: 'What I did' }],
    tags: ['Aseptic culture', 'Extraction', 'Disc diffusion', 'TLC'],
  },
  {
    id: 'toolkits', city: 'tirupati', org: 'IISER Tirupati', full: 'Indian Institute of Science Education and Research',
    role: 'Semester projects', detail: 'Computational + molecular', when: 'Aug 2025–Mar 2026', span: '2 projects',
    lesson: 'Two toolkits converged.',
    copy: 'I learned to move between a predicted structure and a testable construct.',
    work: [{ project: 'tmem135', label: 'TMEM135 · comparative biology' }, { project: 'split-gfp', label: 'Molecular cloning' }],
    tags: ['Alignment', 'Structure prediction', 'Cloning', 'Fluorescence controls'],
  },
  {
    id: 'wdr62', city: 'tirupati', org: 'IISER Tirupati', full: 'Indian Institute of Science Education and Research',
    role: 'MS thesis', detail: `Supervisor · ${THESIS_SUPERVISOR}`, when: '24 May 2026–present', span: 'Now',
    lesson: 'A sharper question: WDR62.',
    copy: 'I now ask how a mitotic scaffold influences actin architecture, cell movement and disease-relevant remodelling.',
    work: [{ section: '#current-question', label: 'The thesis', text: 'Non-mitotic roles of WDR62 in actin architecture and protrusion dynamics, in U251 and HeLa cells.' }],
    tags: ['Confocal microscopy', 'FRAP', 'Perturbation', 'Co-IP'], now: true,
  },
]

// The route the cell migrates along: Tirupati → Bengaluru → Goa → back to Tirupati, as gentle arcs.
const C = CITIES
const LEGS = [
  `M${C.tirupati.x} ${C.tirupati.y}Q${(C.tirupati.x + C.bengaluru.x) / 2 + 10} ${Math.max(C.tirupati.y, C.bengaluru.y) + 46} ${C.bengaluru.x} ${C.bengaluru.y}`,
  `M${C.bengaluru.x} ${C.bengaluru.y}Q${C.goa.x + 40} ${C.bengaluru.y - 10} ${C.goa.x} ${C.goa.y}`,
  // Arcs high enough to clear the Bengaluru badge on its way back to Tirupati.
  `M${C.goa.x} ${C.goa.y}Q${(C.goa.x + C.tirupati.x) / 2} ${C.goa.y + 6} ${C.tirupati.x} ${C.tirupati.y}`,
]
const ROUTE_AT = [0, 1, 2, 3, 3]          // where each stop sits on the route (in legs)
const last = STOPS.length - 1
const GRID_LON = [74, 76, 78, 80], GRID_LAT = [12, 14, 16]

// Coastlines of the southern peninsula inside the map window (approximate, from coastal towns).
const WEST = [[73.25, 17.2], [73.3, 16.99], [73.38, 16.4], [73.47, 16.06], [73.63, 15.86], [73.8, 15.45], [73.95, 15.2], [74.05, 15], [74.12, 14.81], [74.31, 14.55], [74.44, 14.28], [74.55, 13.98], [74.69, 13.63], [74.7, 13.34], [74.84, 12.87], [74.99, 12.5], [75.08, 12.31], [75.37, 11.87], [75.49, 11.75], [75.77, 11.25], [75.8, 11.2]]
const EAST = [[79.8, 11.2], [79.77, 11.5], [79.78, 11.75], [79.84, 11.93], [79.95, 12.2], [80.2, 12.62], [80.29, 13.08], [80.33, 13.25], [80.32, 13.42], [80.25, 13.72], [80.17, 14.03], [80.13, 14.25], [80.18, 14.45], [80.08, 14.92], [80.05, 15.05], [80.15, 15.45], [80.42, 15.79], [80.67, 15.9], [81, 16.1]]
const pts = (list) => list.map(([lo, la]) => { const q = proj(lo, la); return `${q.x.toFixed(1)},${q.y.toFixed(1)}` })
const COAST_W = `M${pts(WEST).join('L')}`, COAST_E = `M${pts(EAST).join('L')}`
const LAND = `M${pts(WEST).join('L')}L${pts(EAST).join('L')}L${MAP_W},0L${proj(73.25, 17.2).x.toFixed(1)},0Z`

function Arrow() { return <span aria-hidden="true">↗</span> }

// Layout: a sticky column (map + chapter index) beside cards that scroll normally, one screen each.
// Nothing is pinned or snapped, so the reader keeps full control of the scroll; the card crossing the
// middle of the screen is the active chapter, and the map's cell migrates there.
export default function Journey({ projects = [], onOpenProject, onGo }) {
  const root = useRef(null)
  const mapRef = useRef(null)
  const legs = useRef([])
  const glows = useRef([])
  const cell = useRef(null)
  const route = useRef({ r: 0 })
  const [active, setActive] = useState(0)
  const [wide, setWide] = useState(() => matchMedia('(min-width: 961px)').matches)
  const [seen, setSeen] = useState(false)

  const project = (id) => projects.find(p => p.id === id)

  // Draw the route up to position r (in legs) and put the migrating cell there.
  const renderRoute = () => {
    const r = route.current.r
    legs.current.forEach((path, i) => {
      if (!path) return
      const L = path.getTotalLength()
      const f = Math.min(1, Math.max(0, r - i))
      for (const el of [path, glows.current[i]]) {
        if (!el) continue
        el.style.strokeDasharray = `${L}`
        el.style.strokeDashoffset = `${L * (1 - f)}`
      }
    })
    const i = Math.min(LEGS.length - 1, Math.floor(r)), f = r - i
    const path = legs.current[i]
    if (path && cell.current) {
      const p = path.getPointAtLength(path.getTotalLength() * Math.min(1, f))
      cell.current.setAttribute('transform', `translate(${p.x} ${p.y})`)
    }
  }

  useEffect(() => {
    const mq = matchMedia('(min-width: 961px)')
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // The active chapter is the card crossing the middle band of the screen.
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActive(Number(e.target.dataset.i)) })
    }, { rootMargin: '-47% 0px -52% 0px' })
    root.current.querySelectorAll('.jcard').forEach(c => io.observe(c))
    return () => io.disconnect()
  }, [])

  // The emblems assemble once, when the map first comes into view.
  useEffect(() => {
    // Any record saying 'visible' counts: a shared #link can batch a stale 'not visible' record first.
    const io = new IntersectionObserver((entries) => { if (entries.some(e => e.isIntersecting)) { setSeen(true); io.disconnect() } }, { threshold: .25 })
    io.observe(mapRef.current)
    return () => io.disconnect()
  }, [])

  // Migrate to the active chapter: on-screen travel eases in-out, distance sets the duration (≤ 1.8s).
  // On phones (map not sticky) and with reduced motion, the whole route is simply shown.
  useEffect(() => {
    const target = ROUTE_AT[active]
    if (prefersReducedMotion() || !wide) { route.current.r = LEGS.length; renderRoute(); return undefined }
    const dist = Math.abs(target - route.current.r)
    const tween = gsap.to(route.current, { r: target, duration: Math.min(1.8, .4 + dist * .7), ease: 'power2.inOut', onUpdate: renderRoute, overwrite: true })
    return () => tween.kill()
  }, [active, wide])

  useLayoutEffect(() => { renderRoute() }, [])

  // Chapter stepping (desktop): inside the journey, one scroll gesture = exactly one chapter. The page glides to
  // the next card's resting point, then ignores input until the gesture (incl. trackpad inertia) has ended —
  // so every card gets a real stop and a fling can't run through the timeline. Scrolling past the first or
  // last chapter is never intercepted, so the reader can always leave.
  const glide = useRef(null)
  const restOf = (i) => {
    const marker = document.querySelector(`#journey-${STOPS[i].id} .jcard__snap`)
    return marker ? marker.getBoundingClientRect().top + scrollY : 0
  }
  const glideTo = (y) => {
    glide.current?.kill()
    const from = { y: scrollY }
    glide.current = gsap.to(from, { y, duration: .9, ease: 'power2.inOut', onUpdate: () => scrollTo({ top: from.y, behavior: 'instant' }) })
  }
  useEffect(() => {
    if (!wide || prefersReducedMotion()) return undefined
    let busy = false, lastInput = 0
    const QUIET = 180                                   // ms of silence that ends a gesture (trackpad inertia included)
    // Returns true if the input was consumed by the journey.
    const step = (dir, event) => {
      const y = scrollY, vh = innerHeight
      const first = restOf(0), end = restOf(last)
      if (y < first - vh * .6 || y > end + vh * .6) return false       // not in (or approaching) the journey
      if (!busy && dir > 0 && y >= end - 2) return false                // leaving downward after the last chapter
      if (!busy && dir < 0 && y <= first + 2) return false              // leaving upward before the first chapter
      event?.preventDefault()
      lastInput = performance.now()
      if (busy) return true                                             // still gliding, or the same gesture
      // Next resting point in the direction of travel.
      let target
      if (dir > 0) { target = 0; while (target < last && restOf(target) <= y + 4) target++ }
      else { target = last; while (target > 0 && restOf(target) >= y - 4) target-- }
      busy = true
      glideTo(restOf(target))
      const release = () => {
        if (glide.current?.isActive() || performance.now() - lastInput < QUIET) { requestAnimationFrame(release); return }
        busy = false
      }
      requestAnimationFrame(release)
      return true
    }
    const onWheel = (e) => { if (Math.abs(e.deltaY) < 2 || e.ctrlKey) return; step(Math.sign(e.deltaY), e) }
    const KEYS = { PageDown: 1, ArrowDown: 1, ' ': 1, PageUp: -1, ArrowUp: -1 }
    const onKey = (e) => {
      if (!(e.key in KEYS) || e.target.closest?.('input, textarea, [contenteditable], .dossier, .brief')) return
      step(e.key === ' ' && e.shiftKey ? -1 : KEYS[e.key], e)
    }
    addEventListener('wheel', onWheel, { passive: false })
    addEventListener('keydown', onKey)
    return () => { removeEventListener('wheel', onWheel); removeEventListener('keydown', onKey); glide.current?.kill() }
  }, [wide])

  // Go to a chapter's resting point, where its card is centred and holding.
  const goTo = (index) => {
    if (wide && !prefersReducedMotion()) return glideTo(restOf(index))
    document.getElementById(`journey-${STOPS[index].id}`)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' })
  }
  const cityStop = (key) => Math.max(0, STOPS.findIndex(s => s.city === key))
  const stateOf = (i) => (i === active ? 'is-active' : i < active ? 'is-past' : 'is-future')
  const current = STOPS[active]

  return (
    <section className={`journey${wide ? ' is-wide' : ''}`} id="journey" ref={root}>
      <div className="journey__intro section-pad" data-chapter>
        <div className="chapter-label"><span>Research journey</span><b>02</b></div>
        <div>
          <p className="eyebrow">Three institutions · five chapters of experience</p>
          <h2 data-reveal>One journey. <em>A continuously sharper way of asking why.</em></h2>
          <p className="lead">From interdisciplinary training to industrial discipline, ecological microbiology and mechanistic cell biology—follow the cell from place to place.</p>
        </div>
      </div>

      <div className="journey__scrolly">
        <div className="journey__sticky">
          {/* ---- The map: real coordinates, institution emblems as landmarks, a cell migrating between them. ---- */}
          <div className={`jmap${seen ? ' is-seen' : ''}`} ref={mapRef}>
            <svg className="jmap__svg" viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden="true">
              <defs>
                <radialGradient id="jcell-fill" cx=".4" cy=".35"><stop offset="0" stopColor="#0f3a3b" /><stop offset="1" stopColor="#061f22" /></radialGradient>
                {/* The geography fades out toward the edges, so the map has no hard frame. */}
                <radialGradient id="jfade" cx=".5" cy=".5" r=".6"><stop offset=".55" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
                <mask id="jmask"><rect width={MAP_W} height={MAP_H} fill="url(#jfade)" /></mask>
              </defs>
              <g mask="url(#jmask)">
                <path className="jmap__land" d={LAND} />
                <path className="jmap__coast" d={COAST_W} />
                <path className="jmap__coast" d={COAST_E} />
                <g className="jmap__grid">
                  {GRID_LON.map(l => <line key={`x${l}`} x1={proj(l, 0).x} x2={proj(l, 0).x} y1="0" y2={MAP_H} />)}
                  {GRID_LAT.map(l => <line key={`y${l}`} y1={proj(0, l).y} y2={proj(0, l).y} x1="0" x2={MAP_W} />)}
                </g>
              </g>
              <g className="jmap__grid">
                {GRID_LON.map(l => <text key={`tx${l}`} x={proj(l, 0).x + 4} y={MAP_H - 8}>{l}°E</text>)}
                {GRID_LAT.map(l => <text key={`ty${l}`} x="6" y={proj(0, l).y - 6}>{l}°N</text>)}
              </g>
              <text className="jmap__sea" x={proj(72.75, 0).x} y={proj(0, 12.55).y}>Arabian Sea</text>
              <text className="jmap__sea" x={proj(80.12, 0).x} y={proj(0, 11.8).y}>Bay of</text>
              <text className="jmap__sea" x={proj(80.12, 0).x} y={proj(0, 11.8).y + 14}>Bengal</text>

              {LEGS.map((d, i) => <path key={`t${i}`} className="jmap__track" d={d} />)}
              {LEGS.map((d, i) => <path key={`g${i}`} className="jmap__leg-glow" d={d} ref={el => { glows.current[i] = el }} />)}
              {LEGS.map((d, i) => <path key={`l${i}`} className="jmap__leg" d={d} ref={el => { legs.current[i] = el }} />)}

              <g ref={cell} className="jmap__cell">
                <circle r="16" className="jmap__cell-glow" />
                <circle r="9" fill="url(#jcell-fill)" className="jmap__cell-body" />
                <circle r="3.4" className="jmap__cell-nucleus" />
              </g>
            </svg>

            {Object.entries(CITIES).map(([key, c]) => {
              const Mark = c.Mark
              const here = current.city === key
              return (
                <div key={key} className={`jplace jplace--${key}${here ? ' is-here' : ''}`} style={{ left: `${(c.x / MAP_W) * 100}%`, top: `${(c.y / MAP_H) * 100}%` }}>
                  <button className={`jbadge jbadge--${key}${here ? ' is-here' : ''}`} onClick={() => goTo(cityStop(key))} aria-label={`${c.org}, ${c.name}`}>
                    <span className="jbadge__ring"><Mark /></span>
                  </button>
                  <span className={`jplace__label jplace__label--${c.side}`} aria-hidden="true"><b>{c.name}</b><small>{c.region}</small></span>
                </div>
              )
            })}
          </div>

          {/* ---- The readable timeline: every chapter in order, with its dates and length. ---- */}
          <ol className="jindex" aria-label="Chapters of my journey">
            {STOPS.map((s, i) => (
              <li key={s.id} className={`${stateOf(i)}${s.now ? ' is-now' : ''}`}>
                <button onClick={() => goTo(i)} aria-current={i === active ? 'step' : undefined}>
                  <i aria-hidden="true" />
                  <b>0{i + 1}</b>
                  <span className="jindex__what"><strong>{s.org}</strong><small>{s.role}</small></span>
                  <span className="jindex__when"><strong>{s.when}</strong><small>{s.span}</small></span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* ---- One card per chapter, each a full screen, in normal scroll flow. ---- */}
        <div className="jcards">
          {STOPS.map((s, i) => {
            const Mark = CITIES[s.city].Mark
            return (
              <article key={s.id} id={`journey-${s.id}`} data-i={i} className={`jcard ${stateOf(i)}${s.now ? ' is-now' : ''}`}>
                {/* Resting point: the scroll position where this card is centred and holding still. */}
                <i className="jcard__snap" aria-hidden="true" />
                <div className="jcard__hold">
                <div className="jcard__inner">
                  <header className="jcard__head" style={{ '--i': 0 }}>
                    <span className="jcard__mark"><Mark /></span>
                    <div>
                      <p className="jcard__org">{s.org}</p>
                      <p className="jcard__full">{s.full}</p>
                    </div>
                    <span className="jcard__index">0{i + 1}<small>/ 0{STOPS.length}</small></span>
                  </header>
                  <div className="jcard__facts" style={{ '--i': 1 }}>
                    <span><b>{s.role}</b>{s.detail}</span>
                    <span><b>{s.when}</b>{s.span}</span>
                    <span><b>{CITIES[s.city].name}</b>{CITIES[s.city].region}</span>
                  </div>
                  <h3 className="jcard__lesson" style={{ '--i': 2 }}>{s.lesson}</h3>
                  <p className="jcard__copy" style={{ '--i': 3 }}>{s.copy}</p>
                  <ul className="jcard__work" style={{ '--i': 4 }}>
                    {s.work.map(w => {
                      const p = w.project && project(w.project)
                      const meta = p ? [p.period, p.supervisor].filter(Boolean).join(' · ') : ''
                      return (
                        <li key={w.label}>
                          <div><b>{w.label}</b>{meta && <small>{meta}</small>}<span>{p ? p.contribution : w.text}</span></div>
                          {p ? <button onClick={() => onOpenProject?.(w.project)}>Open dossier <Arrow /></button>
                            : w.section ? <button onClick={() => onGo?.(w.section)}>See thesis <Arrow /></button> : null}
                        </li>
                      )
                    })}
                  </ul>
                  <ul className="jcard__tags" style={{ '--i': 5 }}>{s.tags.map(t => <li key={t}>{t}</li>)}</ul>
                </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
