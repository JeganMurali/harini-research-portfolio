import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, OrbitControls, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

// Stylised 2 dpf Danio rerio larva — the stage the review uses for microinjection
// assays. The body is rebuilt every frame from a travelling wave so the larva swims
// with a real subcarangiform tail beat (lateral, along z) rather than a rigid spin.
const HEAD_X = -3.4
const BODY_LENGTH = 6.9
const DORSO_VENTRAL = 1.2
const LATERAL = .52

const RADIUS_PROFILE = [
  [0, .02], [.03, .17], [.07, .31], [.12, .4], [.17, .435], [.22, .43], [.27, .385],
  [.33, .325], [.4, .285], [.5, .245], [.6, .2], [.7, .155], [.8, .108], [.88, .07],
  [.94, .042], [1, .012],
]

const smooth = (x) => x * x * (3 - 2 * x)
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x)

function radiusAt(t) {
  const c = clamp01(t)
  for (let i = 0; i < RADIUS_PROFILE.length - 1; i++) {
    const [t0, r0] = RADIUS_PROFILE[i]
    const [t1, r1] = RADIUS_PROFILE[i + 1]
    if (c >= t0 && c <= t1) return r0 + (r1 - r0) * smooth((c - t0) / (t1 - t0))
  }
  return .012
}

function finHeightAt(t) {
  if (t < .36) return 0
  const grow = smooth(clamp01((t - .36) / .3)) * .2
  const caudal = t > .86 ? smooth((t - .86) / .14) * .3 : 0
  return grow + caudal
}

// Spine position at normalised body coordinate t. Amplitude grows toward the tail,
// so the head stays steady while the caudal region sweeps — as in a real larva.
function centerAt(t, time, out) {
  out.x = HEAD_X + t * BODY_LENGTH
  out.y = Math.sin(t * 2.6) * .1 - .03
  out.z = Math.sin(t * 5.6 - time * 2.6) * (.012 + .34 * Math.pow(t, 2.2))
  return out
}

// Injection sites as body coordinates (t, dorsoventral, lateral) so they ride the
// swimming body instead of drifting off it. Labels mirror assayGuide[].sites.
const anatomySites = {
  local: [{ t: .24, dv: -.42, lat: .18 }, { t: .32, dv: -.3, lat: .16 }],
  vascular: [{ t: .2, dv: -.16, lat: .22 }, { t: .8, dv: -.06, lat: .06 }],
  confinement: [{ t: .19, dv: .22, lat: .1 }],
  brain: [{ t: .1, dv: .26, lat: .12 }, { t: .155, dv: .26, lat: .1 }],
  metastasis: [{ t: .2, dv: -.16, lat: .22 }, { t: .12, dv: .16, lat: .1 }],
  screening: [{ t: .24, dv: -.42, lat: .18 }],
}

const VASCULAR_IDS = ['vascular', 'metastasis']

const scratchCenter = { x: 0, y: 0, z: 0 }
const scratchAhead = { x: 0, y: 0, z: 0 }
const scratchBehind = { x: 0, y: 0, z: 0 }

// Orthonormal frame along the spine, written into the supplied arrays.
function frameAt(t, time, frame) {
  centerAt(t, time, scratchCenter)
  centerAt(Math.min(1, t + .005), time, scratchAhead)
  centerAt(Math.max(0, t - .005), time, scratchBehind)
  let tx = scratchAhead.x - scratchBehind.x
  let ty = scratchAhead.y - scratchBehind.y
  let tz = scratchAhead.z - scratchBehind.z
  const tl = Math.hypot(tx, ty, tz) || 1
  tx /= tl; ty /= tl; tz /= tl
  // side = tangent x worldUp
  let sx = ty * 0 - tz * 1
  let sy = tz * 0 - tx * 0
  let sz = tx * 1 - ty * 0
  const sl = Math.hypot(sx, sy, sz) || 1
  sx /= sl; sy /= sl; sz /= sl
  // up = side x tangent
  const ux = sy * tz - sz * ty
  const uy = sz * tx - sx * tz
  const uz = sx * ty - sy * tx
  frame.cx = scratchCenter.x; frame.cy = scratchCenter.y; frame.cz = scratchCenter.z
  frame.sx = sx; frame.sy = sy; frame.sz = sz
  frame.ux = ux; frame.uy = uy; frame.uz = uz
  return frame
}

const sharedFrame = { cx: 0, cy: 0, cz: 0, sx: 0, sy: 0, sz: 0, ux: 0, uy: 0, uz: 0 }

// World position of a body-coordinate site.
function siteToWorld(site, time, out) {
  frameAt(site.t, time, sharedFrame)
  const r = radiusAt(site.t)
  const dv = site.dv
  const lat = site.lat
  out.set(
    sharedFrame.cx + sharedFrame.ux * dv + sharedFrame.sx * lat,
    sharedFrame.cy + sharedFrame.uy * dv + sharedFrame.sy * lat,
    sharedFrame.cz + sharedFrame.uz * dv + sharedFrame.sz * lat,
  )
  return out
}

function useSwimmingBody(compact) {
  return useMemo(() => {
    const segments = compact ? 100 : 150
    const radial = compact ? 18 : 26
    const vertexCount = (segments + 1) * (radial + 1)
    const positions = new Float32Array(vertexCount * 3)
    const cosTable = new Float32Array(radial + 1)
    const sinTable = new Float32Array(radial + 1)
    for (let j = 0; j <= radial; j++) {
      const angle = (j / radial) * Math.PI * 2
      cosTable[j] = Math.cos(angle)
      sinTable[j] = Math.sin(angle)
    }

    const indices = []
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * (radial + 1) + j
        const b = a + radial + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(indices)

    const frame = { ...sharedFrame }
    let tick = 0
    const update = (time) => {
      let p = 0
      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        frameAt(t, time, frame)
        const r = radiusAt(t)
        const ry = r * DORSO_VENTRAL
        const rz = r * LATERAL
        for (let j = 0; j <= radial; j++) {
          const dv = cosTable[j] * ry
          const lat = sinTable[j] * rz
          positions[p++] = frame.cx + frame.ux * dv + frame.sx * lat
          positions[p++] = frame.cy + frame.uy * dv + frame.sy * lat
          positions[p++] = frame.cz + frame.uz * dv + frame.sz * lat
        }
      }
      geometry.attributes.position.needsUpdate = true
      // Normals drive the translucent shading only — recomputing every other
      // frame halves the per-frame cost with no visible difference.
      if ((tick++ & 1) === 0) geometry.computeVertexNormals()
    }

    update(0)
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6)
    return { geometry, update }
  }, [compact])
}

// Dorsal + ventral fin fold as a ribbon that follows the same travelling wave.
function useFinRibbon(side, compact) {
  return useMemo(() => {
    const segments = compact ? 40 : 64
    const positions = new Float32Array((segments + 1) * 2 * 3)
    const indices = []
    for (let i = 0; i < segments; i++) {
      const a = i * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(indices)

    const frame = { ...sharedFrame }
    const update = (time) => {
      let p = 0
      for (let i = 0; i <= segments; i++) {
        const t = .34 + (i / segments) * .66
        frameAt(t, time, frame)
        const inner = radiusAt(t) * DORSO_VENTRAL * .85 * side
        const outer = (radiusAt(t) * DORSO_VENTRAL + finHeightAt(t)) * side
        positions[p++] = frame.cx + frame.ux * inner
        positions[p++] = frame.cy + frame.uy * inner
        positions[p++] = frame.cz + frame.uz * inner
        positions[p++] = frame.cx + frame.ux * outer
        positions[p++] = frame.cy + frame.uy * outer
        positions[p++] = frame.cz + frame.uz * outer
      }
      geometry.attributes.position.needsUpdate = true
    }

    update(0)
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6)
    return { geometry, update }
  }, [side, compact])
}

// Intersegmental vessels + notochord as one LineSegments batch (cheap to update).
function useVesselMesh(compact) {
  return useMemo(() => {
    const isvCount = compact ? 8 : 12
    const notochordSteps = 30
    const isvSteps = 4
    const segmentCount = isvCount * isvSteps + notochordSteps
    const positions = new Float32Array(segmentCount * 2 * 3)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const frame = { ...sharedFrame }
    const write = (p, t, dv, lat, time) => {
      frameAt(t, time, frame)
      positions[p] = frame.cx + frame.ux * dv + frame.sx * lat
      positions[p + 1] = frame.cy + frame.uy * dv + frame.sy * lat
      positions[p + 2] = frame.cz + frame.uz * dv + frame.sz * lat
      return p + 3
    }

    const update = (time) => {
      let p = 0
      for (let v = 0; v < isvCount; v++) {
        const t = .34 + (v / (isvCount - 1)) * .5
        const top = radiusAt(t) * DORSO_VENTRAL * .88
        for (let s = 0; s < isvSteps; s++) {
          const f0 = s / isvSteps
          const f1 = (s + 1) / isvSteps
          p = write(p, t, -.17 + (top + .17) * f0, 0, time)
          p = write(p, t, -.17 + (top + .17) * f1, 0, time)
        }
      }
      for (let s = 0; s < notochordSteps; s++) {
        const t0 = .26 + (s / notochordSteps) * .68
        const t1 = .26 + ((s + 1) / notochordSteps) * .68
        p = write(p, t0, .02, 0, time)
        p = write(p, t1, .02, 0, time)
      }
      geometry.attributes.position.needsUpdate = true
    }

    update(0)
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6)
    return { geometry, update }
  }, [compact])
}

function AxialVessel({ dv, colour, width, opacity, time }) {
  const ref = useRef(null)
  const buffer = useMemo(() => new Float32Array(41 * 3), [])
  const points = useMemo(() => Array.from({ length: 41 }, () => new THREE.Vector3()), [])
  useFrame(() => {
    if (!ref.current) return
    const frame = sharedFrame
    for (let i = 0; i <= 40; i++) {
      const t = .22 + (i / 40) * .72
      frameAt(t, time.current, frame)
      buffer[i * 3] = frame.cx + frame.ux * dv
      buffer[i * 3 + 1] = frame.cy + frame.uy * dv
      buffer[i * 3 + 2] = frame.cz + frame.uz * dv
    }
    ref.current.geometry.setPositions(buffer)
  })
  return <Line ref={ref} points={points} color={colour} lineWidth={width} transparent opacity={opacity} />
}

function CirculatingCells({ count, colour, time }) {
  const group = useRef(null)
  const offsets = useMemo(() => Array.from({ length: count }, (_, i) => (i / count) * 2), [count])
  const vec = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    if (!group.current) return
    group.current.children.forEach((child, i) => {
      const phase = (offsets[i] + time.current * .17) % 2
      // Forward along the dorsal aorta, then back along the posterior cardinal vein.
      const site = phase < 1
        ? { t: .22 + phase * .72, dv: -.02, lat: 0 }
        : { t: .94 - (phase - 1) * .72, dv: -.17, lat: 0 }
      siteToWorld(site, time.current, vec)
      child.position.copy(vec)
    })
  })
  return (
    <group ref={group}>
      {offsets.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[.045, 10, 8]} />
          <meshBasicMaterial color={i % 4 === 0 ? colour : '#ff5f43'} transparent opacity={.9} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function InjectionMarker({ site, primary, time, reduceMotion }) {
  const group = useRef(null)
  const ring = useRef(null)
  const core = useRef(null)
  const halo = useRef(null)
  const vec = useMemo(() => new THREE.Vector3(), [])
  const colour = primary ? '#ffffff' : '#f4d27a'
  useFrame(() => {
    if (group.current) group.current.position.copy(siteToWorld(site, time.current, vec))
    if (reduceMotion) return
    const pulse = (Math.sin(time.current * 2.6) + 1) / 2
    if (ring.current) {
      ring.current.scale.setScalar(.85 + pulse * .7)
      ring.current.material.opacity = .8 - pulse * .55
    }
    if (core.current) core.current.scale.setScalar(.9 + pulse * .22)
    if (halo.current) halo.current.material.opacity = .16 + pulse * .1
  })
  return (
    <group ref={group}>
      <mesh ref={halo}>
        <sphereGeometry args={[.32, 18, 14]} />
        <meshBasicMaterial color={primary ? '#9fd8c7' : '#f4d27a'} transparent opacity={.18} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[.07, 16, 12]} />
        <meshBasicMaterial color={colour} toneMapped={false} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[.21, .01, 10, 34]} />
        <meshBasicMaterial color={colour} transparent opacity={.7} toneMapped={false} />
      </mesh>
      <mesh position={[0, .48, 0]}>
        <cylinderGeometry args={[.0035, .0035, .6, 6]} />
        <meshBasicMaterial color={colour} transparent opacity={.32} toneMapped={false} />
      </mesh>
      {primary && (
        <group position={[.24, .4, .16]} rotation={[0, 0, -Math.PI / 3.5]}>
          <mesh position={[0, .3, 0]}>
            <cylinderGeometry args={[.022, .01, .6, 10]} />
            <meshStandardMaterial color="#dfe6e4" roughness={.25} metalness={.5} transparent opacity={.85} />
          </mesh>
          <mesh position={[0, -.05, 0]}>
            <coneGeometry args={[.01, .15, 10]} />
            <meshStandardMaterial color="#f6f2e8" roughness={.2} metalness={.4} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function Larva({ active, compact, reduceMotion }) {
  const group = useRef(null)
  const time = useRef(0)
  const body = useSwimmingBody(compact)
  const dorsalFin = useFinRibbon(1, compact)
  const ventralFin = useFinRibbon(-1, compact)
  const vessels = useVesselMesh(compact)
  const pectoral = useRef(null)

  const lit = VASCULAR_IDS.includes(active)
  const cerebralLit = active === 'brain' || active === 'metastasis'
  const vesselColour = lit ? '#f4d27a' : '#62c9d0'

  useFrame((state, delta) => {
    if (!reduceMotion) time.current += delta
    const t = time.current
    body.update(t)
    dorsalFin.update(t)
    ventralFin.update(t)
    vessels.update(t)
    if (group.current && !reduceMotion) {
      // Held slightly oblique so the lateral tail beat stays visible broadside.
      group.current.rotation.y = .16 + Math.sin(t * .24) * .17
      group.current.position.y = Math.sin(t * .8) * .04
    }
    if (pectoral.current && !reduceMotion) {
      pectoral.current.children.forEach((fin, i) => {
        fin.rotation.z = Math.sin(t * 4 + i * Math.PI) * .35
      })
    }
  })

  const sites = anatomySites[active] || anatomySites.local

  return (
    <group ref={group}>
      <mesh geometry={body.geometry}>
        <meshPhysicalMaterial color="#8fdae0" transparent opacity={.19} roughness={.12} metalness={0} transmission={.82} thickness={.9} ior={1.34} iridescence={.5} iridescenceIOR={1.2} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Back-face rim pass gives the translucent larva a readable silhouette. */}
      <mesh geometry={body.geometry} scale={1.012}>
        <meshBasicMaterial color="#62c9d0" transparent opacity={.09} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh geometry={body.geometry} scale={1.002}>
        <meshBasicMaterial color="#9fd8c7" wireframe transparent opacity={compact ? .035 : .05} depthWrite={false} />
      </mesh>

      <mesh geometry={dorsalFin.geometry}>
        <meshBasicMaterial color="#9fd8c7" transparent opacity={.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh geometry={ventralFin.geometry}>
        <meshBasicMaterial color="#9fd8c7" transparent opacity={.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <lineSegments geometry={vessels.geometry}>
        <lineBasicMaterial color={vesselColour} transparent opacity={lit ? .6 : .34} />
      </lineSegments>
      <AxialVessel dv={-.02} colour={vesselColour} width={lit ? 2.1 : 1.4} opacity={lit ? 1 : .55} time={time} />
      <AxialVessel dv={-.17} colour={vesselColour} width={lit ? 1.8 : 1.15} opacity={lit ? .9 : .45} time={time} />

      {/* Cerebral vasculature and duct of Cuvier sit in the near-static head region. */}
      <Line points={[[-2.95, .05, .12], [-2.75, .3, .1], [-2.4, .32, .08], [-2.1, .2, .06]]} color={cerebralLit ? '#ef8d72' : vesselColour} lineWidth={1.3} transparent opacity={cerebralLit ? .95 : .4} />
      <Line points={[[-2.9, -.05, -.1], [-2.55, .12, -.08], [-2.15, .05, -.05]]} color={cerebralLit ? '#ef8d72' : vesselColour} lineWidth={1.1} transparent opacity={cerebralLit ? .8 : .32} />
      <Line points={[[-2.35, -.02, .06], [-2.1, -.16, .2], [-1.75, -.24, .22], [-1.35, -.2, .14], [-1.05, -.12, .04]]} color={vesselColour} lineWidth={lit ? 2.1 : 1.1} transparent opacity={lit ? 1 : .42} />

      <mesh position={[-1.78, -.42, 0]} scale={[.76, .56, .48]}>
        <sphereGeometry args={[1, 36, 26]} />
        <meshStandardMaterial color="#f4d27a" transparent opacity={.32} emissive="#f4d27a" emissiveIntensity={active === 'local' || active === 'screening' ? .45 : .12} roughness={.55} depthWrite={false} />
      </mesh>

      {/* Larval eyes are proportionally large but sit inside the head — kept small
          and pigmented rather than opaque spheres so they never dominate. */}
      {[.155, -.155].map((z) => (
        <group key={z} position={[-2.88, .13, z]}>
          <mesh><sphereGeometry args={[.148, 20, 16]} /><meshStandardMaterial color="#123f45" roughness={.4} metalness={.15} transparent opacity={.92} /></mesh>
          <mesh position={[-.05, .012, z > 0 ? .055 : -.055]}><sphereGeometry args={[.084, 16, 12]} /><meshBasicMaterial color="#072226" /></mesh>
          <mesh position={[-.075, .05, z > 0 ? .085 : -.085]}><sphereGeometry args={[.023, 10, 8]} /><meshBasicMaterial color="#dcf1ea" transparent opacity={.8} /></mesh>
        </group>
      ))}

      <group ref={pectoral}>
        {[.2, -.2].map((z) => (
          <mesh key={z} position={[-1.62, -.2, z]} rotation={[0, 0, .3]} scale={[.22, .1, .3]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color="#9fd8c7" transparent opacity={.2} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}
      </group>

      <CirculatingCells count={compact ? 12 : 20} colour="#ff8a63" time={time} />

      {sites.map((site, index) => (
        <InjectionMarker key={`${active}-${index}`} site={site} primary={index === 0} time={time} reduceMotion={reduceMotion} />
      ))}

      {active === 'screening' && (
        <Sparkles count={compact ? 30 : 60} scale={[7.6, 2.4, 1.6]} size={1.6} speed={reduceMotion ? 0 : .5} color="#f4d27a" />
      )}
    </group>
  )
}

const FOV = 40
const FIT_WIDTH = 8.1
const FIT_HEIGHT = 2.4

// The larva is long and thin, so a fixed camera distance clips it on narrow
// viewports. Derive the distance from the live aspect ratio instead.
function FitCamera() {
  const { camera, size } = useThree()
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1)
    const halfFov = THREE.MathUtils.degToRad(FOV) / 2
    const forWidth = (FIT_WIDTH / 2) / (Math.tan(halfFov) * aspect)
    const forHeight = (FIT_HEIGHT / 2) / Math.tan(halfFov)
    camera.position.setZ(Math.max(forWidth, forHeight))
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])
  return null
}

function useSceneProfile() {
  const read = () => ({
    compact: matchMedia('(max-width: 780px)').matches,
    reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  })
  const [profile, setProfile] = useState(read)

  useEffect(() => {
    const compactQuery = matchMedia('(max-width: 780px)')
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setProfile(read())
    compactQuery.addEventListener('change', update)
    motionQuery.addEventListener('change', update)
    return () => {
      compactQuery.removeEventListener('change', update)
      motionQuery.removeEventListener('change', update)
    }
  }, [])

  return profile
}

export default function ZebrafishScene({ active = 'local', paused = false }) {
  const { compact, reduceMotion } = useSceneProfile()
  return (
    <Canvas
      dpr={compact ? [1, 1.25] : [1, 1.6]}
      frameloop={paused ? 'never' : 'always'}
      camera={{ position: [0, .35, 8], fov: FOV }}
      gl={{ antialias: !compact, alpha: true, powerPreference: 'high-performance' }}
    >
      <FitCamera />
      <ambientLight intensity={1.2} />
      <pointLight position={[3, 4, 6]} color="#9fd8c7" intensity={26} />
      <pointLight position={[-5, -2, 4]} color="#62c9d0" intensity={16} />
      <pointLight position={[0, 3, -5]} color="#ef8d72" intensity={10} />
      <Larva active={active} compact={compact} reduceMotion={reduceMotion} />
      <Sparkles count={compact ? 26 : 48} scale={[10, 5, 3]} size={1.1} speed={reduceMotion ? 0 : .2} color="#9fd8c7" opacity={.45} />
      {/* Azimuth is clamped so the larva can never be dragged fully head-on,
          where a translucent body reads as two floating eyes. */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2.9}
        maxPolarAngle={Math.PI / 1.75}
        minAzimuthAngle={-Math.PI / 5}
        maxAzimuthAngle={Math.PI / 5}
      />
    </Canvas>
  )
}
