import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, ease, dur, stagger, prefersReducedMotion } from './motion'
import { createTissue, heroSpot } from './hero/tissue'
import { formName, sampleName } from './hero/formName'

const VERBS = ['organise', 'communicate', 'adapt']

// The interaction hint sits under the cell on desktop, above it on phones (the name lives below there).
const hintAt = (spot, width) => (width < 780 ? { x: spot.x, y: spot.y - spot.r - 30 } : { x: spot.x, y: spot.y + spot.r + 34 })
const DNA = 'ACGT·01'

function Arrow({ down = false }) {
  return <span aria-hidden="true">{down ? '↓' : '↗'}</span>
}

function CellField() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduceMotion = prefersReducedMotion()
    let frame = 0
    let active = true
    let points = []
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2)
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      canvas.style.width = `${innerWidth}px`
      canvas.style.height = `${innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      points = Array.from({ length: innerWidth < 700 ? 30 : 72 }, () => ({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        r: Math.random() * 1.6 + .3, speed: Math.random() * .18 + .05,
        phase: Math.random() * Math.PI * 2,
      }))
    }
    const draw = (time = 0) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      points.forEach((p, i) => {
        p.y -= p.speed
        if (p.y < -8) p.y = innerHeight + 8
        const pulse = .35 + Math.sin(time * .001 + p.phase) * .25
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = i % 7 === 0 ? `rgba(239,141,114,${pulse})` : `rgba(159,216,199,${pulse})`
        ctx.fill()
      })
      frame = reduceMotion || !active ? 0 : requestAnimationFrame(draw)
    }
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting && !document.hidden
      if (!active && frame) { cancelAnimationFrame(frame); frame = 0 }
      if (active && !frame) draw()
    })
    const onVisibility = () => {
      active = !document.hidden && canvas.getBoundingClientRect().bottom > 0
      if (!active && frame) { cancelAnimationFrame(frame); frame = 0 }
      if (active && !frame) draw()
    }
    resize(); draw(); observer.observe(canvas); addEventListener('resize', resize); document.addEventListener('visibilitychange', onVisibility)
    return () => { cancelAnimationFrame(frame); observer.disconnect(); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])
  return <canvas className="cell-field" ref={ref} aria-hidden="true" />
}

// Each verb carries its own tiny piece of biology instead of a sentence explaining it.
function VerbGlyph({ verb }) {
  if (verb === 'organise') return <svg className="glyph glyph--organise" viewBox="0 0 40 40" aria-hidden="true">{[0, 1, 2, 3].map(i => <line key={i} x1="8" x2="32" y1={9 + i * 7.5} y2={9 + i * 7.5} style={{ '--r': `${[38, -52, 24, -30][i]}deg`, '--d': `${i * 60}ms` }} />)}</svg>
  if (verb === 'communicate') return <svg className="glyph glyph--communicate" viewBox="0 0 40 40" aria-hidden="true"><circle cx="7" cy="20" r="4" /><circle cx="33" cy="20" r="4" /><line x1="11" x2="29" y1="20" y2="20" /><circle className="glyph__pulse" cx="11" cy="20" r="2.4" /></svg>
  return <svg className="glyph glyph--adapt" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 6C29 6 34 12 34 20C34 28 28 34 20 34C12 34 6 28 6 20C6 12 11 6 20 6Z" /></svg>
}

function RoleLine({ cycling }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!cycling) return undefined
    const id = setInterval(() => setIndex(i => (i + 1) % VERBS.length), 2800)
    return () => clearInterval(id)
  }, [cycling])
  if (prefersReducedMotion()) return <h2 className="hero__role">Experimental biologist studying how cells organise, communicate and adapt.</h2>
  return (
    <h2 className="hero__role">
      <span className="hero__role-lead">Experimental biologist studying how cells</span>{' '}
      <span className="verb" aria-live="off">
        {VERBS.map((verb, i) => (
          <span key={verb} className={`verb__item ${i === index ? 'is-active' : i === (index + VERBS.length - 1) % VERBS.length ? 'is-past' : ''}`} aria-hidden={i !== index}>
            <VerbGlyph verb={verb} /><b>{verb}.</b>
          </span>
        ))}
      </span>
      <span className="sr-only">organise, communicate and adapt.</span>
    </h2>
  )
}

function scramble(el, duration = .7) {
  const final = el.dataset.text || (el.dataset.text = el.textContent)
  const state = { p: 0 }
  return gsap.to(state, {
    p: 1, duration, ease: 'none',
    onUpdate: () => {
      const n = Math.floor(state.p * final.length)
      el.textContent = final.slice(0, n) + final.slice(n).replace(/[^\s·]/g, () => DNA[Math.floor(Math.random() * DNA.length)])
    },
    onComplete: () => { el.textContent = final },
  })
}

export default function Hero({ go, origin, onReviewer }) {
  const root = useRef(null)
  const canvas = useRef(null)
  const h1 = useRef(null)
  const tissue = useRef(null)
  const nameSample = useRef(null)
  const played = useRef(false)
  const settled = useRef(false)
  const nameField = useRef(null)
  const dividing = useRef(false)
  const [mode, setMode] = useState('static')
  const [cycling, setCycling] = useState(false)
  const [hint, setHint] = useState(null)

  const size = () => {
    const r = root.current.getBoundingClientRect()
    const copy = root.current.querySelector('.hero__copy .eyebrow')
    return { width: r.width, height: r.height, left: r.left, top: r.top, copyTop: copy ? copy.getBoundingClientRect().top - r.top : undefined }
  }
  const spotFor = ({ width, height, copyTop }) => heroSpot(width, height, copyTop)

  // Put the world into its formed state (used after the entrance, on resize, and for reduced motion).
  const settle = (s) => {
    const { width, height, copyTop } = size()
    const spot = heroSpot(width, height, copyTop)
    if (s.state.interactive) Object.assign(s.state.anchor, spot)
    Object.assign(s.state.cellB, { x: spot.x, y: spot.y, r: spot.r, a: 1 })
    setHint(h => ({ ...h, ...hintAt(spot, width) }))
    Object.assign(s.state.glow, { x: spot.x, y: spot.y, r: spot.r * 2.7, amt: .2 })
    Object.assign(s.state.base, { x: width * .5 + (spot.x - width * .5) * .65, y: height * .46 + (spot.y - height * .46) * .65, r: Math.hypot(width, height) * .8 })
    s.state.cellA.a = 0
  }

  useLayoutEffect(() => {
    const still = prefersReducedMotion()
    let s = null
    try { s = createTissue(canvas.current, { still }) } catch (error) { console.warn('Tissue shader unavailable; using static art.', error) }
    if (!s) { setMode('static'); return undefined }
    tissue.current = s
    if (import.meta.env.DEV) window.__tissue = s
    setMode('live')
    { const sz = size(); setHint(h => ({ ...h, ...hintAt(spotFor(sz), sz.width) })) }
    if (still) { settle(s); s.redraw() }

    const io = new IntersectionObserver(([entry]) => {
      const on = entry.isIntersecting && !document.hidden
      if (on) { s.play(); nameField.current?.play() } else { s.pause(); nameField.current?.pause() }
    })
    io.observe(root.current)
    let resizeTimer = 0
    const onResize = () => {
      if (settled.current || still) { settle(s); if (still) s.redraw() }
      // Re-target the resting grains once the layout has settled.
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (nameField.current) sampleName({ host: root.current, lines: root.current.querySelectorAll('h1 .line > span') }).then((next) => nameField.current?.rebuild(next))
      }, 250)
    }
    addEventListener('resize', onResize)
    const st = ScrollTrigger.create({ trigger: root.current, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (self) => { s.state.scroll = self.progress } })
    return () => { io.disconnect(); clearTimeout(resizeTimer); removeEventListener('resize', onResize); st.kill(); s.destroy(); tissue.current = null; nameField.current?.destroy(); nameField.current = null }
  }, [])

  // Sample the name's glyphs while the intro is still playing, so the hand-off has no main-thread work.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined
    const run = () => { nameSample.current = sampleName({ host: root.current, lines: root.current.querySelectorAll('h1 .line > span') }) }
    const id = (window.requestIdleCallback || setTimeout)(run, { timeout: 1200 })
    return () => (window.cancelIdleCallback || clearTimeout)(id)
  }, [])

  // The entrance continues the intro's scene: no cut, no curtain — the cell travels, the world rises.
  useLayoutEffect(() => {
    if (!go || played.current) return undefined
    played.current = true
    const el = root.current
    const q = gsap.utils.selector(el)
    if (prefersReducedMotion()) return undefined
    const s = tissue.current
    const sz = size()
    const { width, height, left, top } = sz
    const spot = spotFor(sz)
    const small = width < 780

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: ease.enter },
        onComplete: () => {
          settled.current = true
          // Hand the cell over to the interaction loop: from here it is anchor + crawl.
          if (s) { Object.assign(s.state.anchor, { x: spot.x, y: spot.y, r: spot.r }); s.state.follow.x = 0; s.state.follow.y = 0; s.state.interactive = true }
        },
      })
      gsap.set(h1.current, { opacity: 0 })
      gsap.set(q('.hero__role, .hero__actions, .hero__cue'), { opacity: 0, y: 18 })
      gsap.set(q('.hero__copy .eyebrow'), { opacity: 0 })
      // Lead with the hero: page chrome (header, story rail, progress) arrives last, as follow-through.
      const chrome = document.querySelectorAll('.site-header, .signal-nav, .scroll-progress')
      gsap.set(chrome, { opacity: 0 })

      // Starting frame = the intro's final frame (or, without an intro, one cell glowing at centre).
      const rel = (c) => ({ x: c.x - left, y: c.y - top, r: c.r })
      const b0 = origin ? rel(origin.b) : { x: width * .5, y: height * .46, r: 92 }
      const a0 = origin ? rel(origin.a) : null
      const g0 = origin ? rel(origin.glow) : { x: b0.x, y: b0.y, r: b0.r * 2.9 }
      let cell = { x: b0.x, y: b0.y, r: b0.r }

      if (s) {
        const st = s.state
        st.on = true
        st.rim = origin?.rim || 4.3
        Object.assign(st.cellB, { ...b0, a: 1 })
        Object.assign(st.cellA, a0 ? { ...a0, a: 1, blur: 0 } : { a: 0 })
        Object.assign(st.glow, { ...g0, amt: .32 })
        Object.assign(st.base, { x: innerWidth * .5 - left, y: innerHeight * .46 - top, r: Math.hypot(Math.max(innerWidth * .5, innerWidth * .5), Math.max(innerHeight * .46, innerHeight * .54)) })
        st.world = 0; st.detail = 0

        // Primary — the daughter cell travels on a gentle arc (control point lifted) and grows into the hero cell.
        const ctrl = { x: (b0.x + spot.x) / 2 + 30, y: Math.min(b0.y, spot.y) - 70 }
        const travel = { t: 0 }
        tl.to(travel, {
          t: 1, duration: 2.1, ease: 'power2.inOut',
          onUpdate: () => {
            const t = travel.t, i = 1 - t
            st.cellB.x = i * i * b0.x + 2 * i * t * ctrl.x + t * t * spot.x
            st.cellB.y = i * i * b0.y + 2 * i * t * ctrl.y + t * t * spot.y
            st.cellB.r = b0.r + (spot.r - b0.r) * gsap.parseEase('power2.inOut')(t)
            st.glow.x = st.cellB.x; st.glow.y = st.cellB.y
            cell = st.cellB
          },
        }, .15)
        tl.to(st.glow, { r: spot.r * 2.7, amt: .2, duration: 2.1, ease: ease.signature }, .15)
        tl.to(st.base, { x: width * .5 + (spot.x - width * .5) * .65, y: height * .46 + (spot.y - height * .46) * .65, r: Math.hypot(width, height) * .8, duration: 2.4, ease: ease.signature }, .15)
        // Secondary — the sibling recedes out of focus and becomes part of the far layer.
        if (a0) tl.to(st.cellA, { x: a0.x - 80, y: a0.y - 40, r: a0.r * .72, blur: 1, a: 0, duration: 1.9, ease: ease.signature }, .15)
        // Ambient — the world rises in depth order, then the cell's interior comes alive.
        tl.to(st, { world: 1, duration: 2.6, ease: ease.signature }, .3)
        tl.to(st, { detail: 1, duration: 1.9, ease: ease.signature }, .9)
      } else {
        tl.fromTo(q('.hero__dim'), { opacity: 1 }, { opacity: 0, duration: 1.4, ease: ease.signature }, 0)
      }

      // Cells stream out of the travelling cell and become her name; the eyebrow decodes like a sequence read.
      tl.call(() => {
        const from = s ? { x: cell.x + left, y: cell.y + top } : { x: left + width * .7, y: top + height * .5 }
        const sample = nameSample.current || sampleName({ host: el, lines: q('h1 .line > span') })
        Promise.resolve(sample)
          .then((ready) => { nameField.current = formName({ host: el, h1: h1.current, sample: ready, origin: from, spread: cell.r * .6, onLand: () => gsap.to(h1.current, { opacity: 1, duration: .45, ease: ease.signature }) }) })
          .catch(() => gsap.set(h1.current, { opacity: 1 }))
      }, null, .6)
      // The name is guaranteed to arrive with the timeline, even if the grain drawing was paused (e.g. the
      // visitor scrolled during the hand-off) — opacity 1 is idempotent if the grains already revealed it.
      tl.to(h1.current, { opacity: 1, duration: .45, ease: ease.signature }, 3.1)
      // On phones the grains fly through the eyebrow line, so it decodes once they have passed.
      const eyebrowAt = small ? 2.1 : .35
      tl.set(q('.hero__copy .eyebrow'), { opacity: 1 }, eyebrowAt)
      tl.add(scramble(q('.hero__copy .eyebrow')[0], .8), eyebrowAt)
      tl.to(chrome, { opacity: 1, duration: dur.slow, stagger: stagger.standard, ease: ease.signature }, 2.5)
      tl.to(q('.hero__role, .hero__actions'), { opacity: 1, y: 0, duration: dur.slow, stagger: stagger.dramatic }, 1.9)
        .call(() => setCycling(true), null, 3.3)
        .to(q('.hero__cue'), { opacity: 1, y: 0, duration: dur.slow }, 2.7)
        .call(() => setHint(h => h && { ...h, on: true }), null, 3.6)
    }, el)
    // Reset the guard too: StrictMode's mount → cleanup → mount must replay the entrance, not skip it.
    return () => { ctx.revert(); played.current = false }
  }, [go])

  const sensing = useRef(false)
  const onMove = (event) => {
    if (!sensing.current) onEnter()
    const rect = root.current.getBoundingClientRect()
    const s = tissue.current
    if (s) {
      s.pointer(((event.clientX - rect.left) / rect.width - .5) * 2, ((event.clientY - rect.top) / rect.height - .5) * 2)
      s.state.pointer.x = event.clientX - rect.left; s.state.pointer.y = event.clientY - rect.top
    }
    nameField.current?.pointer(event.clientX, event.clientY)
  }
  // The cell senses the cursor only once it has settled; the pull eases in and out like a gradient forming.
  const onEnter = () => {
    const s = tissue.current
    if (!s || prefersReducedMotion()) return
    sensing.current = true
    gsap.to(s.state, { pull: 1, duration: 1.2, ease: ease.signature, overwrite: 'auto' })
  }
  const onLeave = () => {
    sensing.current = false
    const s = tissue.current
    if (s) { s.pointer(0, 0); gsap.to(s.state, { pull: 0, duration: 1.6, ease: ease.signature, overwrite: 'auto' }) }
    nameField.current?.leave()
  }

  // Click → mitosis, told in four beats: rounding (anticipation) → pinch (action) →
  // the daughter on the click side drifts out of focus (reaction) → the other settles home (resolution).
  const onDivide = (event) => {
    const s = tissue.current
    if (!s || !s.state.interactive || dividing.current || prefersReducedMotion()) return
    if (event.target.closest('a, button, h1, .hero__role')) return
    const st = s.state
    const rect = root.current.getBoundingClientRect()
    const b = st.cellB
    let ax = event.clientX - rect.left - b.x, ay = event.clientY - rect.top - b.y
    const len = Math.hypot(ax, ay) || 1; ax /= len; ay /= len
    dividing.current = true
    setHint(h => h && { ...h, used: true })
    const home = { x: st.anchor.x, y: st.anchor.y, r: st.anchor.r }
    st.divAxis.x = ax; st.divAxis.y = ay
    const tl = gsap.timeline({ onComplete: () => { dividing.current = false } })
    tl.to(st, { pullScale: 0, duration: .35, ease: ease.signature }, 0)
      .to(st.anchor, { r: home.r * .95, duration: .32, ease: 'sine.inOut' }, 0)
      .to(st, { div: 1, duration: 1.05, ease: 'power2.inOut' }, .3)
      .to(st.anchor, { r: home.r, duration: .45, ease: ease.signature }, .3)
      .call(() => {
        // Swap the pinched pair for two real cells at exactly the same place — invisible by construction.
        const R = st.anchor.r, off = R * .85, r = R * .74
        Object.assign(st.cellA, { x: b.x + ax * off, y: b.y + ay * off, r, a: 1, blur: 0, detail: st.detail })
        st.div = 0
        st.anchor.x -= ax * off; st.anchor.y -= ay * off; st.anchor.r = r
      }, null, 1.36)
      .to(st.cellA, { x: `+=${ax * 130}`, y: `+=${ay * 130}`, r: home.r * .5, blur: 1, a: 0, detail: 0, duration: 1.9, ease: ease.signature }, 1.37)
      .to(st.anchor, { x: home.x, y: home.y, r: home.r, duration: 1.5, ease: ease.signature }, 1.37)
      .to(st, { pullScale: 1, duration: .9, ease: ease.signature }, 2.2)
  }

  return (
    <section className={`hero hero--${mode}`} id="chapter-0" ref={root} onPointerMove={onMove} onPointerEnter={onEnter} onPointerLeave={onLeave} onClick={onDivide}>
      <div className="hero__art hero__art-base" />
      <div className="hero__art hero__art-focus" />
      <canvas className="hero__tissue" ref={canvas} aria-hidden="true" />
      {mode === 'static' && <CellField />}
      <div className="hero__veil" /><div className="hero__dim" aria-hidden="true" />

      <div className="hero__copy">
        <p className="eyebrow">BS–MS researcher · Biology major · Chemistry minor</p>
        <h1 ref={h1}><span className="line"><span>Harini</span></span> <em className="line"><span>Madheswaran<span className="hero__nucleus">.</span></span></em></h1>
        <RoleLine cycling={cycling} />
        <div className="hero__actions">
          <a href="#about" className="button button--light">Meet me <Arrow down /></a>
          <a href="#journey" className="button button--ghost">Follow my journey <Arrow /></a>
          {/* A quarter-turn of a stopwatch ring: the brief takes about 90 seconds. */}
          <button className="hero__brief" onClick={onReviewer}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" /><path d="M10 2.5A7.5 7.5 0 0 1 17.5 10" /></svg>
            <span><small>PhD reviewers</small>90-second brief</span>
          </button>
        </div>
      </div>

      {mode === 'live' && hint && !prefersReducedMotion() && (
        <p className={`hero__hint${hint.on ? ' is-on' : ''}${hint.used ? ' is-used' : ''}`} style={{ left: hint.x, top: hint.y }} aria-hidden="true">
          <span className="hero__hint-desktop">Move to guide the cell · click to divide</span><span className="hero__hint-touch">Tap to divide</span>
        </p>
      )}

      <a className="hero__cue" href="#about" aria-label="Scroll to profile">
        <svg viewBox="0 0 40 60" aria-hidden="true"><path className="cue__trail" d="M20 4V38" /><path className="cue__cell" d="M20 36C26 36 29 41 29 46C29 52 25 56 20 56C15 56 11 52 11 46C11 41 14 36 20 36Z" /></svg>
      </a>
    </section>
  )
}
