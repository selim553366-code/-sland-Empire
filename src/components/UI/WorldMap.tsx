import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { X, Shield, Swords, Rocket, TrendingUp, AlertTriangle, Map as MapIcon, List, Navigation } from 'lucide-react';
import { Island, Ship } from '../../types';

interface WorldMapProps {
  onClose: () => void;
  islands: Island[];
  currentIslandId: string;
  onVisit: (id: string) => void;
  onLaunchMissile: (targetId: string) => void;
  missileCount: number;
  discoveredIslandIds: string[];
  onSendShip: (shipId: string, x: number, y: number) => void;
  ships: Ship[];
}

export function WorldMap({ 
  onClose, islands, currentIslandId, onVisit, onLaunchMissile, 
  missileCount, discoveredIslandIds, onSendShip, ships 
}: WorldMapProps) {
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);

  const worldSize = 200; // -100 to 100
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-8 font-sans"
    >
      <div className="bg-white/5 border border-white/10 rounded-[40px] w-full max-w-5xl h-full flex flex-col overflow-hidden shadow-2xl">
        <div className="p-8 flex justify-between items-center border-bottom border-white/10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">World Archipelago</h2>
            <p className="text-white/50 text-sm">Discover and interact with other island nations</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
              >
                <MapIcon size={20} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
              >
                <List size={20} />
              </button>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-full transition-colors text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {view === 'grid' ? (
            <div className="w-full h-full bg-blue-950/30 relative overflow-hidden">
              {/* Grid Lines */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              
              {/* Islands */}
              {islands.map((island) => {
                const isSelf = island.id === currentIslandId;
                const isDiscovered = discoveredIslandIds.includes(island.id);
                if (!isDiscovered && !isSelf) return null;

                // Simplified world pos
                const x = isSelf ? 0 : (Math.random() - 0.5) * 160;
                const y = isSelf ? 0 : (Math.random() - 0.5) * 160;

                return (
                  <motion.button
                    key={island.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => selectedShipId ? onSendShip(selectedShipId, x, y) : onVisit(island.id)}
                    className="absolute group"
                    style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                  >
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelf ? 'bg-blue-500 border-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-emerald-500 border-emerald-300'
                    } group-hover:scale-110`}>
                      <Shield size={20} className="text-white" />
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] p-2 rounded whitespace-nowrap pointer-events-none z-50">
                      {island.name || island.ownerName + "'s Empire"}
                    </div>
                  </motion.button>
                );
              })}

              {/* Ships */}
              {ships.map((ship) => (
                <motion.div
                  key={ship.id}
                  className={`absolute w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                    selectedShipId === ship.id ? 'bg-yellow-500 border-yellow-300 scale-125 z-50' : 'bg-white/20 border-white/40'
                  }`}
                  style={{ left: `calc(50% + ${ship.x}px)`, top: `calc(50% + ${ship.y}px)` }}
                  onClick={() => setSelectedShipId(ship.id === selectedShipId ? null : ship.id)}
                >
                  <Navigation size={12} className="text-white rotate-45" />
                </motion.div>
              ))}

              {/* Selection UI */}
              <AnimatePresence>
                {selectedShipId && (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-yellow-500/30 text-white flex items-center gap-4"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Ship Selected</span>
                      <span className="text-[10px] text-white/60">Click on the map or an island to send this ship</span>
                    </div>
                    <button 
                      onClick={() => setSelectedShipId(null)}
                      className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-[10px] font-bold"
                    >
                      CANCEL
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {islands.map((island) => {
                const isSelf = island.id === currentIslandId;
                const isDiscovered = discoveredIslandIds.includes(island.id);
                if (!isDiscovered && !isSelf) return null;
                return (
                  <motion.div
                    key={island.id}
                    layoutId={island.id}
                    className={`p-6 rounded-3xl border transition-all ${
                      isSelf ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{island.name || island.ownerName + "'s Empire"}</h3>
                    <p className="text-xs text-white/40 uppercase tracking-widest mt-1">
                      {isSelf ? 'Your Nation' : `Leader: ${island.ownerName}`}
                    </p>
                  </div>
                  <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase">
                    Lv.{island.stats?.techLevel || 1}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-blue-400" />
                    <span className="text-xs text-white/70">{island.buildings.length} Buildings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Swords size={14} className="text-red-400" />
                    <span className="text-xs text-white/70">{Math.floor(island.stats?.population || 0)} Pop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="text-xs text-white/70">${Math.floor(island.stats?.gdp || 0)}B GDP</span>
                  </div>
                  {island.stats?.activeCrisis && island.stats.activeCrisis !== 'None' && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-500 animate-pulse" />
                      <span className="text-[10px] text-red-400 font-bold uppercase">{island.stats.activeCrisis}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onVisit(island.id)}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
                      isSelf 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isSelf ? 'Manage Island' : 'Visit Island'}
                  </button>
                  
                  {!isSelf && (
                    <button
                      onClick={() => onLaunchMissile(island.id)}
                      disabled={missileCount <= 0}
                      className={`p-3 rounded-2xl transition-all flex items-center justify-center gap-2 ${
                        missileCount > 0 
                          ? 'bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/30' 
                          : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                      }`}
                      title={missileCount > 0 ? `Launch Missile (${missileCount} left)` : 'No missiles available'}
                    >
                      <Rocket size={20} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
