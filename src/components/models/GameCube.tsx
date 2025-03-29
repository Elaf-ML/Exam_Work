import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const games = [
  { name: 'Tic Tac Toe', color: '#FF4560' },
  { name: 'Snake', color: '#00E396' },
  { name: 'Memory', color: '#008FFB' },
  { name: 'Tetris', color: '#FEB019' },
  { name: 'Pong', color: '#775DD0' },
  { name: 'GamesHub', color: '#8B5CF6' },
];

export function GameCube() {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  // Rotate the cube slowly on each frame
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
      console.log(state.scene.children);
    }
  });
  
  return (
    <group>
      <mesh ref={meshRef} scale={1.5}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color={games[0].color} metalness={0.5} roughness={0.2} />
      </mesh>
      
      {/* Create individual faces with text */}
      <group ref={meshRef}>
        {/* Front Face */}
        <mesh position={[0, 0, 1.01]} scale={1.5}>
          <planeGeometry args={[2, 2]} />
          <meshStandardMaterial color={games[0].color} metalness={0.5} roughness={0.2} />
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.3}
            color="white"
            font="https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2"
            anchorX="center"
            anchorY="middle"
          >
            {games[0].name}
          </Text>
        </mesh>
        
        {/* Back Face */}
        <mesh position={[0, 0, -1.01]} rotation={[0, Math.PI, 0]} scale={1.5}>
          <planeGeometry args={[2, 2]} />
          <meshStandardMaterial color={games[1].color} metalness={0.5} roughness={0.2} />
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.3}
            color="white"
            font="https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2"
            anchorX="center"
            anchorY="middle"
          >
            {games[1].name}
          </Text>
        </mesh>
        
        {/* Top Face */}
        <mesh position={[0, 1.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={1.5}>
          <planeGeometry args={[2, 2]} />
          <meshStandardMaterial color={games[2].color} metalness={0.5} roughness={0.2} />
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.3}
            color="white"
            font="https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2"
            anchorX="center"
            anchorY="middle"
          >
            {games[2].name}
          </Text>
        </mesh>
        
        {/* Bottom Face */}
        <mesh position={[0, -1.01, 0]} rotation={[Math.PI / 2, 0, 0]} scale={1.5}>
          <planeGeometry args={[2, 2]} />
          <meshStandardMaterial color={games[3].color} metalness={0.5} roughness={0.2} />
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.3}
            color="white"
            font="https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2"
            anchorX="center"
            anchorY="middle"
          >
            {games[3].name}
          </Text>
        </mesh>
        
        {/* Right Face */}
        <mesh position={[1.01, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={1.5}>
          <planeGeometry args={[2, 2]} />
          <meshStandardMaterial color={games[4].color} metalness={0.5} roughness={0.2} />
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.3}
            color="white"
            font="https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2"
            anchorX="center"
            anchorY="middle"
          >
            {games[4].name}
          </Text>
        </mesh>
        
        {/* Left Face */}
        <mesh position={[-1.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]} scale={1.5}>
          <planeGeometry args={[2, 2]} />
          <meshStandardMaterial color={games[5].color} metalness={0.5} roughness={0.2} />
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.3}
            color="white"
            font="https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2"
            anchorX="center"
            anchorY="middle"
          >
            {games[5].name}
          </Text>
        </mesh>
      </group>
    </group>
  );
}

export default GameCube; 