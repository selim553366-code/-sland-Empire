import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Island as IslandType, Building, Creature, Ship } from '../../types';

interface IslandProps {
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

export function Island({ 
  island, onPlaceBuilding, isPlacing, onUpdateCreatureRole, 
  onSelectShip, onSelectBuilding, onSelectTargetIsland, 
  selectedShipId, selectedSiloId, activeMissiles 
}: IslandProps) {
  const [hoverPos, setHoverPos] = useState<[number, number] | null>(null);
  const { ships = [] } = island;

  const isShip = (type: string) => ['merchant', 'explorer', 'warship', 'tank'].includes(type);

  const handlePointerMove = (e: any) => {
    if (!isPlacing) return;
    e.stopPropagation();
    const point = e.point;
    setHoverPos([Math.round(point.x), Math.round(point.z)]);
  };

  const handlePointerDown = (e: any) => {
    if (!isPlacing) return;
    e.stopPropagation();
    const point = e.point;
    onPlaceBuilding(isPlacing, Math.round(point.x), Math.round(point.z));
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (isPlacing) {
      const point = e.point;
      onPlaceBuilding(isPlacing, Math.round(point.x), Math.round(point.z));
    } else if (selectedShipId || selectedSiloId) {
      onSelectTargetIsland?.(island.id);
    }
  };

  return (
    <group>
      {/* Island Base - Sand Layer */}
      <mesh receiveShadow position={[0, -0.2, 0]} onPointerDown={handleClick}>
        <cylinderGeometry args={[16, 17, 0.8, 32]} />
        <meshStandardMaterial color="#e6d5ac" roughness={0.9} />
      </mesh>

      {/* Island Base - Grass Layer */}
      <mesh 
        receiveShadow 
        position={[0, 0.2, 0]}
        onPointerMove={handlePointerMove}
        onPointerOut={() => setHoverPos(null)}
        onPointerDown={handleClick}
      >
        <cylinderGeometry args={[15, 15.5, 0.5, 32]} />
        <meshStandardMaterial color="#4d7c0f" roughness={0.8} />
      </mesh>

      {/* Grid Helper (only when placing) */}
      {isPlacing && (
        <gridHelper args={[30, 30, '#ffffff', '#444444']} position={[0, 0.46, 0]} />
      )}

      {/* Buildings */}
      {island.buildings.map((b) => (
        <BuildingMesh key={b.id} building={b} onSelect={onSelectBuilding} isPlacing={!!isPlacing} />
      ))}

      {/* Trees (Forest) */}
      {island.trees?.map((t) => (
        <TreeMesh key={t.id} tree={t} />
      ))}

      {/* Creatures */}
      {island.creatures?.map((c) => (
        <CreatureMesh key={c.id} creature={c} onUpdateRole={onUpdateCreatureRole} isPlacing={!!isPlacing} />
      ))}

      {/* Ships */}
      {ships.map((s) => (
        <ShipMesh key={s.id} ship={s} onSelect={onSelectShip} isPlacing={!!isPlacing} />
      ))}

      {/* Recent Events (Floating Text) */}
      {island?.recentEvents?.map((event: any) => (
        <FloatingEvent key={event.id} event={event} />
      ))}

      {/* Active Missiles */}
      {activeMissiles?.map((m) => (
        <MissileMesh key={m.id} missile={m} />
      ))}

      {/* Placement Ghost */}
      {isPlacing && hoverPos && (
        <group position={[hoverPos[0], isShip(isPlacing) ? -0.5 : 0, hoverPos[1]]}>
          {isShip(isPlacing) ? (
            <group>
              {/* Port Ghost at clicked location */}
              <BuildingMesh building={{ id: 'ghost-base', type: 'port', x: 0, y: 0, progress: 100, level: 1, health: 500, maxHealth: 500 }} isGhost />
              {/* Ship Ghost at offset location */}
              {(() => {
                const dist = Math.sqrt(hoverPos[0]**2 + hoverPos[1]**2) || 1;
                const pushX = (hoverPos[0] / dist) * 20;
                const pushY = (hoverPos[1] / dist) * 20;
                return (
                  <group position={[pushX, 0, pushY]}>
                    <ShipMesh ship={{ id: 'ghost-ship', type: isPlacing as any, x: 0, y: 0, cargo: {}, status: 'idle', health: 100, maxHealth: 100, attackPower: 0, weaponType: 'none' }} isGhost />
                  </group>
                );
              })()}
            </group>
          ) : (
            <BuildingMesh building={{ id: 'ghost', type: isPlacing === 'missile' ? 'missile_silo' : isPlacing as any, x: 0, y: 0, progress: 100, level: 1, health: 500, maxHealth: 500 }} isGhost />
          )}
        </group>
      )}

      {/* Water */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.5, 0]} 
        receiveShadow
        onPointerMove={handlePointerMove}
        onPointerOut={() => setHoverPos(null)}
        onPointerDown={handleClick}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#0077be" roughness={0.1} metalness={0.2} transparent opacity={0.8} />
      </mesh>

      {/* Island Label */}
      <Text
        position={[0, 5, -18]}
        fontSize={1.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {island.ownerName}'s Empire
      </Text>
    </group>
  );
}

function TreeMesh({ tree }: { tree: any }) {
  const color = tree.type === 'palm' ? '#228b22' : tree.type === 'pine' ? '#006400' : '#32cd32';
  return (
    <group position={[tree.x, 0.2, tree.y]}>
      {/* Trunk */}
      <Cylinder args={[0.1, 0.15, 1, 8]} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color="#8b4513" />
      </Cylinder>
      
      {/* Leaves */}
      {tree.type === 'pine' ? (
        <group position={[0, 1.2, 0]}>
          <Cylinder args={[0, 0.6, 1, 8]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color={color} />
          </Cylinder>
          <Cylinder args={[0, 0.4, 0.8, 8]} position={[0, 0.5, 0]} castShadow>
            <meshStandardMaterial color={color} />
          </Cylinder>
        </group>
      ) : tree.type === 'palm' ? (
        <group position={[0, 1, 0]}>
          {[...Array(5)].map((_, i) => (
            <Box 
              key={i} 
              args={[1.2, 0.05, 0.3]} 
              position={[0, 0, 0]} 
              rotation={[0, (i * Math.PI * 2) / 5, 0.3]} 
              castShadow
            >
              <meshStandardMaterial color={color} />
            </Box>
          ))}
        </group>
      ) : (
        <Sphere args={[0.6, 12, 12]} position={[0, 1.3, 0]} castShadow>
          <meshStandardMaterial color={color} />
        </Sphere>
      )}
    </group>
  );
}

function CreatureMesh({ creature, onUpdateRole, isPlacing }: { creature: Creature, onUpdateRole: (id: string, role: Creature['role']) => void, isPlacing: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [pos, setPos] = useState(new THREE.Vector3(creature.x, 0.5, creature.y));
  
  const color = {
    human: '#ffdbac',
    beast: '#8b4513',
    robot: '#708090',
    cyborg: '#4682b4',
    spirit: '#00ffff',
    alien: '#32cd32'
  }[creature.type] || '#ffffff';

  const handleClick = (e: any) => {
    if (isPlacing) return;
    e.stopPropagation();
    const roles: Creature['role'][] = ['worker', 'soldier', 'scientist', 'farmer', 'politician', 'artist', 'miner'];
    const currentIndex = roles.indexOf(creature.role);
    const nextRole = roles[(currentIndex + 1) % roles.length];
    onUpdateRole(creature.id, nextRole);
  };

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Target position from props (synced from server)
      const syncPos = new THREE.Vector3(creature.x, 0.5, creature.y);
      
      // Always lerp towards the server's position to prevent stuttering
      groupRef.current.position.lerp(syncPos, 0.05);

      // Hide creature if it's a soldier or scientist working inside a building
      const isInside = creature.state === 'working' && 
        (creature.role === 'soldier' || creature.role === 'scientist') &&
        creature.targetX !== undefined && creature.targetY !== undefined &&
        Math.abs(creature.x - creature.targetX) < 1.5 && 
        Math.abs(creature.y - creature.targetY) < 1.5;

      groupRef.current.visible = !isInside;

      // Look in the direction of movement if moving
      if (creature.state === 'moving' && creature.targetX !== undefined && creature.targetY !== undefined) {
        const targetPos = new THREE.Vector3(creature.targetX, 0.5, creature.targetY);
        const lookTarget = targetPos.clone();
        lookTarget.y = groupRef.current.position.y;
        
        // Only look at target if we're not already very close to it
        if (groupRef.current.position.distanceTo(targetPos) > 0.5) {
          // Smooth rotation towards target
          const currentRotation = groupRef.current.rotation.clone();
          groupRef.current.lookAt(lookTarget);
          const targetRotation = groupRef.current.rotation.clone();
          groupRef.current.rotation.copy(currentRotation);
          
          groupRef.current.quaternion.slerp(
            new THREE.Quaternion().setFromEuler(targetRotation),
            0.1
          );
        }
      }
      
      // Floating animation
      if (groupRef.current.visible) {
        groupRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2 + creature.id.length) * 0.05;
      }
    }
  });

  return (
    <group ref={groupRef} position={[creature.x, 0.5, creature.y]} onClick={handleClick}>
      {creature.type === 'spirit' ? (
        <Sphere args={[0.3, 16, 16]} castShadow>
          <meshStandardMaterial color={color} transparent opacity={0.6} emissive={color} emissiveIntensity={2} />
        </Sphere>
      ) : (
        <>
          <Cylinder args={[0.2, 0.2, 0.8, 8]} castShadow>
            <meshStandardMaterial color={color} roughness={0.5} />
          </Cylinder>
          <Sphere args={[0.15, 8, 8]} position={[0, 0.6, 0]} castShadow>
            <meshStandardMaterial color={color} roughness={0.5} />
          </Sphere>
        </>
      )}
      
      {/* Role Label */}
      <Billboard position={[0, 1.2, 0]}>
        <Text
          fontSize={0.2}
          color="white"
          outlineWidth={0.02}
          outlineColor="black"
        >
          {creature.role}
        </Text>
      </Billboard>
    </group>
  );
}

function BuildingMesh({ building, isGhost = false, onSelect, isPlacing }: { building: Building, isGhost?: boolean, onSelect?: (id: string, type: string) => void, isPlacing?: boolean }) {
  // Building evolution based on progress and potentially tech level
  const isEvolved = building.progress >= 100;
  const health = building.health ?? 500;
  const maxHealth = building.maxHealth ?? 500;
  const healthPercent = isNaN(health / maxHealth) ? 1 : health / maxHealth;
  const progress = isNaN(building.progress) ? 0 : building.progress;
  
  const color = {
    house: '#d2b48c',
    farm: '#ffd700',
    mine: '#708090',
    storage: '#4682b4',
    lab: '#9370db',
    oil_rig: '#2f4f4f',
    factory: '#555555',
    university: '#4169e1',
    hospital: '#ffffff',
    bank: '#ffd700',
    missile_silo: '#8b0000',
    navy_base: '#4682b4',
    port: '#8b4513',
    defense_tower: '#555555'
  }[building.type] || '#ffffff';

  const materialProps = isGhost ? { transparent: true, opacity: 0.5 } : {};

  return (
    <group 
      position={[building.x, 0.5, building.y]} 
      scale={isEvolved ? 1.2 : 1}
      onClick={(e) => {
        if (isGhost || isPlacing) return;
        e.stopPropagation();
        onSelect?.(building.id, building.type);
      }}
    >
      {building.type === 'house' && (
        <group>
          <Box args={[1, 1, 1]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color={color} roughness={0.4} {...materialProps} />
          </Box>
          <Box args={[1.2, 0.5, 1.2]} position={[0, 0.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color={isEvolved ? "#5c3317" : "#8b4513"} roughness={0.6} {...materialProps} />
          </Box>
          {isEvolved && (
            <Box args={[0.3, 0.6, 0.3]} position={[0.3, 0.8, 0.3]} castShadow={!isGhost}>
              <meshStandardMaterial color="#333" {...materialProps} />
            </Box>
          )}
        </group>
      )}
      {building.type === 'farm' && (
        <group>
          <Box args={[1.5, 0.2, 1.5]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color="#3d2b1f" {...materialProps} />
          </Box>
          {[...Array(4)].map((_, i) => (
            <Box key={i} args={[0.2, 0.4, 0.2]} position={[(i % 2 - 0.5) * 0.8, 0.2, (Math.floor(i / 2) - 0.5) * 0.8]} castShadow={!isGhost}>
              <meshStandardMaterial color={color} {...materialProps} />
            </Box>
          ))}
        </group>
      )}
      {building.type === 'mine' && (
        <group>
          <Cylinder args={[0.5, 0.7, 1.5, 8]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} {...materialProps} />
          </Cylinder>
          <Box args={[0.8, 0.2, 0.8]} position={[0, 0.8, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#333" {...materialProps} />
          </Box>
        </group>
      )}
      {building.type === 'storage' && (
        <Box args={[1.2, 1.5, 1.2]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <meshStandardMaterial color={color} roughness={0.8} {...materialProps} />
        </Box>
      )}
      {building.type === 'lab' && (
        <group>
          <Cylinder args={[0.8, 0.8, 1.5, 16]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} {...materialProps} />
          </Cylinder>
          <Sphere args={[0.6, 16, 16]} position={[0, 1, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#00ffff" transparent opacity={isGhost ? 0.3 : 0.6} emissive="#00ffff" emissiveIntensity={0.5} />
          </Sphere>
        </group>
      )}
      {building.type === 'oil_rig' && (
        <group>
          <Box args={[2, 0.5, 2]} position={[0, -0.2, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color="#111" metalness={0.9} {...materialProps} />
          </Box>
          <Cylinder args={[0.1, 0.1, 4, 8]} position={[0, 2, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#444" metalness={0.8} {...materialProps} />
          </Cylinder>
          <Box args={[1, 1, 1]} position={[0, 0.5, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#222" {...materialProps} />
          </Box>
        </group>
      )}
      {building.type === 'factory' && (
        <group>
          <Box args={[2, 1.5, 1.5]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color={color} metalness={0.6} {...materialProps} />
          </Box>
          <Cylinder args={[0.3, 0.3, 2, 8]} position={[0.5, 1.5, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#333" {...materialProps} />
          </Cylinder>
          <Cylinder args={[0.3, 0.3, 2, 8]} position={[-0.5, 1.5, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#333" {...materialProps} />
          </Cylinder>
        </group>
      )}
      {building.type === 'university' && (
        <group>
          <Box args={[2.5, 2, 2]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color={color} roughness={0.3} {...materialProps} />
          </Box>
          <Box args={[1, 0.5, 1]} position={[0, 1.25, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#fff" {...materialProps} />
          </Box>
        </group>
      )}
      {building.type === 'hospital' && (
        <group>
          <Box args={[2, 1.5, 2]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color={color} roughness={0.1} {...materialProps} />
          </Box>
          <Box args={[0.2, 1, 0.2]} position={[0, 0.5, 1.01]} castShadow={!isGhost}>
            <meshStandardMaterial color="red" {...materialProps} />
          </Box>
          <Box args={[1, 0.2, 0.2]} position={[0, 0.5, 1.01]} castShadow={!isGhost}>
            <meshStandardMaterial color="red" {...materialProps} />
          </Box>
        </group>
      )}
      {building.type === 'bank' && (
        <group>
          <Box args={[2, 2.5, 2]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} {...materialProps} />
          </Box>
          <Box args={[2.2, 0.2, 2.2]} position={[0, 1.3, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#fff" {...materialProps} />
          </Box>
        </group>
      )}
      {building.type === 'missile_silo' && (
        <group>
          <Cylinder args={[1.5, 1.5, 0.5, 32]} position={[0, -0.2, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color="#222" metalness={0.9} {...materialProps} />
          </Cylinder>
          <Cylinder args={[1, 1, 0.2, 32]} position={[0, 0.1, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#000" {...materialProps} />
          </Cylinder>
          <Cylinder args={[0.3, 0.3, 2, 8]} position={[0, 1, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#8b0000" metalness={0.5} {...materialProps} />
          </Cylinder>
        </group>
      )}
      {building.type === 'missile_destroyer' && (
        <group>
          <Box args={[2, 0.5, 2]} position={[0, -0.2, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color="#333" metalness={0.9} {...materialProps} />
          </Box>
          <Cylinder args={[0.2, 0.2, 3, 16]} position={[0, 1.5, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#555" metalness={0.8} {...materialProps} />
          </Cylinder>
          <Sphere args={[0.8, 16, 16]} position={[0, 3, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#00ff00" transparent opacity={isGhost ? 0.3 : 0.6} emissive="#00ff00" emissiveIntensity={0.8} />
          </Sphere>
          <Box args={[1.5, 0.2, 0.2]} position={[0, 2.5, 0]} rotation={[0, 0, Math.PI / 4]} castShadow={!isGhost}>
            <meshStandardMaterial color="#444" {...materialProps} />
          </Box>
          <Box args={[1.5, 0.2, 0.2]} position={[0, 2.5, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow={!isGhost}>
            <meshStandardMaterial color="#444" {...materialProps} />
          </Box>
        </group>
      )}
      {building.type === 'navy_base' && (
        <group>
          <Box args={[3, 1, 3]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color={color} metalness={0.5} {...materialProps} />
          </Box>
          <Cylinder args={[0.5, 0.5, 2, 16]} position={[1, 1, 1]} castShadow={!isGhost}>
            <meshStandardMaterial color="#333" {...materialProps} />
          </Cylinder>
        </group>
      )}
      {building.type === 'port' && (
        <group>
          <Box args={[2, 0.5, 4]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color={color} {...materialProps} />
          </Box>
          <Box args={[0.5, 2, 0.5]} position={[0.5, 1, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#5c3317" {...materialProps} />
          </Box>
        </group>
      )}
      {building.type === 'defense_tower' && (
        <group>
          <Cylinder args={[0.8, 1.2, 3, 8]} castShadow={!isGhost} receiveShadow={!isGhost}>
            <meshStandardMaterial color={color} roughness={0.7} {...materialProps} />
          </Cylinder>
          <Sphere args={[0.5, 16, 16]} position={[0, 1.8, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} {...materialProps} />
          </Sphere>
        </group>
      )}
      
      {/* Progress Indicator */}
      {!isGhost && (
        <Text
          position={[0, 2.2, 0]}
          fontSize={0.3}
          color="white"
        >
          {Math.floor(progress)}%
        </Text>
      )}

      {/* Health Bar */}
      {!isGhost && isEvolved && (
        <group position={[0, 1.8, 0]}>
          <Box args={[1, 0.1, 0.1]}>
            <meshStandardMaterial color="#333" />
          </Box>
          <Box args={[healthPercent, 0.1, 0.11]} position={[(healthPercent - 1) / 2, 0, 0]}>
            <meshStandardMaterial color={healthPercent > 0.5 ? "#22c55e" : healthPercent > 0.2 ? "#eab308" : "#ef4444"} />
          </Box>
        </group>
      )}
    </group>
  );
}

function FloatingEvent({ event }: { event: any }) {
  const groupRef = useRef<THREE.Group>(null);
  const [opacity, setOpacity] = useState(1);
  const startTime = useRef(Date.now());

  useFrame((state, delta) => {
    if (groupRef.current) {
      const age = (Date.now() - startTime.current) / 1000;
      if (age > 3) {
        setOpacity(0);
        return;
      }
      groupRef.current.position.y += delta * 1.5;
      setOpacity(1 - age / 3);
    }
  });

  if (opacity <= 0) return null;

  return (
    <group ref={groupRef} position={[event.x, 2, event.y]}>
      <Text
        fontSize={0.5}
        color="#ffd700"
        anchorX="center"
        anchorY="middle"
        fillOpacity={opacity}
        outlineWidth={0.05}
        outlineColor="black"
      >
        +{event.amount} Euro!
      </Text>
    </group>
  );
}

function ShipMesh({ ship, isGhost, onSelect, isPlacing }: { ship: Ship, isGhost?: boolean, onSelect?: (id: string) => void, isPlacing?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const health = ship.health ?? 500;
  const maxHealth = ship.maxHealth ?? 500;
  const healthPercent = isNaN(health / maxHealth) ? 1 : health / maxHealth;
  
  // Only render if ship is near the island (simplified)
  const isNear = Math.sqrt(ship.x * ship.x + ship.y * ship.y) < 50;
  if (!isNear && !isGhost) return null;

  useFrame((state) => {
    if (groupRef.current && !isGhost) {
      groupRef.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2) * 0.05;
    }
  });

  const color = {
    merchant: '#8b4513',
    explorer: '#ffffff',
    warship: '#2f4f4f',
    tank: '#4b5320'
  }[ship.type] || '#ffffff';

  const materialProps = isGhost ? { transparent: true, opacity: 0.5 } : {};

  return (
    <group 
      ref={groupRef} 
      position={[isGhost ? 0 : ship.x / 5, 0.2, isGhost ? 0 : ship.y / 5]}
      onClick={(e) => {
        if (isGhost || isPlacing) return;
        e.stopPropagation();
        onSelect?.(ship.id);
      }}
    >
      {ship.type === 'tank' ? (
        <group>
          <Box args={[1.5, 0.6, 1]} castShadow={!isGhost}>
            <meshStandardMaterial color={color} metalness={0.6} {...materialProps} />
          </Box>
          <Box args={[0.8, 0.4, 0.8]} position={[0, 0.5, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color={color} metalness={0.6} {...materialProps} />
          </Box>
          <Cylinder args={[0.1, 0.1, 1.2, 8]} position={[0.6, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow={!isGhost}>
            <meshStandardMaterial color="#333" {...materialProps} />
          </Cylinder>
        </group>
      ) : (
        <group>
          <Box args={[1.5, 0.5, 0.8]} castShadow={!isGhost}>
            <meshStandardMaterial color={color} {...materialProps} />
          </Box>
          <Box args={[0.2, 1.5, 0.2]} position={[0, 0.75, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#5c3317" {...materialProps} />
          </Box>
          <Box args={[0.8, 1, 0.1]} position={[0.3, 1, 0]} castShadow={!isGhost}>
            <meshStandardMaterial color="#f5f5f5" {...materialProps} />
          </Box>
        </group>
      )}

      {/* Health Bar */}
      {!isGhost && (
        <group position={[0, 2, 0]}>
          <Box args={[1, 0.1, 0.1]}>
            <meshStandardMaterial color="#333" />
          </Box>
          <Box args={[healthPercent, 0.1, 0.11]} position={[(healthPercent - 1) / 2, 0, 0]}>
            <meshStandardMaterial color={healthPercent > 0.5 ? "#22c55e" : healthPercent > 0.2 ? "#eab308" : "#ef4444"} />
          </Box>
        </group>
      )}
    </group>
  );
}

function MissileMesh({ missile }: { missile: { start: [number, number], end: [number, number], progress: number } }) {
  const x = missile.start[0] + (missile.end[0] - missile.start[0]) * missile.progress;
  const z = missile.start[1] + (missile.end[1] - missile.start[1]) * missile.progress;
  const y = 2 + Math.sin(missile.progress * Math.PI) * 10; // Arc

  return (
    <group position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
      <Cylinder args={[0.1, 0.1, 0.8, 8]}>
        <meshStandardMaterial color="#8b0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </Cylinder>
      <Sphere args={[0.1, 8, 8]} position={[0, 0.4, 0]}>
        <meshStandardMaterial color="#333" />
      </Sphere>
      {/* Trail */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.05, 0.2, 0.4, 8]} />
        <meshStandardMaterial color="#ffa500" transparent opacity={0.6} emissive="#ff4500" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}
