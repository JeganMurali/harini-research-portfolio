import { gsap, ease } from '../motion'

const FLIGHT = '#9fd8c7'

// Rasterise each line with its real computed font at its real baseline, then sample the ink.
// Runs ahead of time (before the hand-off) on small, line-sized canvases so the reveal never stalls.
export async function sampleName({ host, lines }) {
  await document.fonts?.ready
  const hostRect = host.getBoundingClientRect()
  const targets = []
  for (const line of lines) {
    const style = getComputedStyle(line)
    const probe = document.createElement('i')
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
    line.appendChild(probe)
    const baseline = probe.getBoundingClientRect().bottom - hostRect.top
    probe.remove()
    const box = line.getBoundingClientRect()
    const x0 = box.left - hostRect.left - 20, y0 = box.top - hostRect.top - 20
    const w = Math.ceil(box.width + 60), h = Math.ceil(box.height + 40)
    const off = document.createElement('canvas')
    off.width = w; off.height = h
    const o = off.getContext('2d', { willReadFrequently: true })
    o.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    o.letterSpacing = style.letterSpacing
    o.fillStyle = '#fff'; o.textBaseline = 'alphabetic'
    o.fillText(line.textContent, box.left - hostRect.left - x0, baseline - y0)
    const data = o.getImageData(0, 0, w, h).data
    const pts = []
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (data[(y * w + x) * 4 + 3] > 140) pts.push([x0 + x, y0 + y])
    targets.push({ pts, color: style.color, cx: box.left - hostRect.left + box.width / 2, cy: box.top - hostRect.top + box.height / 2 })
  }
  return { targets }
}

// Stroke many short segments in one call per (colour, alpha, blend) bucket — thousands of streaks stay cheap.
function strokeBuckets(ctx, buckets) {
  for (const b of buckets.values()) {
    if (!b.n) continue
    ctx.globalCompositeOperation = b.blend
    ctx.globalAlpha = b.alpha
    ctx.strokeStyle = b.color
    ctx.lineWidth = b.width
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let i = 0; i < b.n; i++) { const j = i * 4; ctx.moveTo(b.seg[j], b.seg[j + 1]); ctx.lineTo(b.seg[j + 2], b.seg[j + 3]) }
    ctx.stroke()
    b.n = 0
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
}

// "Cells become a name" — and then the name stays alive.
// Flight: grains stream out of the cell on arcs (no straight run crosses more than a third of the screen),
// drawn as motion-blur streaks that glow where they overlap; a few large defocused grains pass in front.
// Landing: each grain arrives slightly wide of its glyph and condenses in (follow-through), as a reading-order wave.
// Rest: the real text takes over; near the cursor it dissolves back into grains that swirl away and spring home.
export function formName({ host, h1, sample, origin, spread = 46, onLand }) {
  const dpr = Math.min(devicePixelRatio || 1, 2)
  const mobile = innerWidth < 780
  const canvas = document.createElement('canvas')
  canvas.className = 'hero__particles'
  host.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  let W = 0, H = 0
  const size = () => {
    const r = host.getBoundingClientRect(); W = r.width; H = r.height
    canvas.width = W * dpr; canvas.height = H * dpr
  }
  size()

  const hostRect = host.getBoundingClientRect()
  const ox0 = origin.x - hostRect.left, oy0 = origin.y - hostRect.top
  const curve = gsap.parseEase(ease.enter)
  const settle = gsap.parseEase(ease.signature)

  // Struct-of-arrays particle store.
  let N = 0, tx, ty, sx, sy, mx, my, ex, ey, delay, dur, col, px, py, vx, vy, dx, dy
  let colors = []
  let box = { x: 0, y: 0, w: 0, h: 0 }

  function build(s, fromOrigin) {
    const cap = mobile ? 1500 : 3400
    const all = s.targets.reduce((n, t) => n + t.pts.length, 0)
    const keep = Math.min(1, cap / Math.max(1, all))
    const list = []
    colors = s.targets.map(t => t.color)
    s.targets.forEach((t, ci) => { for (const [x, y] of t.pts) if (Math.random() <= keep) list.push([x, y, ci, t.cx, t.cy]) })
    N = list.length
    const A = () => new Float32Array(N)
    tx = A(); ty = A(); sx = A(); sy = A(); mx = A(); my = A(); ex = A(); ey = A(); delay = A(); dur = A()
    px = A(); py = A(); vx = A(); vy = A(); dx = A(); dy = A(); col = new Uint8Array(N)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    list.forEach(([x, y, ci, cx, cy], i) => {
      tx[i] = x; ty[i] = y; col[i] = ci
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
      // The landing spot starts a little wide of the glyph (away from the line's centre) and condenses in.
      ex[i] = (x - cx) * .12 + (Math.random() - .5) * 10; ey[i] = (y - cy) * .22 + (Math.random() - .5) * 10
      if (fromOrigin) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * spread
        sx[i] = ox0 + Math.cos(a) * r; sy[i] = oy0 + Math.sin(a) * r
        mx[i] = (sx[i] + x) / 2 + (Math.random() - .5) * 260; my[i] = (sy[i] + y) / 2 - 60 - Math.random() * 170
        px[i] = sx[i]; py[i] = sy[i]
      }
    })
    const span = Math.max(1, maxX - minX)
    for (let i = 0; i < N; i++) { delay[i] = ((tx[i] - minX) / span) * .45 + Math.random() * .08; dur[i] = 1.05 + Math.random() * .3 }
    box = { x: minX - 80, y: minY - 80, w: span + 160, h: maxY - minY + 160 }
  }
  build(sample, true)

  // Large defocused grains that drift past in front (depth), never landing.
  const bokeh = Array.from({ length: mobile ? 8 : 16 }, () => ({
    a: -Math.PI * (.55 + Math.random() * .9), dist: 260 + Math.random() * 520, r: 3 + Math.random() * 6,
    delay: Math.random() * .5, dur: 1.4 + Math.random() * .7, lift: (Math.random() - .5) * 200,
  }))

  const buckets = new Map()
  const bucket = (key, color, alpha, width, blend) => {
    let b = buckets.get(key)
    if (!b || b.seg.length < N * 4) { b = { color, alpha, width, blend, seg: new Float32Array(N * 4 + 16), n: 0 }; buckets.set(key, b) }
    b.alpha = alpha
    return b
  }
  const push = (b, x1, y1, x2, y2) => { const j = b.n * 4; b.seg[j] = x1; b.seg[j + 1] = y1; b.seg[j + 2] = x2; b.seg[j + 3] = y2; b.n++ }

  const total = .45 + .08 + 1.35 + .35
  // Flight time runs on a GSAP clock, so it stays in step with every other timeline (and lag smoothing).
  const clock = gsap.to({}, { duration: total + .1, ease: 'none' })
  let mode = 'flight', landed = false, frame = 0, running = true, fade = 1

  // Rest-mode interaction state.
  const holeR = mobile ? 52 : 74
  const cursor = { x: -9999, y: -9999, inside: false }
  let hole = 0, energy = 0
  const glints = Array.from({ length: 7 }, () => ({ i: -1, life: Math.random() }))

  function drawFlight(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const mint = bucket('m', FLIGHT, .55, 1.25, 'lighter')
    const land = colors.map((c, ci) => bucket('l' + ci, c, .95 * fade, 1.5, 'source-over'))
    for (let i = 0; i < N; i++) {
      const k = Math.min(1, Math.max(0, (t - delay[i]) / dur[i]))
      if (k <= 0) continue
      const e = curve(k), u = 1 - e
      const c = settle(Math.min(1, Math.max(0, (t - delay[i] - dur[i] * .55) / (dur[i] * .45 + .35))))
      const gx = tx[i] + ex[i] * (1 - c), gy = ty[i] + ey[i] * (1 - c)
      const x = u * u * sx[i] + 2 * u * e * mx[i] + e * e * gx
      const y = u * u * sy[i] + 2 * u * e * my[i] + e * e * gy
      let lx = px[i], ly = py[i]
      // Motion blur: a streak back toward the last position, capped so fast grains read as light, not lines.
      const sl = Math.hypot(x - lx, y - ly)
      if (sl > 20) { lx = x - (x - lx) * 20 / sl; ly = y - (y - ly) * 20 / sl }
      if (sl < .6) { lx = x - .6; ly = y }
      push(k < .8 ? mint : land[col[i]], lx, ly, x, y)
      px[i] = x; py[i] = y
    }
    // Bokeh pass: in front, additive, very soft.
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = FLIGHT
    for (const g of bokeh) {
      const k = Math.min(1, Math.max(0, (t - g.delay) / g.dur))
      if (k <= 0 || k >= 1) continue
      const e = curve(k)
      const x = ox0 + Math.cos(g.a) * g.dist * e + g.lift * Math.sin(e * Math.PI) * .3
      const y = oy0 + Math.sin(g.a) * g.dist * e * .55 + g.lift * Math.sin(e * Math.PI) * .2
      const alpha = Math.sin(k * Math.PI) * .09
      ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(x, y, g.r * 1.9, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = alpha * 1.6; ctx.beginPath(); ctx.arc(x, y, g.r, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
    strokeBuckets(ctx, buckets)
  }

  // CSS variables are written only when they change: each write restyles (and re-masks) the name.
  let lastVars = ''
  function setVars(holePx, mx, my) {
    const key = `${holePx}|${mx}|${my}`
    if (key === lastVars) return
    lastVars = key
    h1.style.setProperty('--hole', `${holePx}px`)
    h1.style.setProperty('--mx', `${mx}px`)
    h1.style.setProperty('--my', `${my}px`)
  }
  function setMask() {
    const r = h1.getBoundingClientRect(), hr = host.getBoundingClientRect()
    setVars((hole * holeR).toFixed(1), (cursor.x - (r.left - hr.left)).toFixed(1), (cursor.y - (r.top - hr.top)).toFixed(1))
  }

  // At rest only the name's neighbourhood is ever drawn, so the canvas shrinks to that box:
  // the compositor stops blending a full-screen transparent layer every frame.
  function fitToBox() {
    canvas.style.left = `${box.x}px`; canvas.style.top = `${box.y}px`
    canvas.style.width = `${box.w}px`; canvas.style.height = `${box.h}px`
    canvas.width = Math.ceil(box.w * dpr); canvas.height = Math.ceil(box.h * dpr)
  }
  function drawRest() {
    // Box-local coordinates: translate so the rest of the code keeps using hero coordinates.
    ctx.setTransform(dpr, 0, 0, dpr, -box.x * dpr, -box.y * dpr)
    ctx.clearRect(box.x, box.y, box.w, box.h)
    const near = cursor.inside && cursor.x > box.x && cursor.x < box.x + box.w && cursor.y > box.y && cursor.y < box.y + box.h
    hole += ((near ? 1 : 0) - hole) * (near ? .14 : .06)
    if (hole > .003 || energy > .05) {
      setMask()
      energy = 0
      const R = holeR * 1.15
      const tiers = colors.map((c, ci) => [bucket(`r${ci}a`, c, .35, 1.6, 'source-over'), bucket(`r${ci}b`, c, .7, 1.6, 'source-over'), bucket(`r${ci}c`, c, 1, 1.6, 'source-over')])
      for (let i = 0; i < N; i++) {
        const qx = tx[i] + dx[i], qy = ty[i] + dy[i]
        const ddx = qx - cursor.x, ddy = qy - cursor.y, d = Math.hypot(ddx, ddy) || 1
        if (d < R && hole > .05) {
          // Repulsion with a tangential swirl, so grains eddy around the pointer instead of just fleeing.
          const f = (1 - d / R) ** 2 * 2.1 * hole
          vx[i] += (ddx / d) * f - (ddy / d) * f * .4
          vy[i] += (ddy / d) * f + (ddx / d) * f * .4
        }
        vx[i] = (vx[i] - dx[i] * .055) * .86; vy[i] = (vy[i] - dy[i] * .055) * .86
        dx[i] += vx[i]; dy[i] += vy[i]
        const m = Math.abs(dx[i]) + Math.abs(dy[i])
        energy += m
        const dt0 = Math.hypot(tx[i] - cursor.x, ty[i] - cursor.y)
        const a = Math.max(hole * (1 - Math.min(1, Math.max(0, (dt0 - holeR * .35) / (holeR * .7)))), Math.min(1, m / 10))
        if (a > .03) push(tiers[col[i]][a < .45 ? 0 : a < .8 ? 1 : 2], qx - vx[i] * 1.5 - .5, qy - vy[i] * 1.5, qx + .5, qy)
      }
      energy /= Math.max(1, N)
      strokeBuckets(ctx, buckets)
    } else if (lastVars && !lastVars.startsWith('0|')) {
      setVars('0', '-999', '-999')
    }
    // Glints: a handful of grains briefly catch the light, so the name never looks printed.
    if (hole < .3 && N) {
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = '#fbf9f3'
      for (const g of glints) {
        g.life += .016 / .9
        if (g.life >= 1) { g.i = Math.floor(Math.random() * N); g.life = 0 }
        if (g.i < 0) continue
        const a = Math.sin(g.life * Math.PI) * .85 * (1 - hole)
        ctx.globalAlpha = a; ctx.fillRect(tx[g.i] - .9, ty[g.i] - .9, 1.8, 1.8)
        ctx.globalAlpha = a * .25; ctx.beginPath(); ctx.arc(tx[g.i], ty[g.i], 4, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
    }
  }

  function tick() {
    const t = clock.time()
    if (mode === 'flight') {
      if (!landed && t > total - .55) { landed = true; onLand?.() }
      if (t > total - .45) fade = Math.max(0, 1 - (t - (total - .45)) / .45)
      drawFlight(t)
      if (t >= total) {
        mode = 'rest'
        fitToBox()
        h1.classList.add('is-grains')
      }
    } else {
      drawRest()
    }
    frame = running ? requestAnimationFrame(tick) : 0
  }
  frame = requestAnimationFrame(tick)

  return {
    pointer(clientX, clientY) {
      const r = host.getBoundingClientRect()
      cursor.x = clientX - r.left; cursor.y = clientY - r.top; cursor.inside = true
    },
    leave() { cursor.inside = false },
    play() { if (running) return; running = true; frame = requestAnimationFrame(tick) },
    pause() { running = false; cancelAnimationFrame(frame); frame = 0 },
    // Layout changed (resize): re-target the resting field to the new glyph positions.
    rebuild(next) {
      build(next, false)
      if (mode === 'rest') fitToBox(); else size()
    },
    destroy() { running = false; clock.kill(); cancelAnimationFrame(frame); canvas.remove(); h1.classList.remove('is-grains'); h1.style.removeProperty('--hole') },
  }
}
