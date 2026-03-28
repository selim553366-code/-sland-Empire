import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Island as IslandType, Building, Creature, Ship } from '../../types';

interface IslandProps {
  island: IslandType;
  onPlaceBuilding: (type: string, x: number, y: number) => void;
  isPlacing: string | null;
  onUpdateCreatureRole: (creatureId: string, newRole: Creature['role']) => void;
}

export function Island({ island, onPlaceBuilding, isPlacing, onUpdateCreatureRole }: IslandProps) {
  const [hoverPos, setHoverPos] = useState<[number, number] | null>(null);
  const { ships = [] } = island;

  const handlePointerMove = (e: any) => {
    if (!isPlacing) return;
    e.stopPropagation();
    const point = e.point;
    setHoverPos([Math.round(point.x), Math.round(point.z)]);
  };

  const handlePointerDown = (e: any) => {
    if (!isPlacing || !hoverPos) return;
    e.stopPropagation();
    onPlaceBuilding(isPlacing, hoverPos[0], hoverPos[1]);
  };

  return (
    <group>
      {/* Island Base - Sand Layer */}
      <mesh receiveShadow position={[0, -0.2, 0]}>
        <cylinderGeometry args={[16, 17, 0.8, 32]} />
        <meshStandardMaterial color="#e6d5ac" roughness={0.9} />
      </mesh>

      {/* Island Base - Grass Layer */}
      <mesh 
        receiveShadow 
        position={[0, 0.2, 0]}
        onPointerMove={handlePointerMove}
        onPointerOut={() => setHoverPos(null)}
        onPointerDown={handlePointerDown}
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
        <BuildingMesh key={b.id} building={b} />
      ))}

      {/* Trees (Forest) */}
      {island.trees?.map((t) => (
        <TreeMesh key={t.id} tree={t} />
      ))}

      {/* Creatures */}
      {island.creatures?.map((c) => (
        <CreatureMesh key={c.id} creature={c} onUpdateRole={onUpdateCreatureRole} />
      ))}

      {/* Ships */}
      {ships.map((s) => (
        <ShipMesh key={s.id} ship={s} />
      ))}

      {/* Recent Events (Floating Text) */}
      {island?.recentEvents?.map((event: any) => (
        <FloatingEvent key={event.id} event={event} />
      ))}

      {/* Placement Ghost */}
      {isPlacing && hoverPos && (
        <group position={[hoverPos[0], 0.5, hoverPos[1]]}>
          <Box args={[1, 1, 1]}>
            <meshStandardMaterial color="white" transparent opacity={0.5} />
          </Box>
        </group>
      )}

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

function CreatureMesh({ creature, onUpdateRole }: { creature: Creature, onUpdateRole: (id: string, role: Creature['role']) => void }) {
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

  const handlePointerDown = (e: any) => {
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
      
      // If we have a target, move towards it smoothly
      if (creature.state === 'moving' && creature.targetX !== undefined && creature.targetY !== undefined) {
        const targetPos = new THREE.Vector3(creature.targetX, 0.5, creature.targetY);
        const direction = targetPos.clone().sub(groupRef.current.position);
        direction.y = 0;
        const dist = direction.length();
        
        if (dist > 0.1) {
          direction.normalize();
          groupRef.current.position.add(direction.multiplyScalar(delta * 2)); // Speed of 2 units/sec
          
          // Look at target
          const lookTarget = targetPos.clone();
          lookTarget.y = groupRef.current.position.y;
          groupRef.current.lookAt(lookTarget);
        } else {
          groupRef.current.position.lerp(syncPos, 0.1);
        }
      } else {
        // Just lerp to sync position if idle or working
        groupRef.current.position.lerp(syncPos, 0.1);
        groupRef.current.rotation.y += 0.01;
      }
      
      // Floating animation
      groupRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2 + creature.id.length) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[creature.x, 0.5, creature.y]} onPointerDown={handlePointerDown}>
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
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.2}
        color="white"
        outlineWidth={0.02}
        outlineColor="black"
      >
        {creature.role}
      </Text>
    </group>
  );
}

function BuildingMesh({ building }: { building: Building }) {
  // Building evolution based on progress and potentially tech level
  const isEvolved = building.progress >= 100;
  const healthPercent = (building.health || 500) / (building.maxHealth || 500);
  
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
    missile_silo: '#8b0000'
  }[building.type] || '#ffffff';

  return (
    <group position={[building.x, 0.5, building.y]} scale={isEvolved ? 1.2 : 1}>
      {building.type === 'house' && (
        <group>
          <Box args={[1, 1, 1]} castShadow receiveShadow>
            <meshStandardMaterial color={color} roughness={0.4} />
          </Box>
          <Box args={[1.2, 0.5, 1.2]} position={[0, 0.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <meshStandardMaterial color={isEvolved ? "#5c3317" : "#8b4513"} roughness={0.6} />
          </Box>
          {isEvolved && (
            <Box args={[0.3, 0.6, 0.3]} position={[0.3, 0.8, 0.3]} castShadow>
              <meshStandardMaterial color="#333" />
            </Box>
          )}
        </group>
      )}
      {building.type === 'farm' && (
        <group>
          <Box args={[1.5, 0.2, 1.5]} castShadow receiveShadow>
            <meshStandardMaterial color="#3d2b1f" />
          </Box>
          {[...Array(4)].map((_, i) => (
            <Box key={i} args={[0.2, 0.4, 0.2]} position={[(i % 2 - 0.5) * 0.8, 0.2, (Math.floor(i / 2) - 0.5) * 0.8]} castShadow>
              <meshStandardMaterial color={color} />
            </Box>
          ))}
        </group>
      )}
      {building.type === 'mine' && (
        <group>
          <Cylinder args={[0.5, 0.7, 1.5, 8]} castShadow receiveShadow>
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
          </Cylinder>
          <Box args={[0.8, 0.2, 0.8]} position={[0, 0.8, 0]} castShadow>
            <meshStandardMaterial color="#333" />
          </Box>
        </group>
      )}
      {building.type === 'storage' && (
        <Box args={[1.2, 1.5, 1.2]} castShadow receiveShadow>
          <meshStandardMaterial color={color} roughness={0.8} />
        </Box>
      )}
      {building.type === 'lab' && (
        <group>
          <Cylinder args={[0.8, 0.8, 1.5, 16]} castShadow receiveShadow>
            <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
          </Cylinder>
          <Sphere args={[0.6, 16, 16]} position={[0, 1, 0]} castShadow>
            <meshStandardMaterial color="#00ffff" transparent opacity={0.6} emissive="#00ffff" emissiveIntensity={0.5} />
          </Sphere>
        </group>
      )}
      {building.type === 'oil_rig' && (
        <group>
          <Box args={[2, 0.5, 2]} position={[0, -0.2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#111" metalness={0.9} />
          </Box>
          <Cylinder args={[0.1, 0.1, 4, 8]} position={[0, 2, 0]} castShadow>
            <meshStandardMaterial color="#444" metalness={0.8} />
          </Cylinder>
          <Box args={[1, 1, 1]} position={[0, 0.5, 0]} castShadow>
            <meshStandardMaterial color="#222" />
          </Box>
        </group>
      )}
      {building.type === 'factory' && (
        <group>
          <Box args={[2, 1.5, 1.5]} castShadow receiveShadow>
            <meshStandardMaterial color={color} metalness={0.6} />
          </Box>
          <Cylinder args={[0.3, 0.3, 2, 8]} position={[0.5, 1.5, 0]} castShadow>
            <meshStandardMaterial color="#333" />
          </Cylinder>
          <Cylinder args={[0.3, 0.3, 2, 8]} position={[-0.5, 1.5, 0]} castShadow>
            <meshStandardMaterial color="#333" />
          </Cylinder>
        </group>
      )}
      {building.type === 'university' && (
        <group>
          <Box args={[2.5, 2, 2]} castShadow receiveShadow>
            <meshStandardMaterial color={color} roughness={0.3} />
          </Box>
          <Box args={[1, 0.5, 1]} position={[0, 1.25, 0]} castShadow>
            <meshStandardMaterial color="#fff" />
          </Box>
        </group>
      )}
      {building.type === 'hospital' && (
        <group>
          <Box args={[2, 1.5, 2]} castShadow receiveShadow>
            <meshStandardMaterial color={color} roughness={0.1} />
          </Box>
          <Box args={[0.2, 1, 0.2]} position={[0, 0.5, 1.01]} castShadow>
            <meshStandardMaterial color="red" />
          </Box>
          <Box args={[1, 0.2, 0.2]} position={[0, 0.5, 1.01]} castShadow>
            <meshStandardMaterial color="red" />
          </Box>
        </group>
      )}
      {building.type === 'bank' && (
        <group>
          <Box args={[2, 2.5, 2]} castShadow receiveShadow>
            <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
          </Box>
          <Box args={[2.2, 0.2, 2.2]} position={[0, 1.3, 0]} castShadow>
            <meshStandardMaterial color="#fff" />
          </Box>
        </group>
      )}
      {building.type === 'missile_silo' && (
        <group>
          <Cylinder args={[1.5, 1.5, 0.5, 32]} position={[0, -0.2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#222" metalness={0.9} />
          </Cylinder>
          <Cylinder args={[1, 1, 0.2, 32]} position={[0, 0.1, 0]} castShadow>
            <meshStandardMaterial color="#000" />
          </Cylinder>
          <Cylinder args={[0.3, 0.3, 2, 8]} position={[0, 1, 0]} castShadow>
            <meshStandardMaterial color="#8b0000" metalness={0.5} />
          </Cylinder>
        </group>
      )}
      
      {/* Progress Indicator */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.3}
        color="white"
      >
        {Math.floor(building.progress)}%
      </Text>

      {/* Health Bar */}
      {isEvolved && (
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

function ShipMesh({ ship }: { ship: Ship }) {
  const groupRef = useRef<THREE.Group>(null);
  const healthPercent = (ship.health || 500) / (ship.maxHealth || 500);
  
  // Only render if ship is near the island (simplified)
  const isNear = Math.sqrt(ship.x * ship.x + ship.y * ship.y) < 50;
  if (!isNear) return null;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2) * 0.05;
    }
  });

  const color = {
    merchant: '#8b4513',
    explorer: '#ffffff',
    warship: '#2f4f4f'
  }[ship.type] || '#ffffff';

  return (
    <group ref={groupRef} position={[ship.x / 5, 0.2, ship.y / 5]}>
      <Box args={[1.5, 0.5, 0.8]} castShadow>
        <meshStandardMaterial color={color} />
      </Box>
      <Box args={[0.2, 1.5, 0.2]} position={[0, 0.75, 0]} castShadow>
        <meshStandardMaterial color="#5c3317" />
      </Box>
      <Box args={[0.8, 1, 0.1]} position={[0.3, 1, 0]} castShadow>
        <meshStandardMaterial color="#f5f5f5" />
      </Box>

      {/* Health Bar */}
      <group position={[0, 2, 0]}>
        <Box args={[1, 0.1, 0.1]}>
          <meshStandardMaterial color="#333" />
        </Box>
        <Box args={[healthPercent, 0.1, 0.11]} position={[(healthPercent - 1) / 2, 0, 0]}>
          <meshStandardMaterial color={healthPercent > 0.5 ? "#22c55e" : healthPercent > 0.2 ? "#eab308" : "#ef4444"} />
        </Box>
      </group>
    </group>
  );
}
