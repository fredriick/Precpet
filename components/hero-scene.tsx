"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { MeshDistortMaterial, MeshTransmissionMaterial } from "@react-three/drei"
import * as THREE from "three"

interface SportsProps {
  mouse?: { x: number; y: number }
  scrollProgress?: number
}

// ─── Soccer Field Grid ──────────────────────────────────────────
function Field({ scrollProgress = 0 }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texRef = useRef<THREE.CanvasTexture | null>(null)

  // Create canvas texture once
  if (typeof document !== "undefined" && !texRef.current) {
    const c = document.createElement("canvas")
    c.width = 512
    c.height = 512
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#0a0a0f"
    ctx.fillRect(0, 0, 512, 512)

    ctx.strokeStyle = "rgba(16, 185, 129, 0.25)"
    ctx.lineWidth = 2
    const margin = 40
    const w = 512 - margin * 2
    const h = 512 - margin * 2
    ctx.strokeRect(margin, margin, w, h)
    ctx.beginPath(); ctx.moveTo(256, margin); ctx.lineTo(256, 512 - margin); ctx.stroke()
    ctx.beginPath(); ctx.arc(256, 256, 60, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeRect(margin + 40, margin + 80, w - 80, 100)
    ctx.strokeRect(margin + 40, 512 - margin - 180, w - 80, 100)
    ctx.strokeRect(margin + 100, margin + 130, w - 200, 50)
    ctx.strokeRect(margin + 100, 512 - margin - 180, w - 200, 50)

    texRef.current = new THREE.CanvasTexture(c)
  }

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()
    const s = scrollProgress
    meshRef.current.scale.setScalar(6 + s * 4)
    meshRef.current.position.z = -3 - s * 6
    meshRef.current.rotation.x = Math.PI / 2.5 + s * 0.15
    meshRef.current.position.y = -3 - s * 2
  })

  if (!texRef.current) return null

  return (
    <mesh ref={meshRef} position={[0, -3, -3]} rotation={[Math.PI / 2.5, 0, 0]} scale={6}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial map={texRef.current} transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ─── Goal Frame ─────────────────────────────────────────────────
function Goal({ scrollProgress = 0 }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    const s = scrollProgress
    groupRef.current.position.z = -1.5 - s * 5
    groupRef.current.position.y = -0.5 - s * 1.5
    groupRef.current.rotation.y = Math.sin(t * 0.1 + s * 2) * 0.08
    groupRef.current.scale.setScalar(1 - s * 0.15)
  })

  return (
    <group ref={groupRef} position={[0, -0.5, -1.5]}>
      {/* Goal posts — brighter */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              -1.2, 0, 0,  1.2, 0, 0,
              -1.2, 1.5, 0,  1.2, 1.5, 0,
              -1.2, 0, 0,  -1.2, 1.5, 0,
              1.2, 0, 0,   1.2, 1.5, 0,
              -1.2, 1.5, 0,  -1.2, 1.5, -0.8,
              1.2, 1.5, 0,   1.2, 1.5, -0.8,
              -1.2, 0, 0,   -1.2, 0, -0.8,
              1.2, 0, 0,    1.2, 0, -0.8,
              -1.2, 1.5, -0.8,  1.2, 1.5, -0.8,
              -1.2, 0, -0.8,    1.2, 0, -0.8,
              -1.2, 1.5, -0.8,  -1.2, 0, -0.8,
              1.2, 1.5, -0.8,   1.2, 0, -0.8,
            ]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#34d399" transparent opacity={0.6} />
      </lineSegments>
    </group>
  )
}

// ─── Dynamic Soccer Ball ────────────────────────────────────────
function SoccerBall({ mouse, scrollProgress = 0 }: SportsProps) {
  const ref = useRef<THREE.Mesh>(null)
  const kickImpulse = useRef(0)
  const spinRef = useRef(0)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    const s = scrollProgress
    const targetKick = s * 8
    kickImpulse.current += (targetKick - kickImpulse.current) * 0.05
    spinRef.current += kickImpulse.current * 0.02

    const driftX = Math.sin(t * 0.2 + s * 5) * 0.8 * (1 + s)
    const liftY = -s * 1.5
    const spin = spinRef.current + t * 0.8

    ref.current.rotation.x = spin
    ref.current.rotation.z = Math.sin(t * 0.4 + s * 3) * 0.3
    ref.current.rotation.y = spin * 1.6 + s * 3
    ref.current.position.x = driftX + (mouse?.x ?? 0) * 0.6
    ref.current.position.y = liftY + (mouse?.y ?? 0) * 0.6 + Math.sin(t * 0.8 + s * 2) * 0.4
    ref.current.position.z = -2 - s * 3

    const breathe = 1 + Math.sin(t * 0.6 + s * 4) * 0.06
    ref.current.scale.setScalar((1.2 - s * 0.3) * breathe)
  })

  return (
    <mesh ref={ref} position={[0, 0, -2]} scale={1.2}>
      <icosahedronGeometry args={[1, 2]} />
      <MeshDistortMaterial
        color="#10b981"
        roughness={0.2}
        metalness={0.6}
        distort={0.06 + scrollProgress * 0.12}
        speed={2 + scrollProgress * 4}
        emissive="#10b981"
        emissiveIntensity={0.3 + scrollProgress * 0.4}
        wireframe
      />
    </mesh>
  )
}

// ─── Speed Trails ────────────────────────────────────────
function SpeedTrails({ scrollProgress = 0 }: { scrollProgress: number }) {
  const trailCount = 100
  const ref = useRef<THREE.Points>(null)
  const posArray = useMemo(() => new Float32Array(trailCount * 3), [])

  useFrame((state) => {
    if (!ref.current) return
    const s = scrollProgress
    const t = state.clock.getElapsedTime()
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    const speed = s * 2

    for (let i = 0; i < trailCount; i++) {
      const phase = i / trailCount
      const trailZ = ((t * speed + phase * 10 + i * 0.1) % 12) - 4
      const spread = Math.sin(phase * 20 + t * 0.5 + s * 4) * 2 * s
      const trailY = -0.5 + Math.cos(phase * 8 + t * 0.3) * 0.5 * s
      const hide = s > 0.05 ? 1 : 0
      pos[i * 3] = spread * hide
      pos[i * 3 + 1] = trailY * hide + (1 - hide) * 999
      pos[i * 3 + 2] = trailZ * hide
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
    return geo
  }, [])

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.1} color="#10b981" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

// ─── Sport Icons ────────────────────────────────────────────
function SportIcons({ scrollProgress = 0 }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const meshes = useRef<(THREE.Mesh | null)[]>([])

  const icons = [
    { geo: new THREE.IcosahedronGeometry(0.2, 0), color: "#10b981", label: "ball" },
    { geo: new THREE.BoxGeometry(0.2, 0.2, 0.2), color: "#34d399", label: "cube" },
    { geo: new THREE.CylinderGeometry(0.12, 0.12, 0.25, 6), color: "#6ee7b7", label: "hex" },
    { geo: new THREE.TorusGeometry(0.15, 0.05, 8, 12), color: "#059669", label: "ring" },
    { geo: new THREE.ConeGeometry(0.15, 0.25, 5), color: "#10b981", label: "cone" },
  ]

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    const s = scrollProgress
    groupRef.current.position.y = -1 - s * 2
    groupRef.current.position.z = -3 - s * 4

    meshes.current.forEach((mesh, i) => {
      if (!mesh) return
      const phase = i * 1.2
      mesh.rotation.x = t * 0.5 + phase + s
      mesh.rotation.y = t * 0.8 + phase + s * 1.5
      const floatY = Math.sin(t * 0.6 + phase + s * 2) * 0.3
      mesh.position.y = floatY
      mesh.position.x = (i - 2) * 1.8
    })
  })

  return (
    <group ref={groupRef}>
      {icons.map((icon, i) => (
        <mesh
          key={i}
          ref={(el) => { meshes.current[i] = el }}
          position={[(i - 2) * 1.8, 0, 0]}
          geometry={icon.geo}
        >
          <MeshDistortMaterial
            color={icon.color}
            roughness={0.2}
            metalness={0.6}
            distort={0.1}
            speed={1}
            emissive={icon.color}
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─── Burst Particles ──────────────────────────────────────────
function BurstParticles({ scrollProgress = 0 }: { scrollProgress: number }) {
  const count = 200
  const ref = useRef<THREE.Points>(null)
  const posArray = useMemo(() => new Float32Array(count * 3), [])
  const velocities = useMemo(() =>
    Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2, z: (Math.random() - 0.5) * 0.2 })),
  [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
    return geo
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    const s = scrollProgress
    const t = state.clock.getElapsedTime()

    for (let i = 0; i < count; i++) {
      const spread = s * 4
      const drift = t * 0.5 + i * 0.1
      pos[i * 3] = Math.sin(drift + s * 4) * spread + velocities[i].x * s * 3
      pos[i * 3 + 1] = Math.cos(drift * 0.7 + s * 3) * spread * 0.6 + velocities[i].y * s * 3
      pos[i * 3 + 2] = Math.sin(drift * 0.5 + s * 2) * spread * 0.3 - 2 - s * 2
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.08} color="#10b981" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

// ─── Ambient Particles ──────────────────────────────────────
function AmbientParticles({ mouse, scrollProgress = 0 }: SportsProps) {
  const count = 400
  const posArray = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5
    }
    return pos
  }, [])
  const initialPos = useMemo(() => new Float32Array(posArray), [])

  const ref = useRef<THREE.Points>(null)
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
    return geo
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    const s = scrollProgress
    const pos = ref.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      pos[i3] = initialPos[i3] + Math.sin(t * 0.2 + i * 0.01 + s * 2) * s * 3
      pos[i3 + 1] = initialPos[i3 + 1] + Math.cos(t * 0.15 + i * 0.012 + s * 1.5) * s * 3
    }
    ref.current.geometry.attributes.position.needsUpdate = true

    ref.current.rotation.y = t * 0.015 + (mouse?.x ?? 0) * 0.04 + s * 0.1
    ref.current.rotation.x = Math.sin(t * 0.008) * 0.08 + (mouse?.y ?? 0) * 0.04 + s * 0.06
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.03} color="#10b981" opacity={0.25} transparent sizeAttenuation />
    </points>
  )
}

// ─── Exported Scene ──────────────────────────────────────────
interface HeroSceneProps {
  mouse?: { x: number; y: number }
  scrollProgress?: number
}

export function HeroScene({ mouse, scrollProgress = 0 }: HeroSceneProps) {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={["#0a0a0f"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#10b981" />
        <pointLight position={[-10, -10, -10]} intensity={0.6} color="#6366f1" />
        <directionalLight position={[0, 5, 5]} intensity={0.5} />

        <AmbientParticles mouse={mouse} scrollProgress={scrollProgress} />
        <BurstParticles scrollProgress={scrollProgress} />

        {/* Shift all 3D objects to the right */}
        <group position={[2.5, 0, 0]}>
          <Field scrollProgress={scrollProgress} />
          <Goal scrollProgress={scrollProgress} />
          <SpeedTrails scrollProgress={scrollProgress} />
          <SportIcons scrollProgress={scrollProgress} />
          <SoccerBall mouse={mouse} scrollProgress={scrollProgress} />
        </group>
      </Canvas>
    </div>
  )
}
