import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, ease, prefersReducedMotion } from './motion'
import { buildNetwork, createActin } from './profile/actin'
import IiserMark from './profile/IiserMark'
import { capabilities } from './content'


// Where each specimen cell sits (desktop), as % of the stage: a gentle wave, so no two are in line.
const CAP_POS = [{ x: 27, y: 30 }, { x: 38, y: 68 }, { x: 51, y: 30 }, { x: 62, y: 68 }]

// Growth-clock ("grow") targets per act, and how long each act takes to play.
const ACTS = [{ to: 1, dur: 1.7 }, { to: 2, dur: 1.7 }, { to: 4, dur: 2.8 }, { to: 5, dur: 1.5 }]

export default function Profile() {
  const root = useRef(null)
  const canvas = useRef(null)
  const actin = useRef(null)
  const network = useRef(null)
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const [mode, setMode] = useState('static')

  // Content appears exactly when the growing network reaches it.
  const reveals = useRef([])
  const queue = useRef({ target: 0, tween: null })

  useLayoutEffect(() => {
    const el = root.current
    const still = prefersReducedMotion()
    let a = null
    try { a = createActin(canvas.current, { still }) } catch (error) { console.warn('Actin renderer unavailable.', error) }
    if (!a) { setMode('static'); el.classList.add('is-built'); return undefined }
    actin.current = a
    if (import.meta.env.DEV) window.__actin = a
    setMode('live')
    a.setMeasure(() => el.getBoundingClientRect().top - canvas.current.getBoundingClientRect().top)

    const anchor = (name) => {
      const n = el.querySelector(`[data-anchor="${name}"]`), s = el.getBoundingClientRect(), r = n.getBoundingClientRect()
      return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }
    }
    const build = () => {
      // Measure every anchor where it will *rest*, not mid-entrance (the reveal shifts elements by 14px).
      el.classList.add('is-measuring')
      void el.offsetHeight
      const width = el.getBoundingClientRect().width
      const A = {
        head: anchor('head'), eyebrow: anchor('eyebrow'), lead: anchor('lead'), bio: anchor('bio'), chem: anchor('chem'), iiser: anchor('iiser'),
        now: anchor('now'), next: anchor('next'), stage: anchor('stage'), caps: capabilities.map((_, i) => anchor(`cap-${i}`)),
      }
      el.classList.remove('is-measuring')
      network.current = buildNetwork(A, { width, mobile: width < 780 })
      a.setNetwork(network.current)
      a.state.specimens.forEach((sp, i) => { sp.act = i === activeRef.current ? 1 : 0 })
      // Reveal schedule on the growth clock.
      const q = (sel) => el.querySelector(sel)
      reveals.current = [
        [.05, q('.profile__label')], [.12, q('.profile__eyebrow')], [.3, q('.profile__title')],
        [1.22, q('.profile__affiliation')], [1.42, q('[data-anchor="bio"]')], [1.48, q('[data-anchor="chem"]')],
        [1.3, q('.profile__abstract-label')], [1.38, q('.profile__lead')],
        [2.05, q('.profile__now')],
        ...network.current.capTimes.map((t, i) => [t + .25, q(`.specimen--${i}`)]),
        [3.5, q('.profile__readout')], [4.3, q('.profile__next')],
      ]
      if (still) { el.classList.add('is-built'); a.redraw() }
    }
    let raf = 0
    document.fonts?.ready.then(() => { raf = requestAnimationFrame(build) })

    // Rebuild when the section's size changes in *either* dimension: text reflowing above the stage
    // (late fonts, wrapping) moves every anchor, and the network must stay glued to the real content.
    let w0 = 0, h0 = 0, t = 0
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      if (Math.abs(r.width - w0) < 2 && Math.abs(r.height - h0) < 2) return
      w0 = r.width; h0 = r.height; clearTimeout(t); t = setTimeout(build, 150)
    })
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? a.play() : a.pause()), { rootMargin: '120px 0px' })
    io.observe(el)
    const onScroll = still ? () => a.redraw() : null
    if (onScroll) addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(raf); clearTimeout(t); ro.disconnect(); io.disconnect(); if (onScroll) removeEventListener('scroll', onScroll); a.destroy(); actin.current = null }
  }, [])

  // The four acts play as their part of the page arrives; a later act fast-forwards any earlier one.
  useEffect(() => {
    const el = root.current
    if (prefersReducedMotion()) return undefined
    const tick = () => {
      const a = actin.current
      if (!a) return
      for (const r of reveals.current) if (r[1] && !r[1].classList.contains('is-on') && a.state.grow >= r[0]) r[1].classList.add('is-on')
    }
    gsap.ticker.add(tick)
    const advance = (act) => {
      const a = actin.current, qd = queue.current
      if (!a || ACTS[act].to <= qd.target) return
      if (act === 0) gsap.to(a.state, { mono: 1.7, duration: 1.9, ease: 'none' })
      const from = a.state.grow
      let duration = 0
      ACTS.forEach((s, i) => {
        const lo = i ? ACTS[i - 1].to : 0
        const span = Math.max(0, Math.min(s.to, ACTS[act].to) - Math.max(lo, from))
        duration += span / (s.to - lo) * s.dur
      })
      qd.target = ACTS[act].to
      qd.tween?.kill()
      qd.tween = gsap.to(a.state, { grow: qd.target, duration: Math.max(.4, duration), ease: 'power1.inOut' })
      if (act >= 2) gsap.to(a.state, { world: 1, duration: 2.4, delay: .6, ease: ease.signature })
    }
    const triggers = [
      ['.profile__head', 'top 82%'], ['.profile__identity', 'top 78%'], ['.profile__stage', 'top 70%'], ['.profile__next', 'top 88%'],
    ].map(([sel, start], i) => ScrollTrigger.create({ trigger: el.querySelector(sel), start, once: true, onEnter: () => advance(i) }))
    return () => { gsap.ticker.remove(tick); triggers.forEach(t => t.kill()); queue.current.tween?.kill() }
  }, [])

  // Selecting a cell: it steps forward and starts its story; the others dim back (staging). A signal ripples out.
  const select = (i) => {
    setActive(i); activeRef.current = i
    const a = actin.current, n = network.current
    if (!a || !n) return
    a.state.active = i
    a.state.specimens.forEach((sp, k) => {
      gsap.to(sp, { act: k === i ? 1 : 0, duration: k === i ? .7 : .45, ease: k === i ? ease.enter : ease.exit, overwrite: 'auto' })
      if (k === i) sp.since = a.time()
    })
    const sp = a.state.specimens[i]
    a.state.ripple = { x: sp.x, y: sp.y, t: a.time() }
    gsap.fromTo(a.state, { glow: 1.6 }, { glow: 1, duration: 1.2, ease: ease.signature })
  }
  const hover = (i, on) => { const sp = actin.current?.state.specimens[i]; if (sp) gsap.to(sp, { hover: on ? 1 : 0, duration: on ? .25 : .4, ease: on ? ease.enter : ease.exit, overwrite: 'auto' }) }

  const onMove = (e) => {
    const a = actin.current
    if (!a) return
    const c = canvas.current.getBoundingClientRect()
    a.state.pointer.x = e.clientX - c.left; a.state.pointer.y = e.clientY - c.top
    a.pointer((e.clientX / innerWidth - .5) * 2, (e.clientY / innerHeight - .5) * 2)
  }
  const onEnter = () => actin.current && gsap.to(actin.current.state, { pointerAmt: 1, duration: .6, ease: ease.signature, overwrite: 'auto' })
  const onLeave = () => { const a = actin.current; if (a) { gsap.to(a.state, { pointerAmt: 0, duration: .9, ease: ease.signature, overwrite: 'auto' }); a.pointer(0, 0) } }

  const cap = capabilities[active]

  return (
    <section className={`profile profile--${mode}`} id="about" ref={root} onPointerMove={onMove} onPointerEnter={onEnter} onPointerLeave={onLeave}>
      <div className="profile__gl" aria-hidden="true"><canvas ref={canvas} /></div>

      <div className="profile__inner">
        <header className="profile__head" data-anchor="head">
          <p className="profile__label pf"><b>01</b><span>My profile</span></p>
          <div>
            <p className="eyebrow profile__eyebrow pf" data-anchor="eyebrow">Who I am · What I bring</p>
            <h2 className="profile__title pf">I move between biological scales, while keeping the question <em>experimentally grounded.</em></h2>
          </div>
        </header>

        {/* The title block of a paper: affiliation, training, and a short abstract in her own words. */}
        <div className="profile__identity">
          <div className="profile__credentials">
            <div className="profile__affiliation pf">
              <span className="affiliation__mark" data-anchor="iiser"><IiserMark /></span>
              <div className="affiliation__text">
                <strong>IISER Tirupati</strong>
                <span>Indian Institute of Science Education and Research</span>
                <small>BS–MS · 2022–present</small>
                <ul className="profile__training" aria-label="My degree">
                  <li className="training training--bio pf" data-anchor="bio"><i aria-hidden="true" /><b>Biology</b><span>Major</span></li>
                  <li className="training training--chem pf" data-anchor="chem"><i aria-hidden="true" /><b>Chemistry</b><span>Minor</span></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="profile__abstract">
            <p className="eyebrow profile__abstract-label pf">In brief</p>
            <p className="profile__lead pf" data-anchor="lead">I am a BS–MS student at IISER Tirupati, majoring in Biology with a Chemistry minor. My work spans mammalian cells, molecular signalling, microbial systems and computational biology. Across each setting, I look for the experiment that can turn an observation into a mechanism.</p>
          </div>
        </div>

        <div className="profile__stage" id="methods" data-anchor="stage">
          <div className="profile__now pf" data-anchor="now">
            <span>Now · current focus</span>
            <strong>WDR62, actin architecture and cell movement</strong>
          </div>

          <p className="profile__range" aria-label="Research range">Research range · Cellular · Molecular · Microbial · Computational</p>

          <div className="profile__specimens">
          {capabilities.map((c, i) => (
            <button key={c.id} className={`specimen specimen--${i} pf${active === i ? ' is-active' : ''}`} style={{ '--x': `${CAP_POS[i].x}%`, '--y': `${CAP_POS[i].y}%` }}
              data-anchor={`cap-${i}`} onClick={() => select(i)} onPointerEnter={() => hover(i, true)} onPointerLeave={() => hover(i, false)}
              onFocus={() => hover(i, true)} onBlur={() => hover(i, false)} aria-pressed={active === i} aria-label={`${c.title}: show what I can do`}>
              <span className="specimen__label"><small>{c.number} · {c.scale}</small>{c.title}</span>
            </button>
          ))}
          </div>

          <article className="profile__readout pf" aria-live="polite">
            <div key={cap.id} className="readout__body">
              <p className="readout__kicker"><b>{cap.number}</b><span>What I can do · {cap.title}</span></p>
              <h3>{cap.statement}</h3>
              <p className="readout__detail">{cap.detail}</p>
              <div className="readout__evidence"><span>Demonstrated in</span><strong>{cap.evidence}</strong></div>
              <div className="readout__tags">{cap.methods.map(m => <span key={m}>{m}</span>)}</div>
            </div>
          </article>

          <div className="profile__next pf" data-anchor="next">
            <span>Next · PhD direction</span>
            <strong>Mechanistic cell biology and disease</strong>
            <small>Cancer progression and disease-associated cellular remodelling</small>
          </div>
        </div>
      </div>
    </section>
  )
}
