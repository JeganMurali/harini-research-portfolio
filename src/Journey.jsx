import { useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, ease, dur, prefersReducedMotion } from './motion'

const stops = [
  {
    id: 'iiser', place: 'IISER Tirupati', ghost: 'Tirupati', when: '2022–May 2024', kind: 'Foundation',
    title: 'Learning to think across disciplines.',
    copy: 'Biology gave me the living system; chemistry taught me to reason through interactions, conditions and evidence. A winter study of bacterial signalling became my first real question.',
    tags: ['Biology major', 'Chemistry minor', 'BS–MS'],
  },
  {
    id: 'biocon', place: 'Biocon, Bengaluru', ghost: 'Bengaluru', when: '3 Jun–31 Jul 2024', kind: 'Industrial training',
    title: 'Precision became part of the experiment.',
    copy: 'API R&D showed me that reproducibility is built through analytical discipline, documentation, safety and process control—not technique alone.',
    tags: ['TLC', 'Preparative HPLC', 'Karl Fischer', 'SOP-led workflows'],
  },
  {
    id: 'nio', place: 'CSIR-NIO, Goa', ghost: 'Goa', when: '19 May–25 Jul 2025', kind: 'Research internship',
    title: 'Biology expanded into a community.',
    copy: 'Working with coral-associated microbes taught me to follow biological activity through culture conditions, extraction and antimicrobial screening—while respecting ecological context.',
    tags: ['Marine microbiology', 'Screening', 'Extraction'],
  },
  {
    id: 'toolkits', place: 'IISER Tirupati', ghost: 'Toolkits', when: 'Aug 2025–Mar 2026', kind: 'Semester projects',
    title: 'Two toolkits converged.',
    copy: 'Computational work on TMEM135 met hands-on molecular experimentation, and I learned to move between a predicted structure and a testable construct.',
    tags: ['TMEM135 · Dr Prasanna Katti', 'Molecular cloning'],
  },
  {
    id: 'wdr62', place: 'IISER Tirupati', ghost: 'WDR62', when: '24 May 2026–present', kind: 'MS thesis · now',
    title: 'A sharper question: WDR62.',
    copy: 'I now ask how a mitotic scaffold influences actin architecture, cell movement and disease-relevant remodelling.',
    tags: ['Actin architecture', 'Cell migration', 'Confocal · FRAP'],
  },
]

// A migrating cell's trail: long, smooth arcs (elegance), with a direction change every
// ~quarter so no stretch of motion runs more than a third of the stage unbroken.
const TRAIL = 'M150 40C40 130 250 205 160 300S40 455 150 545S280 700 170 790S120 870 150 880'
const last = stops.length - 1

export default function Journey() {
  const root = useRef(null)
  const stage = useRef(null)
  const trail = useRef(null)
  const lead = useRef(null)
  const trigger = useRef(null)
  const [nodes, setNodes] = useState([])
  const [active, setActive] = useState(0)
  const [pinned, setPinned] = useState(false)

  // Node positions are measured from the path itself so stops sit exactly on the trail.
  useLayoutEffect(() => {
    const path = trail.current
    const length = path.getTotalLength()
    setNodes(stops.map((_, i) => {
      const p = path.getPointAtLength(length * (i / last))
      return { x: p.x, y: p.y }
    }))
  }, [])

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    const path = trail.current
    const length = path.getTotalLength()
    const q = gsap.utils.selector(root)

    mm.add({ desktop: '(min-width: 781px)', reduce: '(prefers-reduced-motion: reduce)' }, ({ conditions }) => {
      const canPin = conditions.desktop && !conditions.reduce
      setPinned(canPin)
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: canPin ? length : 0 })

      if (!canPin) {
        if (conditions.reduce) return undefined
        // Mobile: one element at a time, 0.8x durations, no parallax.
        q('.journey-stop').forEach((node) => gsap.from(node, {
          y: 16, opacity: 0, duration: dur.standard * .8, ease: ease.enter,
          scrollTrigger: { trigger: node, start: 'top 86%' },
        }))
        gsap.fromTo(q('.journey__rail-fill'), { scaleY: 0 }, {
          scaleY: 1, ease: 'none', transformOrigin: 'top',
          scrollTrigger: { trigger: q('.journey__stops')[0], start: 'top 70%', end: 'bottom 70%', scrub: .6 },
        })
        return undefined
      }

      // The leading edge follows scroll with an ease-out lag, so it glides rather than ticks.
      const state = { p: 0 }
      const follow = gsap.quickTo(state, 'p', { duration: .9, ease: 'power3.out', onUpdate: render })
      const backdrop = q('.journey__backdrop img')[0]
      const ghosts = q('.journey__ghosts')[0]
      let current = 0

      function render() {
        const p = state.p
        path.style.strokeDashoffset = length * (1 - p)
        const point = path.getPointAtLength(length * p)
        lead.current.setAttribute('transform', `translate(${point.x} ${point.y})`)
        // Counter-motion: the world drifts against the trail at ~20% of its speed.
        if (backdrop) backdrop.style.transform = `scale(${1.12 - p * .07}) translate3d(0, ${p * -3}%, 0)`
        if (ghosts) ghosts.style.transform = `translate3d(${p * -6}vw, 0, 0)`
        const index = Math.round(p * last)
        if (index !== current) { current = index; setActive(index) }
      }

      trigger.current = ScrollTrigger.create({
        trigger: stage.current,
        start: 'top top',
        end: () => `+=${innerHeight * last * .95}`,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => follow(self.progress),
        snap: { snapTo: 1 / last, duration: { min: .35, max: .8 }, delay: .12, ease: 'power1.inOut' },
      })
      render()
      return () => { trigger.current = null }
    })

    return () => mm.revert()
  }, [])

  const goTo = (index) => {
    const st = trigger.current
    if (!st) return document.getElementById(`journey-${stops[index].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    scrollTo({ top: st.start + (st.end - st.start) * (index / last), behavior: 'smooth' })
  }

  const stateOf = (i) => (i === active ? 'is-active' : i < active ? 'is-past' : 'is-future')

  return (
    <section className={`journey${pinned ? ' is-pinned' : ''}`} id="journey" ref={root}>
      <div className="journey__intro section-pad" data-chapter>
        <div className="chapter-label"><span>Research journey</span><b>02</b></div>
        <div>
          <p className="eyebrow">Five places · one sharpening question</p>
          <h2 data-reveal>One journey. <em>A continuously sharper way of asking why.</em></h2>
          <p className="lead">From interdisciplinary training to industrial discipline, ecological microbiology and mechanistic cell biology—follow the trail.</p>
        </div>
      </div>

      <div className="journey__stage" ref={stage}>
        <div className="journey__backdrop" aria-hidden="true">
          <picture><source media="(max-width: 780px)" srcSet="/assets/research-worlds-mobile.webp" type="image/webp" /><source srcSet="/assets/research-worlds-v2.webp" type="image/webp" /><img src="/assets/research-worlds-v2.png" alt="" loading="lazy" decoding="async" /></picture>
          <div className="journey__shade" />
        </div>
        <div className="journey__ghosts" aria-hidden="true">{stops.map((stop, i) => <span key={stop.id} className={stateOf(i)}>{stop.ghost}</span>)}</div>

        <div className="journey__map">
          <svg viewBox="0 0 320 920" aria-hidden="true">
            <defs>
              <linearGradient id="trail-ink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9fd8c7" /><stop offset=".55" stopColor="#62c9d0" /><stop offset="1" stopColor="#ef8d72" /></linearGradient>
              <radialGradient id="lead-glow"><stop offset="0" stopColor="#9fd8c7" stopOpacity=".55" /><stop offset="1" stopColor="#9fd8c7" stopOpacity="0" /></radialGradient>
            </defs>
            <path className="journey__track" d={TRAIL} />
            <path className="journey__trail" d={TRAIL} ref={trail} />
            {nodes.map((n, i) => (
              <g key={stops[i].id} className={`journey__node ${stateOf(i)}${i === last ? ' is-now' : ''}`} transform={`translate(${n.x} ${n.y})`}>
                <circle className="journey__node-ring" r="16" /><circle className="journey__node-core" r="6.5" />
              </g>
            ))}
            <g ref={lead} className="journey__lead"><circle r="30" fill="url(#lead-glow)" /><circle r="4.5" /></g>
          </svg>
          {nodes.map((n, i) => (
            <button key={stops[i].id} className={`journey__label ${stateOf(i)}`} style={{ top: `${(n.y / 920) * 100}%`, left: `${(n.x / 320) * 100}%` }} onClick={() => goTo(i)} aria-label={`${stops[i].place}, ${stops[i].when}`}>
              <b>0{i + 1}</b><span>{stops[i].when}</span>
            </button>
          ))}
        </div>

        <div className="journey__stops">
          <i className="journey__rail" aria-hidden="true"><i className="journey__rail-fill" /></i>
          {stops.map((stop, i) => (
            <article key={stop.id} id={`journey-${stop.id}`} className={`journey-stop ${stateOf(i)}${i === last ? ' is-now' : ''}`} aria-hidden={pinned && i !== active}>
              <div className="journey-stop__index" style={{ '--i': 0 }}><b>0{i + 1}</b><span>/ 0{stops.length}</span></div>
              <p className="journey-stop__meta" style={{ '--i': 1 }}>{stop.kind} · {stop.place} · {stop.when}</p>
              <h3 style={{ '--i': 2 }}>{stop.title}</h3>
              <p className="journey-stop__copy" style={{ '--i': 3 }}>{stop.copy}</p>
              <ul className="journey-stop__tags" style={{ '--i': 4 }}>{stop.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
            </article>
          ))}
        </div>

        <div className="journey__progress" aria-hidden="true">{stops.map((stop, i) => <i key={stop.id} className={stateOf(i)} />)}</div>
      </div>
    </section>
  )
}
