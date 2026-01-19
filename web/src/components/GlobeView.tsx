import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RadioStation } from '../data/radios';

interface GlobeViewProps {
  radios: RadioStation[];
  onRadioSelect: (radio: RadioStation) => void;
}

interface RadioPointProps {
  position: [number, number, number];
  radio: RadioStation;
  onPress: (radio: RadioStation) => void;
}

function RadioPoint({ position, radio, onPress }: RadioPointProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.005;
      if (hovered) {
        meshRef.current.scale.setScalar(1.2);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={() => onPress(radio)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.015, 12, 12]} />
      <meshStandardMaterial
        color={hovered ? "#ef4444" : "#3b82f6"}
        emissive={hovered ? "#ef4444" : "#3b82f6"}
        emissiveIntensity={hovered ? 0.3 : 0.1}
      />
    </mesh>
  );
}

function Globe({ radios, onRadioSelect }: GlobeViewProps) {
  const radioPoints = useMemo(() => {
    return radios.map((radio) => {
      const phi = (90 - radio.latitude) * (Math.PI / 180);
      const theta = (radio.longitude + 180) * (Math.PI / 180);

      const x = -(Math.sin(phi) * Math.cos(theta));
      const z = Math.sin(phi) * Math.sin(theta);
      const y = Math.cos(phi);

      return {
        position: [x * 1.1, y * 1.1, z * 1.1] as [number, number, number],
        radio
      };
    });
  }, [radios]);

  return (
    <>
      <Sphere args={[1, 64, 64]}>
        <meshStandardMaterial
          color="#4a90e2"
          emissive="#1e3a5f"
          emissiveIntensity={0.1}
          roughness={0.8}
          metalness={0.1}
        />
      </Sphere>

      {radioPoints.map((point) => (
        <RadioPoint
          key={point.radio.id}
          position={point.position}
          radio={point.radio}
          onPress={onRadioSelect}
        />
      ))}

      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        zoomSpeed={0.6}
        panSpeed={0.5}
        rotateSpeed={0.4}
        minDistance={1.5}
        maxDistance={5}
      />
    </>
  );
}

export default function GlobeView({ radios, onRadioSelect }: GlobeViewProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '300px', background: 'transparent' }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Globe radios={radios} onRadioSelect={onRadioSelect} />
      </Canvas>
    </div>
  );
}
