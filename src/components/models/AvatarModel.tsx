import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarModelProps {
  name: string;
  color?: string;
}

export function AvatarModel({ name, color = '#8B5CF6' }: AvatarModelProps) {
  const groupRef = useRef<THREE.Group>(null!);
  
  // Get user initials for the avatar
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  // Slightly rotate the avatar on each frame
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
      console.log(state.scene.children);
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh castShadow position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.6} />
        
        {/* Display user initials on avatar */}
        <Text
          position={[0, 0, 1.02]}
          fontSize={0.6}
          color="white"
          font="https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2"
          anchorX="center"
          anchorY="middle"
        >
          {initials}
        </Text>
      </mesh>
      
      {/* Left eye */}
      <mesh position={[-0.3, 0.3, 0.8]} scale={0.12}>
        <sphereGeometry />
        <meshBasicMaterial color="white" />
      </mesh>
      
      {/* Right eye */}
      <mesh position={[0.3, 0.3, 0.8]} scale={0.12}>
        <sphereGeometry />
        <meshBasicMaterial color="white" />
      </mesh>
      
      {/* Left eye pupil */}
      <mesh position={[-0.3, 0.3, 0.9]} scale={0.05}>
        <sphereGeometry />
        <meshBasicMaterial color="black" />
      </mesh>
      
      {/* Right eye pupil */}
      <mesh position={[0.3, 0.3, 0.9]} scale={0.05}>
        <sphereGeometry />
        <meshBasicMaterial color="black" />
      </mesh>
      
      {/* Mouth */}
      <mesh position={[0, -0.1, 0.85]} rotation={[0, 0, 0]} scale={[0.4, 0.1, 0.1]}>
        <boxGeometry />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}

export default AvatarModel; 