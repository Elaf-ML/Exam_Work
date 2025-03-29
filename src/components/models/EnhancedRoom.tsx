import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { 

  Sky,
  Html,
  ContactShadows
} from '@react-three/drei';
import * as THREE from 'three';

export function EnhancedRoom() {
  const groupRef = useRef<THREE.Group>(null!);
  const monitorScreenRef = useRef<THREE.Mesh>(null!);
  const [computerOn, setComputerOn] = useState(false);
  const [lightsOn, setLightsOn] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  
  // Monitor animation - slower rotation for better realism
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle rotation
      groupRef.current.rotation.y += delta * 0.08;
    }
    
    // Monitor screen animation
    if (monitorScreenRef.current && computerOn) {
      const material = monitorScreenRef.current.material as THREE.MeshStandardMaterial;
      // Pulsing screen effect
      material.emissiveIntensity = 0.7 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  // Handle computer power toggle
  const toggleComputer = () => {
    setComputerOn(!computerOn);
  };

  // Handle light toggle
  const toggleLights = () => {
    setLightsOn(!lightsOn);
  };

  return (
    <group ref={groupRef} position={[0, -0.5, 0]} rotation={[0.2, Math.PI / 6, 0]} scale={1.2}>
      {/* Environment and lighting */}
      <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
      
      {/* Lights */}
      {lightsOn && (
        <>
          <pointLight position={[0, 2, 0]} intensity={0.6} color="#ffffff" castShadow />
          <spotLight 
            position={[0, 2, 2]} 
            angle={0.5} 
            penumbra={0.8} 
            intensity={1.2} 
            color="#ffedd5" 
            castShadow 
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-2, 1, -1]} intensity={0.3} color="#8B5CF6" castShadow />
        </>
      )}
      <ambientLight intensity={lightsOn ? 0.4 : 0.1} />
      
      {/* Room floor - larger for more realistic space */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial 
          color="#64574c" 
          roughness={0.9} 
          metalness={0.05}
        />
      </mesh>

      {/* Carpet under the desk */}
      <mesh position={[0, -0.48, -0.9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 4]} />
        <meshStandardMaterial 
          color="#2c1b5a" 
          roughness={1} 
          metalness={0}
        />
      </mesh>
      
      {/* Room walls - more spread out */}
      <mesh position={[-5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial 
          color="#e8e6e1" 
          roughness={0.7} 
          metalness={0}
        />
      </mesh>
      
      <mesh position={[0, 1.5, -5]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial 
          color="#e8e6e1" 
          roughness={0.7} 
          metalness={0}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 3.5, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial 
          color="#f5f5f5" 
          roughness={0.8} 
          metalness={0}
        />
      </mesh>
      
      {/* Gaming desk - properly positioned */}
      <mesh 
        position={[0, 0, -2.5]} 
        castShadow 
        receiveShadow
        onPointerOver={() => setHovered('desk')}
        onPointerOut={() => setHovered(null)}
      >
        <boxGeometry args={[3.5, 0.08, 1.6]} />
        <meshStandardMaterial 
          color="#4a2811" 
          roughness={0.7} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Desk legs - better positioned */}
      {[[-1.6, -0.35, -3.1], [1.6, -0.35, -3.1], [-1.6, -0.35, -1.9], [1.6, -0.35, -1.9]].map((pos, idx) => (
        <mesh key={`leg-${idx}`} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.1, 0.7, 0.1]} />
          <meshStandardMaterial color="#2c1909" roughness={0.6} metalness={0.2} />
        </mesh>
      ))}
      
      {/* Computer Monitor - better positioned */}
      <group 
        position={[0, 0.6, -2.8]}
        onPointerOver={() => setHovered('monitor')}
        onPointerOut={() => setHovered(null)}
        onClick={toggleComputer}
      >
        {/* Monitor frame */}
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.9, 0.08]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
        </mesh>
        
        {/* Monitor screen */}
        <mesh 
          ref={monitorScreenRef} 
          position={[0, 0, 0.045]}
          castShadow
        >
          <planeGeometry args={[1.5, 0.8]} />
          <meshStandardMaterial 
            color={computerOn ? "#2b2b2b" : "#111111"} 
            emissive={computerOn ? "#8B5CF6" : "#000000"} 
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Screen content when on */}
        {computerOn && (
          <Html 
            position={[0, 0, 0.05]} 
            transform 
            scale={0.17}
            occlude
          >
            <div style={{ 
              width: '500px', 
              height: '280px', 
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', 
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              fontFamily: 'sans-serif',
              padding: '20px',
              boxSizing: 'border-box',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
            }}>
              <h2 style={{ margin: '0 0 20px 0', fontWeight: 'bold' }}>GAMESHUB</h2>
              <p style={{ margin: '0', textAlign: 'center' }}>Interactive Gaming Experience</p>
              <div style={{ 
                marginTop: '20px', 
                display: 'flex', 
                gap: '10px'
              }}>
                <div style={{ 
                  padding: '8px 16px', 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>PLAY</div>
                <div style={{ 
                  padding: '8px 16px', 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>LEADERBOARD</div>
              </div>
            </div>
          </Html>
        )}
        
        {/* Monitor stand - better design */}
        <mesh position={[0, -0.5, 0.15]} castShadow>
          <boxGeometry args={[0.3, 0.1, 0.3]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.3, 0.15]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
      
      {/* Keyboard - better positioned */}
      <mesh position={[0, 0.06, -2.2]} castShadow rotation={[0.05, 0, 0]}>
        <boxGeometry args={[1.2, 0.03, 0.4]} />
        <meshStandardMaterial 
          color={computerOn ? "#333333" : "#1a1a1a"} 
          roughness={0.5} 
          metalness={0.5}
          emissive={computerOn ? "#8B5CF6" : "#000000"}
          emissiveIntensity={0.2}
        />
        {/* Keyboard keycaps for more detail */}
        <group position={[0, 0.02, 0]}>
          {Array.from({ length: 6 }).map((_, row) => 
            Array.from({ length: 15 }).map((_, col) => (
              <mesh 
                key={`key-${row}-${col}`} 
                position={[
                  (col - 7) * 0.07, 
                  0, 
                  (row - 2.5) * 0.06
                ]} 
                scale={[0.06, 0.01, 0.05]}
              >
                <boxGeometry />
                <meshStandardMaterial 
                  color={computerOn ? "#222222" : "#111111"} 
                  roughness={0.7}
                />
              </mesh>
            ))
          )}
        </group>
      </mesh>
      
      {/* Mouse - better positioned */}
      <mesh position={[0.8, 0.05, -2.0]} castShadow rotation={[0, -0.2, 0]}>
        <capsuleGeometry args={[0.035, 0.08, 4, 8]} />
        <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.6} />
        {/* Mouse buttons */}
        <mesh position={[0, 0.02, -0.03]} scale={[0.028, 0.01, 0.03]}>
          <boxGeometry />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0, 0.02, 0.03]} scale={[0.028, 0.01, 0.03]}>
          <boxGeometry />
          <meshStandardMaterial color="#111111" />
        </mesh>
      </mesh>
      
      {/* Mouse pad */}
      <mesh position={[0.8, 0.041, -2.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.6]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.9} />
      </mesh>
      
      {/* Improved Gaming chair - completely redesigned */}
      <group 
        position={[0, 0, -0.7]}
        onPointerOver={() => setHovered('chair')}
        onPointerOut={() => setHovered(null)}
      >
        {/* Chair base with wheels */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.4, 0.08, 16]} />
          <meshStandardMaterial color="#111111" roughness={0.4} metalness={0.7} />
        </mesh>
        
        {/* Wheels */}
        {Array.from({ length: 5 }).map((_, idx) => {
          const angle = (idx / 5) * Math.PI * 2;
          return (
            <group key={`wheel-${idx}`} position={[
              Math.sin(angle) * 0.35,
              0.06,
              Math.cos(angle) * 0.35
            ]}>
              <mesh castShadow>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.6} />
              </mesh>
            </group>
          );
        })}
        
        {/* Central chair pole */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 0.7, 8]} />
          <meshStandardMaterial color="#444444" roughness={0.4} metalness={0.7} />
        </mesh>
        
        {/* Chair seat - curved for comfort */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.55, 0.1, 0.5]} />
          <meshStandardMaterial color="#8B5CF6" roughness={0.8} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.85, 0.05]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.55, 0.15, 0.5]} />
          <meshStandardMaterial color="#8B5CF6" roughness={0.8} metalness={0.2} />
        </mesh>
        
        {/* Chair back - curved ergonomic design */}
        <group position={[0, 1.35, -0.25]} rotation={[0.15, 0, 0]}>
          {/* Main back */}
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.8, 0.12]} />
            <meshStandardMaterial color="#8B5CF6" roughness={0.8} metalness={0.2} />
          </mesh>
          
          {/* Lower back cushion */}
          <mesh position={[0, -0.25, 0.07]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.1]} />
            <meshStandardMaterial color="#6d28d9" roughness={0.9} metalness={0.1} />
          </mesh>
          
          {/* Upper back cushion */}
          <mesh position={[0, 0.2, 0.07]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.1]} />
            <meshStandardMaterial color="#6d28d9" roughness={0.9} metalness={0.1} />
          </mesh>
          
          {/* Headrest */}
          <mesh position={[0, 0.5, -0.05]} castShadow>
            <boxGeometry args={[0.5, 0.2, 0.22]} />
            <meshStandardMaterial color="#8B5CF6" roughness={0.8} metalness={0.2} />
          </mesh>
        </group>
        
        {/* Armrests - better positioned */}
        <mesh position={[0.32, 1.1, 0.05]} castShadow>
          <boxGeometry args={[0.08, 0.08, 0.45]} />
          <meshStandardMaterial color="#333333" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[-0.32, 1.1, 0.05]} castShadow>
          <boxGeometry args={[0.08, 0.08, 0.45]} />
          <meshStandardMaterial color="#333333" roughness={0.7} metalness={0.3} />
        </mesh>
        
        {/* Armrest pads */}
        <mesh position={[0.32, 1.16, 0.05]} castShadow>
          <boxGeometry args={[0.12, 0.03, 0.3]} />
          <meshStandardMaterial color="#222222" roughness={0.8} metalness={0.2} />
        </mesh>
        <mesh position={[-0.32, 1.16, 0.05]} castShadow>
          <boxGeometry args={[0.12, 0.03, 0.3]} />
          <meshStandardMaterial color="#222222" roughness={0.8} metalness={0.2} />
        </mesh>
      </group>
      
      {/* Light switch - better positioned */}
      <group 
        position={[-4.97, 1.3, -3.0]} 
        onPointerOver={() => setHovered('switch')}
        onPointerOut={() => setHovered(null)}
        onClick={toggleLights}
      >
        <mesh castShadow>
          <boxGeometry args={[0.05, 0.15, 0.1]} />
          <meshStandardMaterial color="#dddddd" roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.06]} castShadow>
          <boxGeometry args={[0.02, 0.08, 0.02]} />
          <meshStandardMaterial color={lightsOn ? "#aaffaa" : "#ffaaaa"} roughness={0.3} metalness={0.3} />
        </mesh>
      </group>
      
      {/* Gaming console - better positioned */}
      <mesh position={[-1.8, 0.15, -2.2]} rotation={[0, Math.PI / 5, 0]} castShadow>
        <boxGeometry args={[0.5, 0.12, 0.8]} />
        <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.7} />
        
        {/* Console details */}
        <mesh position={[0, 0.065, 0]} scale={[0.48, 0.01, 0.4]}>
          <boxGeometry />
          <meshStandardMaterial color="#222222" />
        </mesh>
        
        {/* Console power button */}
        <mesh position={[0, 0.065, 0.3]} scale={[0.05, 0.015, 0.05]}>
          <cylinderGeometry />
          <meshStandardMaterial color={lightsOn ? "#8B5CF6" : "#444444"} emissive={lightsOn ? "#8B5CF6" : "#000000"} emissiveIntensity={0.5} />
        </mesh>
      </mesh>
      
      {/* Controllers - better positioned */}
      <mesh position={[-1.2, 0.07, -1.9]} rotation={[0, -0.4, 0]} castShadow>
        <boxGeometry args={[0.2, 0.05, 0.14]} />
        <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.5} />
        
        {/* Controller details */}
        <mesh position={[0, 0.03, 0]} scale={[0.1, 0.01, 0.1]}>
          <boxGeometry />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0.05, 0.03, 0.04]} scale={[0.02, 0.01, 0.02]}>
          <boxGeometry />
          <meshStandardMaterial color="red" />
        </mesh>
        <mesh position={[-0.05, 0.03, 0.04]} scale={[0.02, 0.01, 0.02]}>
          <boxGeometry />
          <meshStandardMaterial color="blue" />
        </mesh>
      </mesh>
      
      {/* LED strip - better positioned */}
      <mesh position={[0, 3.45, -4.98]} castShadow>
        <boxGeometry args={[6, 0.03, 0.03]} />
        <meshStandardMaterial 
          color={lightsOn ? "#ffffff" : "#333333"} 
          emissive={lightsOn ? "#8B5CF6" : "#000000"} 
          emissiveIntensity={1} 
        />
      </mesh>
      
      {/* Game posters - better positioned */}
      <mesh position={[-3, 1.8, -4.97]} castShadow>
        <planeGeometry args={[1.6, 2]} />
        <meshStandardMaterial 
          color="#ff7300" 
          roughness={0.8} 
          metalness={0}
          emissive="#ff3700"
          emissiveIntensity={lightsOn ? 0.2 : 0}
        />
        {/* Poster frame */}
        <mesh position={[0, 0, -0.01]} scale={[1.7, 2.1, 0.03]}>
          <boxGeometry />
          <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.2} />
        </mesh>
      </mesh>
      
      <mesh position={[3, 1.8, -4.97]} castShadow>
        <planeGeometry args={[1.6, 2]} />
        <meshStandardMaterial 
          color="#00aaff" 
          roughness={0.8} 
          metalness={0}
          emissive="#0055ff"
          emissiveIntensity={lightsOn ? 0.2 : 0}
        />
        {/* Poster frame */}
        <mesh position={[0, 0, -0.01]} scale={[1.7, 2.1, 0.03]}>
          <boxGeometry />
          <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.2} />
        </mesh>
      </mesh>
      
      {/* Computer tower */}
      <mesh position={[1.9, 0.5, -2.8]} castShadow>
        <boxGeometry args={[0.6, 1, 1.4]} />
        <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.5} />
        
        {/* Front panel */}
        <mesh position={[0.31, 0, 0]} scale={[0.01, 0.95, 1.3]}>
          <boxGeometry />
          <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.7} />
        </mesh>
        
        {/* Power button and LEDs */}
        <mesh position={[0.32, 0.4, 0]} scale={[0.02, 0.05, 0.05]}>
          <boxGeometry />
          <meshStandardMaterial color="#444444" />
        </mesh>
        <mesh position={[0.32, 0.3, 0]} scale={[0.02, 0.01, 0.01]}>
          <boxGeometry />
          <meshStandardMaterial color={computerOn ? "#00ff00" : "#444444"} emissive={computerOn ? "#00ff00" : "#000000"} emissiveIntensity={0.8} />
        </mesh>
        
        {/* Side panel with glass */}
        <mesh position={[0, 0, 0.7]} scale={[0.58, 0.95, 0.01]}>
          <boxGeometry />
          <meshStandardMaterial 
            color="#111111" 
            roughness={0.1} 
            metalness={0.9}
            opacity={0.3}
            transparent={true}
          />
        </mesh>
        
        {/* RGB inside (visible when computer is on) */}
        {computerOn && (
          <pointLight position={[0, 0, 0.5]} intensity={0.5} color="#ff00ff" />
        )}
      </mesh>
      
      {/* Floating tooltips */}
      {hovered === 'monitor' && (
        <Html position={[0, 1.3, -2.8]} center>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'Arial'
          }}>
            {computerOn ? 'Click to turn off' : 'Click to turn on'}
          </div>
        </Html>
      )}
      
      {hovered === 'switch' && (
        <Html position={[-4.97, 1.5, -3.0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'Arial'
          }}>
            {lightsOn ? 'Turn off lights' : 'Turn on lights'}
          </div>
        </Html>
      )}
      
      {/* Contact shadows for better grounding */}
      <ContactShadows
        position={[0, -0.49, 0]}
        opacity={0.6}
        scale={15}
        blur={2.5}
        far={4.5}
        resolution={512}
      />
      
      {/* Audio disabled for now due to autoplay policies
      {computerOn && (
        <PositionalAudio
          url="https://cdn.freesound.org/previews/257/257796_4500427-lq.mp3"
          distance={1.5}
          loop
        />
      )}
      */}
    </group>
  );
}

export default EnhancedRoom; 