import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, Environment } from '@react-three/drei';
import { Island } from './Island';
import { Island as IslandType } from '../../types';

interface SceneProps {
  island: IslandType;
  onPlaceBuilding: (type: string, x: number, y: number) => void;
  isPlacing: string | null;
}

export function Scene({ island, onPlaceBuilding, isPlacing }: SceneProps) {
  return (
    <div className="w-full h-full bg-blue-900">
      <Canvas
        shadows
        camera={{ position: [25, 30, 25], fov: 40 }}
      >
        <Sky sunPosition={[100, 20, 100]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Environment preset="city" />
        
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        <Island 
          island={island} 
          onPlaceBuilding={onPlaceBuilding} 
          isPlacing={isPlacing}
        />

        {/* Water */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#0077be" roughness={0.1} metalness={0.2} transparent opacity={0.8} />
        </mesh>

        <OrbitControls 
          makeDefault 
          minPolarAngle={Math.PI / 6} 
          maxPolarAngle={Math.PI / 2.5}
          minDistance={10}
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
}
