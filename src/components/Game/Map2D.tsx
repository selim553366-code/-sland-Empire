import { useState } from 'react';
import { motion } from 'motion/react';
import { Island, Building, Creature, Ship, Tree } from '../../types';
import { Home, Wheat, Pickaxe, Box, FlaskConical, Droplet, Factory, GraduationCap, Hospital, Landmark, Rocket, Anchor, Shield, Ship as ShipIcon, User, Trees, HelpCircle } from 'lucide-react';

interface Map2DProps {
  island: Island;
  islands: Island[];
  currentIslandId: string;
  onPlaceBuilding: (type: string, x: number, y: number) => void;
  isPlacing: string | null;
  onUpdateCreatureRole: (creatureId: string, newRole: Creature['role']) => void;
  onLaunchMissile: (targetId: string) => void;
  missileCount: number;
  discoveredIslandIds: string[];
  activeMissiles?: { id: string, start: [number, number], end: [number, number], progress: number }[];
}

export function Map2D({ 
  island, islands, currentIslandId, onPlaceBuilding, isPlacing, onUpdateCreatureRole,
  onLaunchMissile, missileCount, discoveredIslandIds, activeMissiles
}: Map2DProps) {
  const [view, setView] = useState<'island' | 'world'>('island');
  const scale = 15; // Pixels per unit
  const size = 32 * scale; // Island diameter is roughly 32 units

  const getBuildingIcon = (type: Building['type']) => {
    switch (type) {
      case 'house': return Home;
      case 'farm': return Wheat;
      case 'mine': return Pickaxe;
      case 'storage': return Box;
      case 'lab': return FlaskConical;
      case 'oil_rig': return Droplet;
      case 'factory': return Factory;
      case 'university': return GraduationCap;
      case 'hospital': return Hospital;
      case 'bank': return Landmark;
      case 'missile_silo': return Rocket;
      case 'navy_base': return Anchor;
      case 'port': return Anchor;
      case 'defense_tower': return Shield;
      default: return Box;
    }
  };

  const getCreatureColor = (type: Creature['type']) => {
    switch (type) {
      case 'human': return 'bg-orange-200';
      case 'beast': return 'bg-amber-900';
      case 'robot': return 'bg-slate-400';
      case 'cyborg': return 'bg-blue-400';
      case 'spirit': return 'bg-cyan-200';
      case 'alien': return 'bg-lime-400';
      default: return 'bg-white';
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!isPlacing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - size / 2) / scale;
    const y = (e.clientY - rect.top - size / 2) / scale;
    onPlaceBuilding(isPlacing, Math.round(x), Math.round(y));
  };

  return (
    <div className="w-full h-full bg-blue-900 flex flex-col items-center justify-center overflow-auto p-20">
      <div className="flex gap-4 mb-4">
        <button onClick={() => setView('island')} className={`px-4 py-2 rounded-full ${view === 'island' ? 'bg-white text-black' : 'bg-black/40 text-white'}`}>Ada Görünümü</button>
        <button onClick={() => setView('world')} className={`px-4 py-2 rounded-full ${view === 'world' ? 'bg-white text-black' : 'bg-black/40 text-white'}`}>Dünya Haritası</button>
      </div>
      
      {view === 'island' ? (
        <div 
          className="relative bg-blue-500 rounded-full shadow-2xl border-8 border-blue-400/30"
          style={{ width: size, height: size }}
          onClick={handleMapClick}
        >
          {/* Grass Layer */}
          <div className="absolute inset-4 bg-emerald-600 rounded-full border-4 border-emerald-500/50 shadow-inner" />

          {/* Grid Lines */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: `${scale}px ${scale}px` }} />

          {/* Trees */}
          {island.trees?.map((tree) => (
            <div 
              key={tree.id}
              className="absolute pointer-events-none"
              style={{ 
                left: size / 2 + tree.x * scale, 
                top: size / 2 + tree.y * scale,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Trees size={12} className="text-emerald-900 opacity-60" />
            </div>
          ))}

          {/* Buildings */}
          {island.buildings.map((building) => {
            const Icon = getBuildingIcon(building.type);
            return (
              <motion.div
                key={building.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute group cursor-pointer"
                style={{ 
                  left: size / 2 + building.x * scale, 
                  top: size / 2 + building.y * scale,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center">
                  <Icon size={16} className="text-white" />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
                  {building.type} (Lv.{building.level})
                </div>
                {/* Health Bar */}
                <div className="absolute top-full left-0 w-full h-1 bg-black/50 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${(building.health / building.maxHealth) * 100}%` }} 
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Creatures */}
          {island.creatures?.map((creature) => (
            <motion.div
              key={creature.id}
              animate={{ 
                left: size / 2 + creature.x * scale, 
                top: size / 2 + creature.y * scale 
              }}
              transition={{ type: 'spring', stiffness: 50, damping: 10 }}
              className={`absolute w-3 h-3 rounded-full border border-black/20 shadow-sm flex items-center justify-center group cursor-pointer ${getCreatureColor(creature.type)}`}
              style={{ transform: 'translate(-50%, -50%)' }}
              onClick={(e) => {
                e.stopPropagation();
                const roles: Creature['role'][] = ['worker', 'soldier', 'scientist', 'farmer', 'politician', 'artist', 'miner'];
                const currentIndex = roles.indexOf(creature.role);
                const nextRole = roles[(currentIndex + 1) % roles.length];
                onUpdateCreatureRole(creature.id, nextRole);
              }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[8px] px-1 rounded whitespace-nowrap z-50">
                {creature.role}
              </div>
            </motion.div>
          ))}

          {/* Ships */}
          {island.ships?.map((ship) => (
            <motion.div
              key={ship.id}
              animate={{ 
                left: size / 2 + (ship.x / 5) * scale, 
                top: size / 2 + (ship.y / 5) * scale 
              }}
              className="absolute group cursor-pointer"
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <div className="p-1 bg-blue-400/30 rounded-full border border-blue-300/50">
                <ShipIcon size={14} className="text-white" />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[8px] px-1 rounded whitespace-nowrap z-50">
                {ship.type}
              </div>
            </motion.div>
          ))}

          {/* Active Missiles */}
          {activeMissiles?.map((m) => {
            const x = m.start[0] + (m.end[0] - m.start[0]) * m.progress;
            const y = m.start[1] + (m.end[1] - m.start[1]) * m.progress;
            return (
              <div
                key={m.id}
                className="absolute w-2 h-2 bg-red-600 rounded-full z-50"
                style={{
                  left: size / 2 + x * scale,
                  top: size / 2 + y * scale,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            );
          })}

          {/* Island Label */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-center">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">{island.ownerName}'s Empire</h2>
            <p className="text-white/60 text-xs uppercase tracking-widest">2D Strategic Map</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-blue-950/30 relative overflow-hidden rounded-full border-8 border-blue-400/30">
          {/* World Map View */}
          {islands.map((island) => {
            const isSelf = island.id === currentIslandId;
            const isDiscovered = discoveredIslandIds.includes(island.id) || isSelf;
            const seed = island.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const x = isSelf ? 0 : (Math.sin(seed) * 160);
            const y = isSelf ? 0 : (Math.cos(seed) * 160);

            return (
              <motion.div
                key={island.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute group flex flex-col items-center"
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
              >
                <button
                  onClick={() => {
                    if (isDiscovered && missileCount > 0) {
                      onLaunchMissile(island.id);
                    }
                  }}
                  className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all shadow-lg ${
                    isSelf 
                      ? 'bg-blue-500 border-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
                      : isDiscovered 
                        ? 'bg-red-500 border-red-300 hover:bg-red-600'
                        : 'bg-gray-700 border-gray-600'
                  } ${isDiscovered ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  {isSelf ? (
                    <Home size={24} className="text-white" />
                  ) : isDiscovered ? (
                    <Rocket size={24} className="text-white" />
                  ) : (
                    <HelpCircle size={24} className="text-gray-400" />
                  )}
                </button>
                <span className="mt-2 text-[11px] font-bold text-white bg-black/60 px-2 py-1 rounded shadow-sm whitespace-nowrap">
                  {isDiscovered ? (island.name || island.ownerName) : 'Bilinmeyen Ada'}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
