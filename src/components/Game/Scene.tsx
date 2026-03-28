import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Island } from './Island';
import { Island as IslandType, Creature } from '../../types';

interface SceneProps {
  island: IslandType;
  onPlaceBuilding: (type: string, x: number, y: number) => void;
  isPlacing: string | null;
  onUpdateCreatureRole: (creatureId: string, newRole: Creature['role']) => void;
  onSelectShip?: (shipId: string) => void;
  onSelectBuilding?: (buildingId: string, type: string) => void;
  onSelectTargetIsland?: (id: string) => void;
  selectedShipId?: string | null;
  selectedSiloId?: string | null;
  activeMissiles?: { id: string, start: [number, number], end: [number, number], progress: number }[];
}

export function Scene({ 
  island, onPlaceBuilding, isPlacing, onUpdateCreatureRole, 
  onSelectShip, onSelectBuilding, onSelectTargetIsland,
  selectedShipId, selectedSiloId, activeMissiles 
}: SceneProps) {
  return (
    <div className="w-full h-full bg-blue-900">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
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
          onUpdateCreatureRole={onUpdateCreatureRole}
          onSelectShip={onSelectShip}
          onSelectBuilding={onSelectBuilding}
          onSelectTargetIsland={onSelectTargetIsland}
          selectedShipId={selectedShipId}
          selectedSiloId={selectedSiloId}
          activeMissiles={activeMissiles}
        />

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
