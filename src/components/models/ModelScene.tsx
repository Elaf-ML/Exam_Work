import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Text, Sphere } from '@react-three/drei';
import GameConsole from './GameConsole';
import GameCube from './GameCube';
import IsometricRoom from './IsometricRoom';
import EnhancedRoom from './EnhancedRoom';

interface ModelSceneProps {
  modelType?: 'console' | 'cube' | 'text' | 'isometric' | 'enhanced';
  height?: string;
  autoRotate?: boolean;
  background?: string;
  title?: string; 
  text?: string;
}

export function ModelScene({ 
  modelType = 'console', 
  height = '400px',
  autoRotate = true,
  background = '#111',
  title = modelType === 'enhanced' ? 'Interactive Gaming Room' :
          modelType === 'isometric' ? 'Isometric Gaming Room' : 
          modelType === 'text' ? '3D Text' : 
          modelType === 'console' ? 'Arcade Cabinet' : '3D Game Cube',
  text = 'Games is Joy'
}: ModelSceneProps) {
  return (
    <div className="flex flex-col items-center">
      <h3 className="text-xl font-bold text-primary mb-2">{title}</h3>
      <div style={{ height, width: '100%', border: '1px solid #8B5CF6' }}>
        <Canvas shadows dpr={[1, 2]} style={{ background }}>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={40} />
          <color attach="background" args={['#111']} />
          
          {/* Debug grid to show 3D space is working */}
          <gridHelper args={[10, 10, '#444', '#222']} />
          
          {/* Stronger light setup */}
          <ambientLight intensity={1.0} />
          <spotLight position={[5, 5, 5]} angle={0.15} penumbra={1} intensity={2} castShadow />
          <directionalLight position={[-5, 5, 5]} intensity={1} />
          
          <Suspense fallback={
            <Sphere args={[1]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#8B5CF6" />
            </Sphere>
          }>
            {/* Render the appropriate model based on modelType */}
            {modelType === 'console' && <GameConsole />}
            {modelType === 'cube' && <GameCube />}
            {modelType === 'isometric' && <IsometricRoom />}
            {modelType === 'enhanced' && <EnhancedRoom />}
            {modelType === 'text' && (
              <group position={[0, 0, 0]}>
                <Text
                  position={[0, 0, 0]}
                  fontSize={1.5}
                  color="#8B5CF6"
                  font="https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.05}
                  outlineColor="#ffffff"
                  letterSpacing={0.05}
                >
                  {text}
                </Text>
              </group>
            )}
            <Environment preset="city" />
          </Suspense>
          <OrbitControls 
            autoRotate={autoRotate}
            autoRotateSpeed={1}
            enablePan={false}
            enableZoom={modelType === 'enhanced'}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </div>
      <p className="text-white text-sm mt-2">
        {modelType === 'enhanced'
          ? 'Interactive Gaming Room - Click monitor to turn it on/off, click light switch to toggle lights'
          : modelType === 'isometric' 
            ? 'Interactive Isometric Gaming Room - rotate to view different angles'
            : modelType === 'text' 
              ? 'Interactive 3D Text - rotate to view different angles'
              : modelType === 'console' 
                ? 'Interactive Arcade Cabinet - rotate to view different angles'
                : 'Interactive Game Cube - rotate to view different angles'
        }
      </p>
    </div>
  );
}

export default ModelScene; 