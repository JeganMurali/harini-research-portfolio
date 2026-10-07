// "Built like a cell": the profile assembles itself from actin.
// A growth simulation lays out a branched (70°, Arp2/3) network routed through the page's real content;
// the GPU draws it polymerising — every segment knows when it is born — with bead texture,
// treadmilling light, tip sparks, a breathing leading-edge membrane and a click-ripple signal.

// ---------- network generation ----------

function rng(seed) {
  let a = seed >>> 0
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export const KIND = { network: 0, bio: 1, chem: 2, stress: 3, membrane: 4, crosslink: 5, seed: 6, trail: 7, plaque: 8, edgeGlow: 9, filopodium: 10 }
const RAD = Math.PI / 180

// Sample a quadratic/cubic-ish curve through control points (Catmull-Rom).
function curve(pts, step = 10) {
  const out = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step))
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t
      out.push([
        .5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ])
    }
  }
  out.push(pts[pts.length - 1])
  return out
}

/**
 * anchors (section-relative CSS px): head, eyebrow, lead, bio, chem, school, now, next, stage, caps[]
 * Time units ("grow"): act 1 = 0→1 spine · act 2 = 1→2 identity · act 3 = 2→4 lamellipodium · act 4 = 4→5 leading edge.
 */
export function buildNetwork(A, { width, mobile }) {
  const R = rng(20260524)
  const segs = []
  const add = (a, b, t0, t1, w, kind, depth = 1, seed = R()) => segs.push([a[0], a[1], b[0], b[1], t0, t1, w, kind, depth, seed])
  const path = (pts, t0, t1, w, kind, depth = 1, seed) => {
    let L = 0; const acc = [0]
    for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(L) }
    const sd = seed ?? R()
    for (let i = 1; i < pts.length; i++) add(pts[i - 1], pts[i], t0 + (t1 - t0) * acc[i - 1] / L, t0 + (t1 - t0) * acc[i] / L, w, kind, depth, sd)
    return {
      L,
      at: (f) => { const tg = f * L; let i = 1; while (i < acc.length - 1 && acc[i] < tg) i++; const u = (tg - acc[i - 1]) / Math.max(1e-6, acc[i] - acc[i - 1]); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u] },
    }
  }
  const twig = (from, ang, L, t0, kind = KIND.network, w = .9, depth = .8) => {
    const mid = [from[0] + Math.cos(ang) * L * .5 + (R() - .5) * 4, from[1] + Math.sin(ang) * L * .5 + (R() - .5) * 4]
    path(curve([from, mid, [from[0] + Math.cos(ang) * L, from[1] + Math.sin(ang) * L]], 7), t0, t0 + .12 + L / 700, w, kind, depth)
  }

  // ---- Act 1 — the spine: monomers from the hero polymerise into one quiet filament down the left margin.
  const spineX = A.head.x - 40
  const top = A.head.y - 70
  // Her two disciplines split off the spine right where it reaches IISER (they are taught there).
  const branchY = A.iiser.y + A.iiser.h * .55 + 30
  const spinePts = curve([[spineX, top], [spineX + 3, (top + branchY) * .5], [spineX, branchY]], 9)
  path(spinePts, .04, .96, 1.4, KIND.seed, 1)
  // A single hairline reaches across to touch the chapter mark — nothing decorative beyond that.
  const eb = A.eyebrow
  path(curve([[spineX, eb.y + eb.h / 2], [spineX + 18, eb.y + eb.h / 2 - 2], [eb.x - 12, eb.y + eb.h / 2]], 7), .28, .48, 1, KIND.seed, 1)

  // ---- Act 2 — identity, told in order: the spine's first branch reaches her college (where she trains),
  // then it forks at 70° (Arp2/3) into her two disciplines, which travel on together as one braid.
  const ii = A.iiser, iiY = ii.y + ii.h * .55
  const iiL = [ii.x - 14, iiY]
  // Leaves the spine at ~20° and eases level into the emblem; the control points scale with the gap so a
  // narrow (phone) layout can't fold the curve back on itself.
  const gap = Math.max(12, iiL[0] - spineX)
  path(curve([[spineX, iiY - Math.min(34, gap * .5)], [spineX + gap * .35, iiY - Math.min(34, gap * .5) * .45], [spineX + gap * .75, iiY], iiL], 6), 1, 1.28, 1.2, KIND.seed, 1)
  // Below the branch, both disciplines travel on together — a braided, cross-linked pair — into her current focus.
  const nowL = [A.now.x - 16, A.now.y + A.now.h / 2]
  const braidLen = nowL[1] - branchY
  const strand = (phase) => {
    const pts = []
    for (let y = 0; y <= braidLen; y += 8) {
      const f = y / braidLen
      const turn = f > .86 ? (f - .86) / .14 : 0                         // ease into "Now" at the end
      // The pair opens from a single point (the 70° fork) within the first 24px, then braids on.
      const x = spineX + Math.sin(y / 15 + phase) * 9 * (1 - turn) * Math.min(1, y / 24) + (nowL[0] - spineX) * turn * turn
      pts.push([x, branchY + y])
    }
    return pts
  }
  const sa = strand(0), sb = strand(Math.PI)
  path(sa, 1.3, 2, 1.25, KIND.bio, 1); path(sb, 1.32, 2.02, 1.25, KIND.chem, 1)
  for (let y = 15 * Math.PI; y < braidLen * .85; y += 15 * Math.PI) { // cross-links where the strands cross
    const i = Math.round(y / 8)
    if (sa[i] && sb[i]) add(sa[i], sb[i], 1.3 + .7 * y / braidLen, 1.36 + .7 * y / braidLen, .7, KIND.crosslink, 1)
  }

  // ---- Act 3 — four cells, four skills. The braid arrives at "Now" and branches (70° forks) into four strands,
  // each growing to a small living cell — one per capability — which forms the moment its strand arrives.
  const st = A.stage
  const nowR = mobile ? [A.now.x + 20, A.now.y + A.now.h + 10] : [A.now.x + A.now.w + 18, A.now.y + A.now.h / 2]
  const specimens = A.caps.map((c) => ({ x: c.x + c.w / 2, y: c.y + c.h / 2, r: c.w / 2 }))
  const capTimes = []
  specimens.forEach((sp, i) => {
    const toward = Math.atan2(nowR[1] - sp.y, nowR[0] - sp.x)
    const rimPt = [sp.x + Math.cos(toward) * (sp.r + 6), sp.y + Math.sin(toward) * (sp.r + 6)]
    const dist = Math.hypot(rimPt[0] - nowR[0], rimPt[1] - nowR[1])
    const t0 = 2.05 + i * .32, t1 = t0 + .55 + dist / 2400
    capTimes.push(t1)
    sp.birth = t1 - .05
    // One smooth cubic arc: it leaves "Now" level (vertical on phones) and arrives square to the cell's rim.
    const c1 = mobile ? [nowR[0], nowR[1] + dist * .4] : [nowR[0] + dist * .42, nowR[1]]
    const c2 = [rimPt[0] + Math.cos(toward) * dist * .38, rimPt[1] + Math.sin(toward) * dist * .38]
    const pts = []
    for (let k = 0; k <= 40; k++) {
      const t = k / 40, u = 1 - t
      pts.push([u * u * u * nowR[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * rimPt[0], u * u * u * nowR[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * rimPt[1]])
    }
    const pth = path(pts, t0, t1, 1.7, KIND.stress, 1, i)
    path(pts.map(([x, y], k) => [x + Math.sin(k * .5) * 2.4, y + Math.cos(k * .5) * 2.4]), t0 + .03, t1 + .03, .8, KIND.stress, .7, i)
    // Sparse 70° side branches — actin character without the noise of a full mesh.
    for (let k = 0; k < 3; k++) {
      const f = .25 + k * .22, pa = pth.at(f - .01), pb = pth.at(f)
      const ang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) + (k % 2 ? 70 : -70) * RAD
      twig(pb, ang, 18 + R() * 22, t0 + (t1 - t0) * f, KIND.network, .8, .7)
    }
  })

  // ---- Act 4 — the leading edge: filopodia reach from the last cell toward "Next", then a trail leaves for the journey.
  const last = specimens.reduce((a, b) => (mobile ? (b.y > a.y ? b : a) : (b.x > a.x ? b : a)))
  const nx = mobile ? [A.next.x + 30, A.next.y - 8] : [A.next.x - 16, A.next.y + 18]
  const toNext = Math.atan2(nx[1] - last.y, nx[0] - last.x)
  for (let k = 0; k < 4; k++) {
    const ang = toNext + (k - 1.5) * .16
    const from = [last.x + Math.cos(ang) * (last.r + 4), last.y + Math.sin(ang) * (last.r + 4)]
    // On phones "Next" sits far below the readout: filopodia stay short spikes rather than crossing her text.
    const L = Math.min(Math.hypot(nx[0] - from[0], nx[1] - from[1]) * (k === 1 ? .92 : .45 + R() * .3), mobile ? 46 : 240)
    path(curve([from, [from[0] + Math.cos(ang) * L * .5, from[1] + Math.sin(ang) * L * .5 + (R() - .5) * 10], [from[0] + Math.cos(ang) * L, from[1] + Math.sin(ang) * L]], 6), 4.05 + k * .06, 4.6 + k * .06, k === 1 ? 1.4 : 1, KIND.filopodium, 1)
  }
  const bottom = [mobile ? width * .5 : st.x + st.w * .5, st.y + st.h + 70]
  const tailFrom = [nx[0] + 30, nx[1] + (mobile ? 90 : 120)]
  path(curve([tailFrom, [tailFrom[0] - 30, tailFrom[1] + 60], [bottom[0] + 60, bottom[1] - 60], bottom], 9), 4.6, 5, 1.1, KIND.trail, 1)

  // Monomers: the hero's grains fall in and feed the spine (act 1); later, monomers drift around the cells.
  const points = []
  for (let i = 0; i < (mobile ? 110 : 220); i++) {
    const s0 = [spineX + (R() - .2) * width * .45, top - 140 - R() * 440]
    const tgt = spinePts[Math.floor(R() * spinePts.length * .65)]
    points.push([s0[0], s0[1], tgt[0], tgt[1], R() * .55, 1.6 + R() * 2.2, 0, R()])
  }
  for (let i = 0; i < (mobile ? 70 : 150); i++) {
    const sp = specimens[i % specimens.length], a = R() * Math.PI * 2, r = sp.r * (1.25 + R() * 1.1)
    points.push([0, 0, sp.x + Math.cos(a) * r, sp.y + Math.sin(a) * r, 0, 1 + R() * 1.6, 1, R()])
  }
  return { segs, points, capTimes, specimens, marks: { now: nowR, next: nx } }
}

// ---------- rendering ----------

const SEG_VERT = `
attribute vec4 aSeg; attribute vec4 aInfo; attribute vec4 aVert;
uniform vec2 uView, uPointer, uMouse; uniform float uOffsetY, uGrow, uTime, uPointerAmt;
varying vec2 vUV, vP; varying float vLen, vW, vKind, vG, vDepth, vSeed;
void main(){
  vec2 a = aSeg.xy, b = aSeg.zw;
  float g = clamp((uGrow - aInfo.x) / max(aInfo.y - aInfo.x, 1e-4), 0., 1.);
  if (g <= 0.) { gl_Position = vec4(2., 2., 2., 1.); return; }
  vec2 d = b - a; float L = length(d); vec2 dir = L > 0. ? d / L : vec2(1., 0.); vec2 n = vec2(-dir.y, dir.x);
  float w = aInfo.z, pad = w * .5 + 7.;
  float ext = (aVert.y * 2. - 1.) * pad;
  float along = aVert.y * L * g;
  vec2 pos = a + dir * along;
  // The leading-edge membrane breathes.
  if (aInfo.w > 3.5 && aInfo.w < 4.5) pos += n * (sin(uTime * 1.3 + along * .03 + aVert.w * 40.) * 2.2 + sin(uTime * .6 + aVert.w * 12.) * 4.);
  // The network yields around the cursor (deeper filaments yield less).
  vec2 toP = pos + vec2(0., uOffsetY) - uPointer; float pd = length(toP);
  pos += (pd > .001 ? toP / pd : vec2(0.)) * 20. * uPointerAmt * exp(-pd * pd / 12100.) * (.45 + .55 * aVert.z);
  // Depth parallax: far filaments drift against the cursor.
  pos += uMouse * (1. - aVert.z) * 12.;
  vP = pos;
  pos += dir * ext + n * aVert.x * pad;
  vec2 screen = pos + vec2(0., uOffsetY);
  vec2 clip = screen / uView * 2. - 1.;
  gl_Position = vec4(clip.x, -clip.y, 0., 1.);
  vUV = vec2(along + ext, aVert.x * pad);
  vLen = L * g; vW = w; vKind = aInfo.w; vG = g; vDepth = aVert.z; vSeed = aVert.w;
}`

const SEG_FRAG = `
precision highp float;
varying vec2 vUV, vP; varying float vLen, vW, vKind, vG, vDepth, vSeed;
uniform float uTime, uActive, uHover, uRippleT, uGlowBoost;
uniform vec2 uRipple;
const vec3 MINT = vec3(.498, .827, .757), MINT2 = vec3(.624, .847, .780), CYAN = vec3(.384, .788, .816), CORAL = vec3(.937, .553, .447), WHITE = vec3(.984, .976, .953);
void main(){
  float dx = max(0., -vUV.x) + max(0., vUV.x - vLen);
  float dist = length(vec2(dx, vUV.y));
  float hw = vW * .5;
  float core = 1. - smoothstep(hw - .3, hw + .7, dist);
  float glow = exp(-dist * dist / (2. * (hw * 2.4 + 1.8) * (hw * 2.4 + 1.8))) * .3;
  float taper = smoothstep(0., 16., vUV.x) * .75 + .25;
  // Actin's bead-on-a-string texture, visible on the thicker filaments.
  float beads = mix(1., .78 + .22 * cos(vUV.x * 6.2832 / 5.5), smoothstep(1.4, 2.2, vW));
  // Treadmilling: light flows toward the growing (barbed) ends.
  float flow = .7 + .3 * sin((vUV.x - uTime * 18.) * .055 + vSeed * 6.2832);
  // A bright spark rides the tip while the filament is still polymerising.
  float tip = (1. - step(.999, vG)) * exp(-pow(vUV.x - vLen, 2.) / 14.) * exp(-vUV.y * vUV.y / 4.);

  vec3 col = MINT2 * .46; float gain = 1.;
  if (vKind > .5 && vKind < 1.5) col = MINT;
  else if (vKind > 1.5 && vKind < 2.5) col = CORAL;
  else if (vKind > 2.5 && vKind < 3.5) { // stress fibres: the active capability contracts and glows
    float on = 1. - step(.5, abs(vSeed - uActive)), hov = 1. - step(.5, abs(vSeed - uHover));
    col = mix(CYAN * .3, MINT2 * 1.2, max(on, hov * .7)); gain = 1. + on * (.35 + .35 * sin(uTime * 4.));
  }
  else if (vKind > 3.5 && vKind < 4.5) { col = MINT * 1.1; flow = .85 + .15 * sin(uTime * 2. + vSeed * 30.); }
  else if (vKind > 4.5 && vKind < 5.5) col = MINT2 * .55;
  else if (vKind > 5.5 && vKind < 6.5) col = MINT2 * 1.05;
  else if (vKind > 6.5 && vKind < 7.5) { col = MINT2 * .6; core *= step(.45, fract(vUV.x / 10.)); }
  else if (vKind > 7.5 && vKind < 8.5) { float on = 1. - step(.5, abs(vSeed - uActive)); col = mix(MINT2 * .55, CORAL, on * .8); }
  else if (vKind > 8.5 && vKind < 9.5) { col = MINT * .16; core = 0.; glow = exp(-dist * dist / 70.) * (.8 + .2 * sin(uTime * 1.6 + vSeed * 20.)); }
  else if (vKind > 9.5) { col = MINT * 1.15; }

  float depth = mix(.32, 1., vDepth);
  // Signal ripple: a wavefront travels out through the network from a clicked adhesion.
  float age = uTime - uRippleT;
  float wave = age > 0. && age < 3. ? exp(-pow(length(vP - uRipple) - age * 420., 2.) / 3200.) * exp(-age * 1.1) : 0.;
  float a = (core * beads + glow * uGlowBoost) * taper * flow * depth * gain;
  vec3 c = col * a + col * wave * (core + glow) * 1.6 + mix(col, WHITE, .6) * tip * .55;
  gl_FragColor = vec4(c, 1.);
}`

const PT_VERT = `
attribute vec4 aP; attribute vec4 aQ;
uniform vec2 uView, uMouse; uniform float uOffsetY, uMono, uWorld, uTime, uDpr;
varying float vA, vKind;
void main(){
  vec2 pos; float a;
  if (aQ.z < .5) { // arriving monomers: an arc from above into the seed, then they are absorbed
    float k = clamp((uMono - aQ.x) / 1., 0., 1.);
    float e = 1. - pow(1. - k, 3.);
    vec2 mid = mix(aP.xy, aP.zw, .5) + vec2(60. * (aQ.w - .5), -40.);
    pos = mix(mix(aP.xy, mid, e), mix(mid, aP.zw, e), e);
    a = k > 0. ? (1. - smoothstep(.82, 1., k)) * .85 : 0.;
  } else { // ambient monomers diffusing through the lamellipodium
    float t = uTime * (.12 + aQ.w * .1) + aQ.w * 50.;
    pos = aP.zw + vec2(sin(t * 1.3) * 16. + sin(t * .7 + 2.) * 9., cos(t * 1.1) * 13. + sin(t * .5) * 7.);
    a = uWorld * (.25 + .35 * sin(t * 2.3 + aQ.w * 9.) * sin(t * 2.3 + aQ.w * 9.));
  }
  pos += uMouse * 6.;
  vec2 clip = (pos + vec2(0., uOffsetY)) / uView * 2. - 1.;
  gl_Position = vec4(clip.x, -clip.y, 0., 1.);
  gl_PointSize = aQ.y * uDpr * 2.2;
  vA = a; vKind = aQ.z;
}`

const PT_FRAG = `
precision highp float;
varying float vA, vKind;
void main(){
  float d = length(gl_PointCoord - .5) * 2.;
  float m = (1. - smoothstep(.35, 1., d));
  gl_FragColor = vec4(vec3(.624, .847, .780) * m * vA, 1.);
}`

// Background: the hero's world continued — same gradient and out-of-focus neighbouring cells — plus the four
// specimen cells, drawn in the hero cell's schematic style, each telling one capability through what it does.
// Two passes from one source: SOFT renders the smooth, defocused layers (gradient, far cells, core glow) at half
// resolution; MAIN samples them and draws the four specimen cells, vignette and dither at full resolution.
const BG_FRAG = (deriv, pass) => `${deriv ? '#extension GL_OES_standard_derivatives : enable\n' : ''}#define ${pass}
precision highp float;
uniform sampler2D uBg;
uniform vec2 uView, uCore, uMouse; uniform float uOffsetY, uTime, uDpr, uWorld;
uniform vec4 uSpecA[4], uSpecB[4];
const vec3 TEAL = vec3(.027, .145, .157), DEEP = vec3(.008, .051, .059), MINT = vec3(.498, .827, .757), MINT2 = vec3(.624, .847, .780), CYAN = vec3(.384, .788, .816), CORAL = vec3(.937, .553, .447);
const vec3 CYTO_A = vec3(.059, .227, .231), CYTO_B = vec3(.024, .122, .133);
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 hash2(vec2 p){ float n = hash(p); return vec2(n, hash(p + n + 17.17)); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return v; }
${deriv ? 'float fw(float x){ return fwidth(x); }' : 'float fw(float x){ return .05; }'}
float contour(float f, float n){ float x = f * n, w = fw(x); return (1. - smoothstep(0., w * 1.5, abs(fract(x) - .5))) * (1. - smoothstep(.18, .4, w)); }
float capsule(vec2 p, vec2 dir, float L, float r){ return length(p - dir * clamp(dot(p, dir), -L, L)) - r; }
vec3 farLayer(vec2 p){
  float S = 300.; vec2 g = p / S; vec2 id0 = floor(g - .5); vec3 acc = vec3(0.);
  for (int j = 0; j <= 1; j++) for (int i = 0; i <= 1; i++){
    vec2 id = id0 + vec2(float(i), float(j));
    if (hash(id + 7.7) < .42) continue;
    vec2 h = hash2(id);
    vec2 c = (id + .5 + (h - .5) * .55) * S + 20. * vec2(sin(uTime * .06 + h.x * 6.283), cos(uTime * .05 + h.y * 6.283));
    float r = S * (.16 + .17 * hash(id + 3.1)), d = length(p - c);
    float e1 = (d - r) / (r * .2), e2 = d / (r * .38);
    vec3 ring = hash(id + 11.3) > .85 ? CORAL : MINT;
    acc += (ring * exp(-e1 * e1) * .1 + CYAN * exp(-e2 * e2) * .1 + MINT * (1. - smoothstep(r * .3, r * 1.05, d)) * .025) * (.6 + .5 * h.y);
  }
  return acc;
}

// One specimen. A = (x, y, r, born) in canvas px; B = (active, hover, phase seconds, type).
vec3 specimen(vec3 col, vec2 p, vec4 A, vec4 B){
  float born = A.w; if (born <= .001) return col;
  float act = B.x, hov = B.y, ph = B.z, type = B.w;
  float R0 = A.z * .9 * (.35 + .65 * born) * (1. + .1 * act + .04 * hov);
  vec2 q = p - A.xy; float d = length(q);
  if (d > R0 * 1.9) return col;
  vec2 dir = q / max(d, 1e-4);
  float wob = ((noise(dir * 1.6 + uTime * .22 + type * 3.1) - .5) * .07 + (noise(dir * 3.2 - uTime * .17 + type) - .5) * .024);
  if (type > 1.5 && type < 2.5) wob *= .2;                    // a culture disc stays round
  float R = R0 * (1. + wob), sd = d - R, aa = 1.2;
  float inside = 1. - smoothstep(-aa, aa, sd);
  float rim = inside * smoothstep(-2.8 - aa, -2.8 + aa, sd);
  float halo = exp(-max(sd, 0.) / (R0 * .09 + 4.)) * (1. - inside);
  vec2 uv = q / R0; float rr = d / R;
  float lead = max(act, hov * .6);
  float vis = mix(.42, 1., lead);                              // staging: the selected cell leads, the rest dim back
  vec3 cyto = mix(CYTO_A, CYTO_B, clamp(length(uv - vec2(-.15, -.22)) / .92, 0., 1.));
  cyto *= mix(1., .72, smoothstep(.55, 1., rr));
  vec3 add = vec3(0.);
  if (inside > 0.) {
    vec2 w = uv * 2.4 + type * 7.3;
    w += .35 * vec2(fbm(w + uTime * .04), fbm(w + 5.2 - uTime * .035));
    float fib = contour(fbm(w * 1.3), 10.) * smoothstep(.3, .62, fbm(w * .8 + 3.));
    if (type < .5) {
      // Cell biology & imaging — a confocal optical section sweeps through; a FRAP spot bleaches and recovers.
      float by = fract(ph * .16) * 2.6 - 1.3;
      float band = exp(-pow((uv.y - by) / .22, 2.)) * act;
      float scan = (1. - smoothstep(0., .012, abs(uv.y - by))) * act;
      float cyc = fract(ph * .13), bleach = cyc < .05 ? cyc / .05 : exp(-(cyc - .05) * 6.);
      float spot = 1. - smoothstep(.13, .16, length(uv - vec2(.3, -.2)));
      float frap = 1. - .9 * spot * bleach * act;
      add += MINT2 * fib * (.32 + .55 * band) * frap;
      add += MINT * smoothstep(.74, .96, rr) * (.14 + .2 * band) + MINT * scan * .35;
      add += MINT * (1. - smoothstep(.15, .17, length(uv - vec2(.3, -.2)))) * smoothstep(.13, .15, length(uv - vec2(.3, -.2))) * act * .8;
      float nd = length(uv - vec2(-.14, .1));
      add += CYAN * ((1. - smoothstep(.27, .29, nd)) * .14 + (1. - smoothstep(0., .02, abs(nd - .28))) * .5);
    } else if (type < 1.5) {
      // Molecular experimentation — a plasmid drifts into the nucleus; coral expression then blooms outward.
      float cyc = fract(ph * .11);
      float nd = length(uv);
      float into = smoothstep(.04, .42, cyc);
      vec2 pp = mix(vec2(.72, -.5), vec2(.0, -.02), into * into);
      float pr = mix(.11, .05, smoothstep(.3, .45, cyc));
      float pd = length(uv - pp);
      float gap = smoothstep(.0, .5, abs(atan(uv.y - pp.y, uv.x - pp.x) - 1.2 - ph * 1.5 + 0.));
      float plasmid = (1. - smoothstep(0., .022, abs(pd - pr))) * (1. - smoothstep(.42, .48, cyc));
      float insert = plasmid * (1. - smoothstep(.5, .9, mod(atan(uv.y - pp.y, uv.x - pp.x) + ph * 1.4, 6.2832)));
      float expr = smoothstep(.46, .7, cyc) * (1. - smoothstep(.88, 1., cyc)) * act;
      float bloom = (1. - smoothstep(.3, .3 + .62 * expr, nd)) * expr;
      add += MINT2 * fib * .3 * (1. - expr * .5);
      add += CORAL * bloom * .32 + CORAL * (1. - smoothstep(.29, .31, nd)) * expr * .35;
      add += mix(MINT2, CORAL, insert) * plasmid * (.6 + .4 * act) * step(.5, act + hov);
      add += CYAN * ((1. - smoothstep(.3, .32, nd)) * .12 + (1. - smoothstep(0., .02, abs(nd - .31))) * .55);
      add += MINT * smoothstep(.74, .96, rr) * .12;
    } else if (type < 2.5) {
      // Microbiology & chemistry — a culture of coral rods; a disc in the middle clears a widening inhibition zone.
      cyto = mix(vec3(.05, .13, .13), vec3(.02, .075, .08), rr);
      float zone = .66 * smoothstep(.0, .55, fract(ph * .13)) * act;
      vec2 g = uv * 5.5; vec2 id = floor(g), f = fract(g) - .5;
      vec2 h = hash2(id);
      float a = h.x * 6.2832 + sin(uTime * (.6 + h.y) + h.x * 9.) * .35;
      vec2 o = (h - .5) * .45 + vec2(sin(uTime * .9 + h.y * 7.), cos(uTime * .8 + h.x * 7.)) * .04;
      float rod = 1. - smoothstep(-.02, .02, capsule(f - o, vec2(cos(a), sin(a)), .16, .07));
      float cleared = smoothstep(zone - .04, zone + .04, length(uv));
      add += CORAL * rod * .75 * cleared * step(.3, hash(id + 2.));
      add += MINT * exp(-pow((length(uv) - zone) / .03, 2.)) * act * .35;            // the clearing's edge
      add += vec3(.95) * (1. - smoothstep(.1, .115, length(uv))) * .5 + MINT * exp(-pow(length(uv) / .2, 2.)) * .15 * act;
    } else {
      // Computational reasoning — the cell as a point cloud; a conservation wave sweeps mint → coral.
      vec2 g = uv * 13.; vec2 id = floor(g), f = fract(g) - .5;
      vec2 jo = (hash2(id) - .5) * .5;
      float keep = smoothstep(.42, .62, fbm(id * .21 + 4.));
      float wave = .5 + .5 * sin(uv.x * 3.5 + uv.y * 1.5 - ph * 1.6);
      float crest = smoothstep(.6, .95, wave) * (.3 + .7 * act);
      float dotm = (1. - smoothstep(.07 + .05 * crest, .13 + .06 * crest, length(f - jo))) * keep;
      vec3 dc = mix(MINT2, CORAL * 1.15, crest);
      add += dc * dotm * .95 + MINT2 * fib * .14;
      add += MINT * smoothstep(.74, .96, rr) * .1;
    }
  }
  col = mix(col, cyto, inside * born);
  col += add * inside * vis * born;
  col = mix(col, MINT, rim * born * mix(.55, 1., lead));
  col += MINT * halo * .22 * born * (1. + lead * 1.4);
  return col;
}

#ifdef SOFT
void main(){
  vec2 p = vec2(gl_FragCoord.x, uView.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 sp = p - vec2(0., uOffsetY);
  vec2 core = uCore + vec2(0., uOffsetY);
  vec3 col = mix(TEAL * .85, DEEP, clamp(length(p - core) / (max(uView.x, uView.y) * .75), 0., 1.));
  col += farLayer(sp * .9 + uMouse * 7. + vec2(0., uOffsetY * .18)) * .85;
  col += CYAN * .05 * exp(-pow(length(p - core) / 380., 2.)) * uWorld;
  gl_FragColor = vec4(col, 1.);
}
#else
void main(){
  vec2 p = vec2(gl_FragCoord.x, uView.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 sp = p - vec2(0., uOffsetY);
  vec3 col = texture2D(uBg, gl_FragCoord.xy / (uView * uDpr)).rgb;
  for (int i = 0; i < 4; i++) col = specimen(col, sp, uSpecA[i], uSpecB[i]);
  vec2 v = p / uView - .5;
  col *= 1. - .3 * smoothstep(.4, .9, length(v * vec2(1., .9)));
  col += (hash(p + fract(uTime * 7.)) + hash(p.yx + 3.1 + fract(uTime * 3.)) - 1.) * 1.5 / 255.;
  gl_FragColor = vec4(col, 1.);
}
#endif
`
const BG_VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0., 1.); }`

function compile(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'compile failed')
  return s
}
function program(gl, vs, fs, attribs) {
  const p = gl.createProgram()
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs))
  attribs.forEach((name, i) => gl.bindAttribLocation(p, i, name))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link failed')
  const u = new Proxy({}, { get: (cache, name) => (name in cache ? cache[name] : (cache[name] = gl.getUniformLocation(p, name))) })
  return { p, u }
}

export function createActin(canvas, { still = false } = {}) {
  // No MSAA: every line, grain and cell edge is anti-aliased in its shader, so 4× samples only cost bandwidth.
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' })
  if (!gl) return null
  const deriv = !!gl.getExtension('OES_standard_derivatives')
  const soft = program(gl, BG_VERT, BG_FRAG(deriv, 'SOFT'), ['aPos'])
  const bg = program(gl, BG_VERT, BG_FRAG(deriv, 'MAIN'), ['aPos'])
  // Half-resolution target for the soft layers; half-float where supported so dark gradients can't band.
  const half = gl.getExtension('OES_texture_half_float'), halfLinear = gl.getExtension('OES_texture_half_float_linear'), halfTarget = gl.getExtension('EXT_color_buffer_half_float')
  const texType = half && halfLinear && halfTarget ? half.HALF_FLOAT_OES : gl.UNSIGNED_BYTE
  const softTex = gl.createTexture(), fbo = gl.createFramebuffer()
  let softW = 1, softH = 1
  function sizeTarget() {
    softW = Math.max(1, Math.ceil(canvas.width / 2)); softH = Math.max(1, Math.ceil(canvas.height / 2))
    gl.bindTexture(gl.TEXTURE_2D, softTex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, softW, softH, 0, gl.RGBA, texType, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, softTex, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }
  const seg = program(gl, SEG_VERT, SEG_FRAG, ['aSeg', 'aInfo', 'aVert'])
  const pts = program(gl, PT_VERT, PT_FRAG, ['aP', 'aQ'])
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const segBuf = gl.createBuffer(), ptBuf = gl.createBuffer()
  let segCount = 0, ptCount = 0

  const state = {
    grow: still ? 5 : 0, mono: still ? 3 : 0, world: still ? 1 : 0, active: 0, hover: -1, glow: 1,
    pointer: { x: -9999, y: -9999 }, pointerAmt: 0, mouse: { x: 0, y: 0 }, ripple: { x: 0, y: 0, t: -99 }, core: { x: 0, y: 0 },
    // Four specimen cells: position/size in section px, birth on the growth clock, and per-cell tweenables.
    specimens: [0, 1, 2, 3].map(() => ({ x: 0, y: 0, r: 0, birth: 99, act: 0, hover: 0, since: 0 })),
  }
  const specA = new Float32Array(16), specB = new Float32Array(16)
  const target = { x: 0, y: 0 }
  let dpr = 1, frame = 0, running = false, last = 0, offsetY = 0
  const start = performance.now()
  let measure = () => 0

  function setNetwork({ segs, points, marks, specimens }) {
    specimens?.forEach((sp, i) => Object.assign(state.specimens[i], { x: sp.x, y: sp.y, r: sp.r, birth: sp.birth }))
    // 6 vertices per segment, 12 floats each: aSeg(4) aInfo(4) aVert(4).
    const V = [[-1, 0], [1, 0], [-1, 1], [-1, 1], [1, 0], [1, 1]]
    const data = new Float32Array(segs.length * 6 * 12)
    let o = 0
    for (const s of segs) for (const [side, end] of V) { data.set([s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], side, end, s[8], s[9]], o); o += 12 }
    gl.bindBuffer(gl.ARRAY_BUFFER, segBuf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    segCount = segs.length * 6
    const pd = new Float32Array(points.length * 8)
    points.forEach((p, i) => pd.set(p, i * 8))
    gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf); gl.bufferData(gl.ARRAY_BUFFER, pd, gl.STATIC_DRAW)
    ptCount = points.length
    state.core.x = marks.now[0]; state.core.y = marks.now[1]
    if (still) render(performance.now())
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2)
    const r = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr))
    sizeTarget()
    if (still) render(performance.now())
  }

  function render(now) {
    // fixedTime: test hook — freezes motion so two renders can be compared pixel for pixel.
    const t = state.fixedTime ?? (now - start) / 1000
    state.mouse.x += (target.x - state.mouse.x) * .07; state.mouse.y += (target.y - state.mouse.y) * .07
    offsetY = measure()
    const W = canvas.width / dpr, H = canvas.height / dpr
    gl.disable(gl.BLEND)
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    for (let i = 0; i < 3; i++) gl.disableVertexAttribArray(i)
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const common = (u, pdpr) => {
      gl.uniform2f(u.uView, W, H); gl.uniform2f(u.uCore, state.core.x, state.core.y); gl.uniform2f(u.uMouse, state.mouse.x, state.mouse.y)
      gl.uniform1f(u.uOffsetY, offsetY); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uDpr, pdpr); gl.uniform1f(u.uWorld, state.world)
    }
    // Pass 1 — soft layers into the half-resolution target (texture unbound first: no feedback loop).
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.viewport(0, 0, softW, softH)
    gl.useProgram(soft.p); common(soft.u, dpr * softW / canvas.width)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    // Pass 2 — full resolution: soft layers upsampled, specimen cells on top.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.useProgram(bg.p); common(bg.u, dpr)
    gl.bindTexture(gl.TEXTURE_2D, softTex); gl.uniform1i(bg.u.uBg, 0)
    state.specimens.forEach((sp, i) => {
      // A cell forms (ease-out) the moment its strand arrives.
      const k = Math.min(1, Math.max(0, (state.grow - sp.birth) / .45)), born = 1 - (1 - k) ** 3
      specA.set([sp.x, sp.y, sp.r, born], i * 4)   // section coordinates, like the shader's `sp`
      specB.set([sp.act, sp.hover, t - sp.since, i], i * 4)
    })
    gl.uniform4fv(bg.u['uSpecA[0]'], specA); gl.uniform4fv(bg.u['uSpecB[0]'], specB)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE)
    if (segCount) {
      gl.useProgram(seg.p)
      gl.bindBuffer(gl.ARRAY_BUFFER, segBuf)
      for (let i = 0; i < 3; i++) { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, 4, gl.FLOAT, false, 48, i * 16) }
      const u = seg.u
      gl.uniform2f(u.uView, W, H); gl.uniform2f(u.uPointer, state.pointer.x, state.pointer.y); gl.uniform2f(u.uMouse, state.mouse.x, state.mouse.y)
      gl.uniform1f(u.uOffsetY, offsetY); gl.uniform1f(u.uGrow, state.grow); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uPointerAmt, state.pointerAmt)
      gl.uniform1f(u.uActive, state.active); gl.uniform1f(u.uHover, state.hover); gl.uniform1f(u.uRippleT, state.ripple.t); gl.uniform2f(u.uRipple, state.ripple.x, state.ripple.y)
      gl.uniform1f(u.uGlowBoost, state.glow)
      gl.drawArrays(gl.TRIANGLES, 0, segCount)
    }
    if (ptCount) {
      gl.useProgram(pts.p)
      gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf)
      gl.disableVertexAttribArray(2)
      for (let i = 0; i < 2; i++) { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, 4, gl.FLOAT, false, 32, i * 16) }
      const u = pts.u
      gl.uniform2f(u.uView, W, H); gl.uniform2f(u.uMouse, state.mouse.x, state.mouse.y)
      gl.uniform1f(u.uOffsetY, offsetY); gl.uniform1f(u.uMono, state.mono); gl.uniform1f(u.uWorld, state.world); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uDpr, dpr)
      gl.drawArrays(gl.POINTS, 0, ptCount)
    }
  }

  // The canvas is sticky while its content moves with the scroll, so it must redraw every display frame while
  // the page moves (120 Hz panels included) or the cells visibly trail the text. At rest, 60 fps is plenty.
  let lastMotion = 0
  const onScroll = () => { lastMotion = performance.now() }
  addEventListener('scroll', onScroll, { passive: true })
  function loop(now) {
    const moving = now - lastMotion < 400 || state.grow < 5
    if (moving || now - last >= 1000 / 60 - 2) { render(now); last = now }
    frame = running ? requestAnimationFrame(loop) : 0
  }

  const ro = new ResizeObserver(resize); ro.observe(canvas); resize()
  return {
    state, setNetwork,
    setMeasure(fn) { measure = fn },
    pointer(nx, ny) { target.x = nx; target.y = ny; lastMotion = performance.now() },
    time() { return (performance.now() - start) / 1000 },
    redraw() { render(performance.now()) },
    play() { if (still || running) return; running = true; frame = requestAnimationFrame(loop) },
    pause() { running = false; cancelAnimationFrame(frame); frame = 0 },
    destroy() { running = false; ro.disconnect(); removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) },
  }
}
