import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export function GameConsole() {
  const groupRef = useRef<THREE.Group>(null!);
  
  // Add debug logging
  useEffect(() => {
    console.log('Arcade cabinet model mounted');
    return () => console.log('Arcade cabinet model unmounted');
  }, []);
  
  // Rotate the console slightly on every frame
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
      console.log(state.scene.children);
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]} scale={1.5}>
      {/* Main cabinet body */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2, 3, 1.5]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* Screen */}
      <mesh position={[0, 1.5, 0.76]}>
        <boxGeometry args={[1.6, 1.2, 0.1]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      
      {/* Screen content */}
      <mesh position={[0, 1.5, 0.82]}>
        <boxGeometry args={[1.5, 1.1, 0.01]} />
        <meshStandardMaterial emissive="#8B5CF6" emissiveIntensity={0.8} />
      </mesh>
      
      {/* Game logo/title */}
      <Text
        position={[0, 1.5, 0.83]}
        fontSize={0.15}
        maxWidth={1.4}
        lineHeight={1}
        color="white"
        font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nViI0.woff2"
        anchorX="center"
        anchorY="middle"
      >
        GAMES HUB
      </Text>
      
      {/* Control panel */}
      <mesh position={[0, 0.5, 0.5]} rotation={[Math.PI / 6, 0, 0]}>
        <boxGeometry args={[1.8, 0.8, 0.3]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      
      {/* Joystick */}
      <group position={[-0.5, 0.65, 0.65]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 0.1, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
      
      {/* Buttons */}
      <mesh position={[0.3, 0.65, 0.65]}>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      <mesh position={[0.5, 0.65, 0.65]}>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
        <meshStandardMaterial color="green" />
      </mesh>
      <mesh position={[0.7, 0.65, 0.65]}>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
      
      {/* Cabinet top */}
      <mesh position={[0, 2.6, 0]}>
        <boxGeometry args={[2, 0.2, 1.5]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Marquee with illuminated title */}
      <mesh position={[0, 2.9, 0]}>
        <boxGeometry args={[2, 0.4, 1.5]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[0, 2.9, 0.76]}>
        <boxGeometry args={[1.8, 0.3, 0.05]} />
        <meshStandardMaterial emissive="#FF5733" emissiveIntensity={0.6} />
      </mesh>
      <Text
        position={[0, 2.9, 0.79]}
        fontSize={0.15}
        color="white"
        font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nViI0.woff2"
        anchorX="center"
        anchorY="middle"
      >
        ARCADE
      </Text>
      
      {/* Base/stand */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[2, 0.4, 1.5]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

export default GameConsole; 