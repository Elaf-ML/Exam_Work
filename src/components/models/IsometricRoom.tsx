import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function IsometricRoom() {
  const groupRef = useRef<THREE.Group>(null!);
  
  // Rotate the room slightly on every frame
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
      console.log(state.scene.children);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[0.4, Math.PI / 4, 0]} scale={1.5}>
      {/* Room floor */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      
      {/* Room walls */}
      <mesh position={[-2, 0.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
      
      <mesh position={[0, 0.5, -2]} receiveShadow>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#5a5a5a" />
      </mesh>
      
      {/* Gaming desk */}
      <mesh position={[0.5, -0.2, -1]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.1, 1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Desk legs */}
      <mesh position={[-0.4, -0.35, -1.4]} castShadow>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshStandardMaterial color="#5D3A1F" />
      </mesh>
      
      <mesh position={[1.4, -0.35, -1.4]} castShadow>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshStandardMaterial color="#5D3A1F" />
      </mesh>
      
      <mesh position={[-0.4, -0.35, -0.6]} castShadow>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshStandardMaterial color="#5D3A1F" />
      </mesh>
      
      <mesh position={[1.4, -0.35, -0.6]} castShadow>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshStandardMaterial color="#5D3A1F" />
      </mesh>
      
      {/* Monitor */}
      <mesh position={[0.5, 0.3, -1.3]} castShadow>
        <boxGeometry args={[1, 0.6, 0.05]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* Monitor screen */}
      <mesh position={[0.5, 0.3, -1.28]} castShadow>
        <boxGeometry args={[0.95, 0.55, 0.01]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Monitor stand */}
      <mesh position={[0.5, 0, -1.25]} castShadow>
        <boxGeometry args={[0.2, 0.3, 0.05]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* Keyboard */}
      <mesh position={[0.5, -0.14, -0.8]} castShadow>
        <boxGeometry args={[0.8, 0.05, 0.3]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Mouse */}
      <mesh position={[1.2, -0.14, -0.8]} castShadow>
        <boxGeometry args={[0.15, 0.03, 0.25]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* Gaming chair */}
      <mesh position={[0.5, -0.15, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshStandardMaterial color="#8B5CF6" />
      </mesh>
      
      {/* Chair back */}
      <mesh position={[0.5, 0.3, 0.3]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.1]} />
        <meshStandardMaterial color="#8B5CF6" />
      </mesh>
      
      {/* Game console on the floor */}
      <mesh position={[-1, -0.4, -1]} castShadow rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.4, 0.1, 0.6]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      
      {/* Game controller */}
      <mesh position={[-1.3, -0.35, -0.7]} castShadow rotation={[0, Math.PI / 5, 0]}>
        <boxGeometry args={[0.3, 0.05, 0.2]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* Gaming poster on wall */}
      <mesh position={[0, 0.7, -1.98]} castShadow>
        <boxGeometry args={[1, 0.7, 0.01]} />
        <meshStandardMaterial color="#FF5733" />
      </mesh>
      
      {/* RGB LED strip along ceiling */}
      <mesh position={[-1.98, 1.48, -1.98]} castShadow>
        <boxGeometry args={[0.02, 0.02, 4]} />
        <meshStandardMaterial color="#FF00FF" emissive="#FF00FF" emissiveIntensity={1} />
      </mesh>
      
      <mesh position={[0, 1.48, -1.98]} castShadow>
        <boxGeometry args={[4, 0.02, 0.02]} />
        <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={1} />
      </mesh>
      
      {/* Shelf with gaming collectibles */}
      <mesh position={[-1.5, 0.5, -1.5]} castShadow>
        <boxGeometry args={[1, 0.05, 0.3]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Gaming figures on shelf */}
      <mesh position={[-1.7, 0.6, -1.5]} castShadow>
        <boxGeometry args={[0.1, 0.15, 0.1]} />
        <meshStandardMaterial color="#FF5733" />
      </mesh>
      
      <mesh position={[-1.5, 0.6, -1.5]} castShadow>
        <boxGeometry args={[0.15, 0.2, 0.15]} />
        <meshStandardMaterial color="#33FF57" />
      </mesh>
      
      <mesh position={[-1.3, 0.6, -1.5]} castShadow>
        <boxGeometry args={[0.1, 0.15, 0.1]} />
        <meshStandardMaterial color="#3357FF" />
      </mesh>
    </group>
  );
}

export default IsometricRoom; 