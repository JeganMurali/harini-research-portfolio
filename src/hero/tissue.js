// "Living tissue": the hero world, drawn procedurally so the intro and the hero are one scene.
// At hand-off it reproduces the intro's final frame exactly (same cells, rim, cytoplasm, nuclei,
// glow and backdrop gradient), then the world rises around the hero cell in depth order.

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`

// One source, two programs: BG renders the soft, defocused layers at half resolution into a texture;
// MAIN samples that texture at full resolution and draws everything crisp (cells, trail, grains) on top.
const FRAG = (deriv, pass) => `${deriv ? '#extension GL_OES_standard_derivatives : enable\n' : ''}#define ${pass}
precision highp float;
uniform sampler2D uBg;
uniform vec2 uRes, uMouse, uBase;
uniform float uDpr, uTime, uWorld, uDetail, uDetailA, uScroll, uRim, uGlowAmt, uBaseR, uBlurA, uPull, uDiv;
uniform vec4 uCellA, uCellB;
uniform vec3 uGlow;
uniform vec2 uPointer, uDivAxis;
uniform vec3 uTrail[24];
uniform vec4 uTrailBox;

const vec3 TEAL = vec3(.027, .145, .157);
const vec3 DEEP = vec3(.008, .051, .059);
const vec3 MINT = vec3(.498, .827, .757);
const vec3 MINT2 = vec3(.624, .847, .780);
const vec3 CYAN = vec3(.384, .788, .816);
const vec3 CORAL = vec3(.937, .553, .447);
const vec3 CYTO_A = vec3(.059, .227, .231);
const vec3 CYTO_B = vec3(.024, .122, .133);

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 hash2(vec2 p){ float n = hash(p); return vec2(n, hash(p + n + 17.17)); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}
// Simplex noise (Ashima / McEwan): isotropic, so fibres and tubules have no grid-aligned corners.
vec3 permute(vec3 x){ return mod(((x * 34.) + 1.) * x, 289.); }
float snoise(vec2 v){
  const vec4 C = vec4(.211324865405187, .366025403784439, -.577350269189626, .024390243902439);
  vec2 i = floor(v + dot(v, C.yy)), x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1., 0.) : vec2(0., 1.);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
  i = mod(i, 289.);
  vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
  vec3 m = max(.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
  m = m * m; m = m * m;
  vec3 x = 2. * fract(p * C.www) - 1., h = abs(x) - .5, ox = floor(x + .5), a0 = x - ox;
  m *= 1.79284291400159 - .85373472095314 * (a0 * a0 + h * h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130. * dot(m, g);
}
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return v; }
${deriv ? 'float fw(float x){ return fwidth(x); }' : 'float fw(float x){ return .05; }'}

// Thin anti-aliased lines along the iso-contours of a field: reads as fibres. Fades out where too dense.
float contour(float f, float n){
  float x = f * n, w = fw(x);
  return (1. - smoothstep(0., w * 1.5, abs(fract(x) - .5))) * (1. - smoothstep(.18, .4, w));
}

// Long thin fibres: ridges of noise in a domain stretched along a (locally bending) direction.
// Two widths give a sharp core plus a faint bloom, like fluorescence.
float fibres(vec2 p, float angle, float along, float across, float seed){
  float bend = angle + (fbm(p * .004 + seed) - .5) * 1.6;
  vec2 d = vec2(cos(bend), sin(bend)), n = vec2(-d.y, d.x);
  float r = 1. - abs(snoise(vec2(dot(p, d) * along, dot(p, n) * across) + seed * 7.1));
  return pow(r, 34.) + pow(r, 8.) * .1;
}

// Far: out-of-focus neighbouring cells — the same fluorescence look, blurred by depth of field.
vec3 farLayer(vec2 p){
  // Only the 2x2 nearest slots can reach this pixel (radius < half a slot), not all 3x3.
  float S = 300.; vec2 g = p / S; vec2 id0 = floor(g - .5); vec3 acc = vec3(0.);
  for (int j = 0; j <= 1; j++) for (int i = 0; i <= 1; i++){
    vec2 id = id0 + vec2(float(i), float(j));
    if (hash(id + 7.7) < .42) continue;
    vec2 h = hash2(id);
    vec2 c = (id + .5 + (h - .5) * .55) * S + 20. * vec2(sin(uTime * .06 + h.x * 6.283), cos(uTime * .05 + h.y * 6.283));
    float r = S * (.16 + .17 * hash(id + 3.1)), d = length(p - c);
    float e1 = (d - r) / (r * .2), e2 = d / (r * .38);
    float cortex = exp(-e1 * e1), nucleus = exp(-e2 * e2);
    float body = 1. - smoothstep(r * .3, r * 1.05, d);
    vec3 ring = hash(id + 11.3) > .85 ? CORAL : MINT;
    acc += (ring * cortex * .1 + CYAN * nucleus * .1 + MINT * body * .025) * (.6 + .5 * h.y);
  }
  return acc;
}

// Mid: faint extracellular-matrix fibres drifting between cells.
vec3 midLayer(vec2 p){
  float m = smoothstep(.5, .8, fbm(p * .0014 + 9. + uTime * .004));
  vec2 d = vec2(cos(.5), sin(.5)), n = vec2(-d.y, d.x);
  // Soft, wide strands (out of focus), never crisp contour lines.
  float v = noise(vec2(dot(p, d) * .0025, dot(p, n) * .022) + uTime * .01);
  return MINT2 * pow(1. - abs(v - .5) * 2., 7.) * m * .07;
}

// Near: fine sharp grains rising, plus rare large defocused grains in front.
vec3 nearLayer(vec2 p){
  vec3 acc = vec3(0.);
  vec2 pp = p + vec2(0., uTime * 9.);
  float S = 92.; vec2 id = floor(pp / S); vec2 h = hash2(id);
  if (hash(id + 2.) < .4){
    vec2 c = (id + .2 + .6 * h) * S; c.x += 6. * sin(uTime * .3 + h.y * 6.);
    float r = .6 + 1.3 * hash(id + 5.), d = length(pp - c);
    acc += MINT2 * smoothstep(r + .9, r - .3, d) * (.28 + .4 * hash(id + 8.)) * (.65 + .35 * sin(uTime * .8 + h.x * 20.));
  }
  vec2 pb = p + vec2(0., uTime * 15.);
  float S2 = 430.; id = floor(pb / S2); h = hash2(id + 31.);
  if (hash(id + 40.) < .34){
    vec2 c = (id + .2 + .6 * h) * S2;
    float r = 10. + 20. * hash(id + 41.), d = length(pb - c);
    acc += mix(MINT2, CORAL, step(.8, h.x)) * (1. - smoothstep(r * .25, r, d)) * .055;
  }
  return acc;
}

// Membrane wobble from a direction vector (not an angle — atan's ±π seam would notch the membrane).
float wobAt(vec2 v, float detail){
  vec2 c = v / max(length(v), 1e-4);
  return ((noise(c * 1.6 + uTime * .22) - .5) * .07 + (noise(c * 3.2 - uTime * .17) - .5) * .024) * detail;
}
float smin(float a, float b, float k){ float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }

// One cell. detail 0 is exactly the intro's cell; detail 1 is the living hero cell (the schematic style).
// hero = 1 adds chemotaxis (a protrusion toward the cursor) and division (two lobes pinching apart).
vec3 cell(vec3 col, vec2 p, vec4 C, float detail, float blur, float interior, float hero){
  if (C.w <= .001) return col;
  vec2 q0 = p - C.xy;
  // Early out: beyond ~1.7R even the halo is < 1/255. (Division spreads the lobes up to 1.6R.)
  if (length(q0) > C.z * (1.7 + .9 * hero * uDiv)) return col;

  // Division: the two daughters separate along uDivAxis; a smooth-min pinches the furrow.
  float dv = hero * uDiv;
  float off = C.z * .85 * dv;
  float Rb = C.z * mix(1., .74, dv);
  float side = dot(q0, uDivAxis) >= 0. ? 1. : -1.;
  vec2 q = q0 - uDivAxis * off * side;
  float d = length(q);
  float ang = atan(q.y, q.x); vec2 cs = vec2(cos(ang), sin(ang));

  // Chemotaxis: the leading edge bulges and ruffles toward the signal, the rear retracts.
  vec2 toP = uPointer - C.xy; float pd = length(toP);
  vec2 dir = pd > 1. ? toP / pd : vec2(-1., 0.);
  float amt = hero * (1. - dv) * uPull * mix(.07, .17, 1. - smoothstep(C.z * 1.1, C.z * 5., pd)) * smoothstep(C.z * .5, C.z * 1.05, pd);
  float cf = dot(cs, dir);
  float lobe = pow(max(cf, 0.), 5.), rear = pow(max(-cf, 0.), 3.);

  float wob = wobAt(q, detail);
  float ruffle = lobe * amt * (noise(cs * 3.6 + vec2(uTime * .9, 0.)) - .5) * .5;
  float R = Rb * (1. + wob + amt * lobe + ruffle - amt * .25 * rear);
  float sd = d - R;
  if (dv > 0.){
    // Each daughter carries its own wobble, so the furrow stays continuous where the halves meet.
    vec2 q1 = q0 - uDivAxis * off, q2 = q0 + uDivAxis * off;
    float sd1 = length(q1) - Rb * (1. + wobAt(q1, detail));
    float sd2 = length(q2) - Rb * (1. + wobAt(q2, detail));
    sd = smin(sd1, sd2, C.z * 1.3 * dv * (1. - dv) + .001);
  }

  float aa = 1.1 + blur * C.z * .3;
  float inside = 1. - smoothstep(-aa, aa, sd);
  float th = uRim + blur * C.z * .06;
  float rim = inside * smoothstep(-th - aa, -th + aa, sd);
  float halo = exp(-max(sd, 0.) / (C.z * .07 + 4.)) * (1. - inside);
  vec2 uv = q / Rb;

  vec3 cyto = mix(CYTO_A, CYTO_B, clamp(length(uv - vec2(-.15, -.22)) / .92, 0., 1.));
  cyto *= mix(1., .7, smoothstep(.55, 1., d / R) * detail);

  // The nucleus sits back from the leading edge in a polarised, migrating cell.
  vec2 nOff = mix(vec2(0.), vec2(-.1, .05), detail) * Rb - dir * amt * .45 * Rb;
  float nr = Rb * mix(.234, .3, detail) * (1. + .015 * sin(uTime * .9));
  float nd = length(q - nOff);
  float nIn = 1. - smoothstep(nr - aa, nr + aa, nd);
  float nRing = 1. - smoothstep(0., aa + .5, abs(nd - nr) - uRim / 6.);
  // Mitosis, the same story as the intro: the nuclear envelope breaks down, chromosomes align on the
  // plate, sister chromatids pull apart toward the daughters, then the nuclei re-form.
  float envelope = 1. - hero * smoothstep(0., .2, uDiv) * (1. - smoothstep(.74, .96, uDiv));
  nIn *= envelope; nRing *= envelope;
  float chrom = 0.;
  if (dv > 0.){
    vec2 perp = vec2(-uDivAxis.y, uDivAxis.x);
    float sep = C.z * .85 * smoothstep(.26, .82, uDiv);
    float L = C.z * .055, rad = C.z * .027;
    for (int i = 0; i < 6; i++){
      vec2 pc = C.xy + perp * (float(i) - 2.5) * C.z * .115 + uDivAxis * (hash(vec2(float(i), 2.)) - .5) * C.z * .03;
      for (int k = 0; k < 2; k++){
        vec2 lp = p - (pc + uDivAxis * sep * (k == 0 ? 1. : -1.));
        // Rods point along the spindle axis, side by side across the plate — distinct chromosomes, not a bar.
        float cd = length(lp - uDivAxis * clamp(dot(lp, uDivAxis), -L, L)) - rad;
        chrom = max(chrom, 1. - smoothstep(-aa, aa, cd));
      }
    }
    chrom *= smoothstep(.04, .2, uDiv) * (1. - smoothstep(.78, .96, uDiv));
  }

  if (interior > .5 && detail > .001 && sd < 2.){
    vec2 w = uv * 2.4;
    w += .35 * vec2(fbm(w + uTime * .04), fbm(w + 5.2 - uTime * .035));
    float fib = contour(fbm(w * 1.3), 10.) * smoothstep(.3, .62, fbm(w * .8 + 3.));
    cyto += MINT2 * fib * .3 * detail * smoothstep(nr * 1.02, nr * 1.25, nd);
    // Cortical actin; brightest in the ruffling lamellipodium at the leading edge.
    cyto += MINT * smoothstep(.74, .96, d / R) * (.5 + .5 * noise(cs * 4.5 + vec2(0., uTime * .3))) * .12 * detail * (1. + lobe * amt * 9.);
    for (int i = 0; i < 9; i++){
      float fi = float(i), hv = hash(vec2(fi, 3.7));
      float a = fi * .7 + uTime * (.025 + .02 * hv) + hv * 2.;
      vec2 vp = vec2(cos(a), sin(a)) * (.5 + .32 * hash(vec2(fi, 9.1))) * Rb + dir * amt * .25 * Rb;
      float vr = Rb * (.028 + .03 * hash(vec2(fi, 1.3)));
      if (i < 6){
        float vd = length(q - vp);
        cyto = mix(cyto, MINT2, (1. - smoothstep(0., aa + .4, abs(vd - vr) - .6)) * .45 * detail);
        cyto += MINT2 * (1. - smoothstep(vr - aa, vr + aa, vd)) * .05 * detail;
      } else {
        vec2 t = vec2(-sin(a), cos(a)), lp = q - vp;
        float cd = length(lp - t * clamp(dot(lp, t), -vr * 1.8, vr * 1.8)) - vr * .55;
        cyto = mix(cyto, CORAL * .85, (1. - smoothstep(-aa, aa, cd)) * .62 * detail);
      }
    }
    cyto += CYAN * nIn * detail * .09 * smoothstep(.45, .75, fbm((q - nOff) / nr * 3. + uTime * .05));
    float nn = length(q - nOff - nr * vec2(.3, -.25));
    cyto = mix(cyto, CORAL * .8, (1. - smoothstep(nr * .12 - aa, nr * .12 + aa, nn)) * .55 * detail * envelope);
  }
  cyto = mix(cyto, CYAN, nIn * .16);
  cyto = mix(cyto, CYAN, nRing * .7);
  cyto = mix(cyto, CORAL, chrom * .92);

  col = mix(col, cyto, inside * C.w);
  col = mix(col, MINT, rim * C.w);
  col += MINT * halo * .2 * C.w * (.3 + .7 * detail) * (1. + amt * 3.);
  return col;
}

#ifdef BG
void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  // Backdrop: the intro's radial gradient, its centre drifting toward the hero cell.
  vec3 col = mix(TEAL, DEEP, clamp(length(p - uBase) / (uBaseR * .62), 0., 1.));
  // The intro glow, which follows the cell.
  col = mix(col, CYAN, uGlowAmt * max(0., 1. - length(p - uGlow.xy) / uGlow.z));
  // Depth layers rise far → mid; parallax runs against the cursor. (Near grains are crisp: MAIN pass.)
  vec3 farC = farLayer(p + uMouse * 7. + vec2(0., -uScroll * 60.));
  vec3 midC = midLayer(p + uMouse * 4. + vec2(0., -uScroll * 35.));
  col += farC * smoothstep(0., .55, uWorld) + midC * smoothstep(.25, .8, uWorld);
  gl_FragColor = vec4(col, 1.);
}
#else
void main(){
  vec2 res = uRes / uDpr;
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec3 col = texture2D(uBg, gl_FragCoord.xy / uRes).rgb;

  // The cell's own trail: a fading dotted path where it has crawled (the same language as the journey trail).
  if (p.x > uTrailBox.x && p.y > uTrailBox.y && p.x < uTrailBox.z && p.y < uTrailBox.w)
  for (int i = 0; i < 24; i++){
    vec3 t = uTrail[i];
    if (t.z <= .002) continue;
    float dd = length(p - t.xy);
    col += MINT2 * t.z * (smoothstep(2.6, 1.1, dd) * .5 + exp(-dd * dd / 70.) * .06);
  }

  col = cell(col, p, uCellA, uDetailA, uBlurA, 1., 0.);
  col = cell(col, p, uCellB, uDetail, 0., 1., 1.);

  col += nearLayer(p - uMouse * 14.) * smoothstep(.5, 1., uWorld);

  // Gentle vignette, then dither so the dark gradients never band.
  vec2 v = (p / res - .5) * vec2(1., .9);
  col *= 1. - .32 * smoothstep(.35, .85, length(v)) * uWorld;
  // Triangular dither (±1.5 LSB) — dark radial gradients band visibly on 8-bit displays otherwise.
  col += (hash(p + fract(uTime * 7.)) + hash(p.yx + 3.1 + fract(uTime * 3.)) - 1.) * 1.5 / 255.;
  gl_FragColor = vec4(col, 1.);
}
#endif
`

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source); gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'shader compile failed')
  return shader
}

const UNIFORMS = ['uBg', 'uTrailBox', 'uRes', 'uMouse', 'uBase', 'uDpr', 'uTime', 'uWorld', 'uDetail', 'uDetailA', 'uScroll', 'uRim', 'uGlowAmt', 'uBaseR', 'uBlurA', 'uPull', 'uDiv', 'uCellA', 'uCellB', 'uGlow', 'uPointer', 'uDivAxis', 'uTrail']
const TRAIL = 24

export function createTissue(canvas, { still = false } = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' })
  if (!gl) return null
  const deriv = !!gl.getExtension('OES_standard_derivatives')

  const link = (pass) => {
    const program = gl.createProgram()
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG(deriv, pass)))
    gl.bindAttribLocation(program, 0, 'p')
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'link failed')
    return { program, u: Object.fromEntries(UNIFORMS.map(name => [name, gl.getUniformLocation(program, name)])) }
  }
  const bgPass = link('BG'), mainPass = link('MAIN')

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  // Half-resolution target for the defocused layers. Half-float where supported, so dark gradients can't band.
  const half = gl.getExtension('OES_texture_half_float')
  const halfLinear = gl.getExtension('OES_texture_half_float_linear')
  const halfTarget = gl.getExtension('EXT_color_buffer_half_float')
  const texType = half && halfLinear && halfTarget ? half.HALF_FLOAT_OES : gl.UNSIGNED_BYTE
  const bgTex = gl.createTexture(), fbo = gl.createFramebuffer()
  let bgW = 1, bgH = 1
  function sizeTarget() {
    bgW = Math.max(1, Math.ceil(canvas.width / 2)); bgH = Math.max(1, Math.ceil(canvas.height / 2))
    gl.bindTexture(gl.TEXTURE_2D, bgTex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bgW, bgH, 0, gl.RGBA, texType, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bgTex, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  // Tweenable scene state, all in CSS px relative to the hero.
  const state = {
    on: still, world: still ? 1 : 0, detail: still ? 1 : 0, scroll: 0, rim: 4,
    cellA: { x: 0, y: 0, r: 90, a: 0, blur: 0, detail: 0 },
    cellB: { x: 0, y: 0, r: 90, a: 1 },
    glow: { x: 0, y: 0, r: 270, amt: .32 },
    base: { x: 0, y: 0, r: 1000 },
    mouse: { x: 0, y: 0 },
    // Interaction (enabled once the entrance has settled): the cell = anchor + a slow crawl toward the cursor.
    interactive: false, anchor: { x: 0, y: 0, r: 90 }, follow: { x: 0, y: 0 },
    pointer: { x: -9999, y: -9999 }, pull: 0, pullScale: 1, sense: 0, div: 0, divAxis: { x: 1, y: 0 },
  }
  const trail = new Float32Array(TRAIL * 3)
  let lastTrail = 0, lastTick = performance.now()
  const target = { x: 0, y: 0 }
  let frame = 0, running = false, dpr = 1, drawnOff = false
  let lastRender = 0, scrollingUntil = 0
  const start = performance.now() - (still ? 14000 : 0)
  const onScroll = () => { scrollingUntil = performance.now() + 160 }
  addEventListener('scroll', onScroll, { passive: true })

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.25)
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr))
    sizeTarget()
    if (still) render(start + 14000)
  }

  function render(now) {
    // Cursor eased toward its target (100-200ms feel) so parallax glides.
    state.mouse.x += (target.x - state.mouse.x) * .08
    state.mouse.y += (target.y - state.mouse.y) * .08
    const dt = Math.min(.05, (now - lastTick) / 1000); lastTick = now
    const { cellA: a, cellB: b, glow: g, base } = state
    // Sensing ramps in over ~1s once the cell is interactive, so it never twitches mid-entrance.
    state.sense = state.interactive ? Math.min(1, state.sense + dt) : 0
    if (state.interactive) {
      // Crawl: drift a little toward the signal, tethered to home; frozen while dividing.
      const f = state.follow, an = state.anchor
      let tx = 0, ty = 0
      if (state.pull > .01 && state.div === 0) {
        tx = (state.pointer.x - an.x) * .12; ty = (state.pointer.y - an.y) * .12
        const len = Math.hypot(tx, ty), max = an.r * .22
        if (len > max) { tx *= max / len; ty *= max / len }
        tx = Math.max(tx, -an.r * .1)   // the name lives to the left: never crawl into it
        tx *= state.pull; ty *= state.pull
      }
      if (state.div === 0) { f.x += (tx - f.x) * .018; f.y += (ty - f.y) * .018 }
      b.x = an.x + f.x; b.y = an.y + f.y + state.scroll * 90; b.r = an.r
      g.x = b.x; g.y = b.y
      // Trail: drop a dot whenever the cell has moved; dots fade over ~3.5s.
      for (let i = 2; i < trail.length; i += 3) trail[i] = Math.max(0, trail[i] - dt / 3.5)
      const lx = trail[(TRAIL - 1) * 3], ly = trail[(TRAIL - 1) * 3 + 1]
      if (now - lastTrail > 110 && Math.hypot(b.x - lx, b.y - ly) > 9) {
        trail.copyWithin(0, 3); trail.set([b.x, b.y, .9], (TRAIL - 1) * 3); lastTrail = now
      }
    }
    const set = (u, w, h, pdpr) => {
      gl.uniform2f(u.uRes, w, h)
      gl.uniform2f(u.uMouse, state.mouse.x, state.mouse.y)
      gl.uniform2f(u.uBase, base.x, base.y)
      gl.uniform1f(u.uBaseR, base.r)
      gl.uniform1f(u.uDpr, pdpr)
      // fixedTime: test hook — freezes noise, motion and dither so two renders can be compared pixel for pixel.
      gl.uniform1f(u.uTime, state.fixedTime ?? (now - start) / 1000)
      gl.uniform1f(u.uWorld, state.world)
      gl.uniform1f(u.uDetail, state.detail)
      gl.uniform1f(u.uDetailA, a.detail || 0)
      gl.uniform1f(u.uPull, state.pull * state.pullScale * state.sense)
      gl.uniform1f(u.uDiv, state.div)
      gl.uniform2f(u.uPointer, state.pointer.x, state.pointer.y)
      gl.uniform2f(u.uDivAxis, state.divAxis.x, state.divAxis.y)
      gl.uniform3fv(u.uTrail, trail)
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
      for (let i = 0; i < trail.length; i += 3) if (trail[i + 2] > .002) { x0 = Math.min(x0, trail[i]); y0 = Math.min(y0, trail[i + 1]); x1 = Math.max(x1, trail[i]); y1 = Math.max(y1, trail[i + 1]) }
      gl.uniform4f(u.uTrailBox, x0 - 12, y0 - 12, x1 + 12, y1 + 12)
      gl.uniform1f(u.uScroll, state.scroll)
      gl.uniform1f(u.uRim, state.rim)
      gl.uniform1f(u.uGlowAmt, g.amt)
      gl.uniform3f(u.uGlow, g.x, g.y, g.r)
      gl.uniform1f(u.uBlurA, a.blur)
      gl.uniform4f(u.uCellA, a.x, a.y, a.r, a.a)
      gl.uniform4f(u.uCellB, b.x, b.y, b.r, b.a)
    }
    // Pass 1 — soft layers at half resolution.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.viewport(0, 0, bgW, bgH)
    gl.useProgram(bgPass.program)
    set(bgPass.u, bgW, bgH, dpr * bgW / canvas.width)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    // Pass 2 — everything crisp at full resolution, over the upsampled soft layers.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.useProgram(mainPass.program)
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bgTex)
    gl.uniform1i(mainPass.u.uBg, 0)
    set(mainPass.u, canvas.width, canvas.height, dpr)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function loop(now) {
    // The world never freezes. It runs at ≤60fps (a 120Hz panel would double the GPU cost for no visible gain),
    // easing to 30fps while the page scrolls so the compositor keeps headroom on small laptop GPUs.
    const gap = now < scrollingUntil ? 1000 / 30 - 2 : 1000 / 60 - 2
    // Until the hand-off the intro covers the hero entirely: one frame is enough.
    if ((state.on || !drawnOff) && now - lastRender >= gap) { render(now); lastRender = now; drawnOff = !state.on }
    frame = running ? requestAnimationFrame(loop) : 0
  }

  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  return {
    state,
    pointer(nx, ny) { target.x = nx; target.y = ny },
    redraw() { render(still ? start + 14000 : performance.now()) },
    play() { if (still || running) return; running = true; frame = requestAnimationFrame(loop) },
    pause() { running = false; cancelAnimationFrame(frame); frame = 0 },
    // No loseContext(): React StrictMode remounts reuse this canvas, and a lost context can't be revived.
    destroy() { running = false; ro.disconnect(); removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) },
  }
}

// Where the hero cell lives once the world has formed.
export function heroSpot(width, height) {
  if (width < 780) return { x: width * .63, y: height * .27, r: width * .29 }
  return { x: width * .7, y: height * .5, r: Math.min(height * .3, width * .19) }
}
