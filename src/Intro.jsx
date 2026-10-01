import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap, ease, dur, prefersReducedMotion } from './motion'

// Plays on every fresh load or reload (it is skippable). It stays out of the way for deep links
// (a shared /#projects URL) and for reduced motion; ?intro forces it for previewing.
export function shouldPlayIntro() {
  if (new URLSearchParams(location.search).has('intro')) return true
  if (prefersReducedMotion()) return false
  const reload = performance.getEntriesByType('navigation')[0]?.type === 'reload'
  return reload || !location.hash
}

const chromosomes = [
  { x: -22, y: -26, r: -38 }, { x: 18, y: -30, r: 24 }, { x: -30, y: 4, r: 62 },
  { x: 26, y: 10, r: -18 }, { x: -8, y: 28, r: 12 }, { x: 14, y: 30, r: -55 },
]
const motes = Array.from({ length: 14 }, (_, i) => ({
  x: Math.cos(i * 2.4) * (170 + (i % 4) * 34), y: Math.sin(i * 2.4) * (105 + (i % 3) * 28), r: 1 + (i % 3) * .7,
}))

// Mitosis as the opening narrative:
// setup (cell emerges) → anticipation (chromosomes condense and align, cell tenses)
// → action (anaphase + cytokinesis) → reaction (daughters drift, text reveals) → resolution (hand-off to hero).
export default function Intro({ onDone, onHandoff }) {
  const root = useRef(null)
  const timeline = useRef(null)
  const finished = useRef(false)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    onDone()
  }

  useLayoutEffect(() => {
    document.documentElement.classList.add('is-intro')
    const q = gsap.utils.selector(root)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: ease.signature }, onComplete: () => document.documentElement.classList.remove('is-intro') })
      timeline.current = tl

      gsap.set(q('.intro__cell'), { transformOrigin: '50% 50%' })
      gsap.set(q('.intro__chromosome'), { transformOrigin: '50% 50%', opacity: 0, scale: .2, x: (i) => chromosomes[i].x, y: (i) => chromosomes[i].y, rotation: (i) => chromosomes[i].r })

      // Ambient: motes and glow breathe for the whole piece at 10-20% of primary energy.
      tl.fromTo(q('.intro__mote'), { opacity: 0 }, { opacity: .55, duration: 1.2, stagger: { each: .03, from: 'random' }, ease: ease.ambient }, 0)
      q('.intro__mote').forEach((mote, i) => gsap.to(mote, { y: `+=${6 + (i % 3) * 3}`, duration: 3 + (i % 4) * .6, repeat: -1, yoyo: true, ease: ease.ambient, delay: i * .1 }))

      // 1. Setup — the cell emerges (outward = emergence).
      tl.fromTo(q('.intro__cell'), { scale: .55, opacity: 0 }, { scale: 1, opacity: 1, duration: dur.dramatic, ease: ease.enter }, .1)
        .fromTo(q('.intro__glow'), { scale: .4, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: ease.enter }, .2)

      // 2. Anticipation — chromosomes condense, then align on the metaphase plate.
        .to(q('.intro__chromosome'), { opacity: 1, scale: 1, duration: dur.quick, stagger: .04, ease: ease.enter }, .7)
        .to(q('.intro__chromosome'), { x: 0, y: (i) => -30 + i * 12, rotation: 90, duration: dur.standard, stagger: .03 }, 1.05)
        .fromTo(q('.intro__spindle'), { strokeDashoffset: 80, opacity: 0 }, { strokeDashoffset: 0, opacity: .7, duration: dur.standard }, 1.1)
        .to(q('.intro__cell'), { scaleX: .965, scaleY: 1.025, duration: .18, ease: 'sine.inOut' }, 1.55)

      // 3. Action — sisters separate (primary), the membrane follows 100ms later (follow-through).
        .to(q('.intro__chromosome'), { x: (i) => (i % 2 ? 40 : -40), duration: .6 }, 1.75)
        .to(q('.intro__spindle'), { opacity: 0, duration: dur.quick, ease: ease.exit }, 1.95)
        .to(q('.intro__cell'), { scaleX: 1, scaleY: 1, duration: .3 }, 1.75)
        .to(q('.intro__half--a'), { attr: { cx: -66 }, duration: .8 }, 1.85)
        .to(q('.intro__half--b'), { attr: { cx: 66 }, duration: .8 }, 1.85)

      // 4. Reaction — daughters drift apart with a slight arc; nuclei re-form; words arrive.
        .to(q('.intro__half--a'), { attr: { cx: -100, cy: -8 }, duration: 1, ease: ease.ambient }, 2.45)
        .to(q('.intro__half--b'), { attr: { cx: 100, cy: 8 }, duration: 1, ease: ease.ambient }, 2.45)
        .to(q('.intro__chromosome'), { x: (i) => (i % 2 ? 100 : -100), y: (i) => (i % 2 ? 8 : -8) + (i - 2.5) * 3, scale: .45, opacity: 0, duration: dur.slow }, 2.45)
        .fromTo(q('.intro__nucleus'), { scale: .2, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: dur.standard, ease: ease.enter }, 2.5)
        .fromTo(q('.intro__line > span'), { yPercent: 110 }, { yPercent: 0, duration: dur.slow, stagger: dur.quick / 3, ease: ease.enter }, 2.05)

      // 5. Resolution — no exit at all: the hero shader redraws this exact frame underneath
      // (same cells, rim, glow, backdrop), so the intro simply dissolves into it and the scene continues.
      tl.addLabel('exit', 3.25)
        .call(() => {
          const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 } }
          const a = box(q('.intro__half--a')[0]), b = box(q('.intro__half--b')[0]), glow = box(q('.intro__glow')[0])
          const unit = b.r / 64
          // The goo filter renders the membrane's visible edge at ~66 units and a 3-unit rim.
          onHandoff?.({ a: { ...a, r: unit * 66 }, b: { ...b, r: unit * 66 }, glow, rim: unit * 3 })
        }, null, 'exit+=.01')
        .to(q('.intro__copy'), { y: -12, opacity: 0, duration: dur.quick, ease: ease.exit }, 'exit')
        .to(q('.intro__skip'), { opacity: 0, duration: dur.quick, ease: ease.exit }, 'exit')
        .to([q('.intro__bg')[0], q('.intro__art')[0]], { opacity: 0, duration: .28, ease: ease.signature }, 'exit+=.12')
        .call(finish, null, 'exit+=.45')
    }, root)

    const skip = () => {
      const tl = timeline.current
      if (!tl || tl.time() >= tl.labels.exit) return
      tl.seek('exit').timeScale(1.6)
    }
    const keys = (event) => (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') && skip()
    root.current.addEventListener('pointerdown', skip)
    addEventListener('keydown', keys)
    addEventListener('wheel', skip, { passive: true })
    addEventListener('touchmove', skip, { passive: true })
    // Last-resort only (e.g. a stalled tab): the timeline itself always finishes the intro.
    const safety = setTimeout(finish, 12000)

    return () => {
      clearTimeout(safety)
      removeEventListener('keydown', keys)
      removeEventListener('wheel', skip)
      removeEventListener('touchmove', skip)
      document.documentElement.classList.remove('is-intro')
      ctx.revert()
    }
  }, [])

  useEffect(() => { root.current?.focus({ preventScroll: true }) }, [])

  return (
    <div className="intro" ref={root} role="dialog" aria-label="Opening animation. Press Escape to skip." tabIndex={-1}>
      <div className="intro__bg" aria-hidden="true" />
      <div className="intro__stage">
        <svg className="intro__art" viewBox="-300 -190 600 380" aria-hidden="true">
          <defs>
            <filter id="intro-goo" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
            </filter>
            <radialGradient id="intro-glow"><stop offset="0" stopColor="#62c9d0" stopOpacity=".32" /><stop offset="1" stopColor="#62c9d0" stopOpacity="0" /></radialGradient>
            <radialGradient id="intro-cyto" cx=".42" cy=".38"><stop offset="0" stopColor="#0f3a3b" /><stop offset="1" stopColor="#061f22" /></radialGradient>
          </defs>
          {motes.map((m, i) => <circle key={i} className="intro__mote" cx={m.x} cy={m.y} r={m.r} />)}
          <circle className="intro__glow" r="190" fill="url(#intro-glow)" />
          <g className="intro__cell">
            {/* Two gooey passes give a thin membrane rim that pinches during cytokinesis. */}
            <g filter="url(#intro-goo)" fill="#7fd3c1"><circle className="intro__half intro__half--a" cx="0" cy="0" r="64" /><circle className="intro__half intro__half--b" cx="0" cy="0" r="64" /></g>
            <g filter="url(#intro-goo)" fill="url(#intro-cyto)"><circle className="intro__half intro__half--a" cx="0" cy="0" r="61" /><circle className="intro__half intro__half--b" cx="0" cy="0" r="61" /></g>
            <path className="intro__spindle" d="M-58 0Q-20 -30 0 -30M-58 0Q-20 30 0 30M58 0Q20 -30 0 -30M58 0Q20 30 0 30M-58 0H58" strokeDasharray="80" />
            <circle className="intro__nucleus" cx="-100" cy="-8" r="15" />
            <circle className="intro__nucleus" cx="100" cy="8" r="15" />
            {chromosomes.map((_, i) => <rect key={i} className="intro__chromosome" x="-7" y="-2.2" width="14" height="4.4" rx="2.2" />)}
          </g>
        </svg>
        <div className="intro__copy">
          <p className="intro__line"><span>Harini Madheswaran · Research portfolio</span></p>
          <p className="intro__line intro__line--quote"><span>Inside every cell, structure becomes decision.</span></p>
        </div>
      </div>
      <button className="intro__skip" onClick={(e) => { e.stopPropagation(); timeline.current?.seek('exit').timeScale(1.6) }}>Skip intro</button>
    </div>
  )
}
