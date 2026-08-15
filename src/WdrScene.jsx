import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line, OrbitControls, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

const colors = ['#9fd8c7', '#ef8d72', '#62c9d0', '#f4d27a']

function ActinFibres({ step }) {
  const curves = useMemo(() => Array.from({ length: 13 }, (_, index) => {
    const z = (index - 6) * .09
    return Array.from({ length: 8 }, (_, p) => new THREE.Vector3(
      -2.45 + p * .7,
      -.72 + index * .12 + Math.sin(p * .75 + index * .35) * .15,
      .72 + z * .14 + Math.cos(p * .65 + index) * .04,
    ))
  }), [])
  return curves.map((points, i) => (
    <Line key={i} points={points} color={step === 1 && i % 3 === 0 ? '#ef8d72' : '#78d6c4'} lineWidth={step === 1 && i % 3 === 0 ? .8 : 1.35} transparent opacity={step === 1 && i % 3 === 0 ? .28 : .72} dashed={step === 1 && i % 3 === 0} dashSize={.12} gapSize={.12} />
  ))
}

function WdrCell({ step }) {
  const group = useRef(null)
  const pulse = useRef(null)
  useFrame((state, delta) => {
    group.current.rotation.y += delta * .055
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * .25) * .05
    if (pulse.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 3) * .22
      pulse.current.scale.setScalar(s)
    }
  })
  const markerPositions = [[2.25, .55, .78], [1.9, -.05, .8], [2.45, -.55, .76], [1.35, .9, .74]]
  return (
    <group ref={group}>
      <mesh scale={[2.75, 1.78, .68]}>
        <sphereGeometry args={[1, 72, 72]} />
        <meshPhysicalMaterial color="#1a7780" transparent opacity={.1} roughness={.2} transmission={.2} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Float speed={1.1} rotationIntensity={.08} floatIntensity={.12}>
        <mesh position={[-.3, .05, .15]} scale={[1.05, 1.05, .5]}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial color="#ef8d72" transparent opacity={.11} emissive="#ef8d72" emissiveIntensity={.18} roughness={.5} />
        </mesh>
      </Float>
      <ActinFibres step={step} />
      {markerPositions.map((position, index) => (
        <group position={position} key={index} visible={step === 0 || index === step}>
          <mesh ref={index === step ? pulse : null}><sphereGeometry args={[.11, 24, 24]} /><meshBasicMaterial color={colors[step]} toneMapped={false} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.24, .014, 12, 48]} /><meshBasicMaterial color={colors[step]} transparent opacity={.7} /></mesh>
        </group>
      ))}
      {step === 2 && <Sparkles count={35} scale={[1.1, 1.1, .4]} position={[2.2, -.55, .8]} size={2} speed={.8} color="#62c9d0" />}
      {step === 3 && [0, 1, 2].map((i) => <mesh key={i} position={[.75 + i * .42, 1.08 - i * .12, .8]} rotation={[0, 0, i * .15]}><boxGeometry args={[.32, .15, .15]} /><meshStandardMaterial color={i === 1 ? '#f4d27a' : '#7bd4c4'} emissive={i === 1 ? '#f4d27a' : '#1b6e70'} emissiveIntensity={.45} /></mesh>)}
    </group>
  )
}

export default function WdrScene({ step }) {
  return (
    <Canvas dpr={[1, 1.7]} camera={{ position: [0, 0, 8.3], fov: 42 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={1.3} /><pointLight position={[4, 5, 5]} color="#9fd8c7" intensity={22} /><pointLight position={[-4, -2, 3]} color="#ef8d72" intensity={13} />
      <WdrCell step={step} /><Sparkles count={70} scale={[7, 4.6, 2]} size={1.2} speed={.25} color="#9fd8c7" />
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 1.65} autoRotate autoRotateSpeed={.28} />
    </Canvas>
  )
}
