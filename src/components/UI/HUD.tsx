import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, Utensils, TreeDeciduous, Mountain, Hammer, Users, Repeat, 
  ShieldCheck, Users2, Heart, Percent, FlaskConical, Droplet, 
  Apple, Cpu, Rocket, ShoppingCart, Microscope, UserPlus,
  Factory, GraduationCap, Hospital, Landmark, TrendingUp, AlertTriangle,
  Zap, Atom
} from 'lucide-react';
import { Resources, Building, IslandStats, Creature, Ship } from '../../types';
import { useState } from 'react';

interface HUDProps {
  resources: Resources;
  stats: IslandStats;
  creatures: Creature[];
  ships: Ship[];
  onSelectBuilding: (type: string | null) => void;
  isPlacing: string | null;
  onOpenAlliances: () => void;
  onOpenTrades: () => void;
  onUpdateTax: (rate: number) => void;
  onBuyResource: (res: keyof Resources, amount: number, price: number) => void;
  onResearch: () => void;
  onRecruitCreature: (type: Creature['type'], role: Creature['role']) => void;
  onBuildShip: (type: Ship['type']) => void;
  onSendShip: (shipId: string, x: number, y: number) => void;
}

const BUILDINGS = [
  { type: 'house', name: 'House', cost: { gold: 50, wood: 20 }, icon: Hammer, minTech: 1 },
  { type: 'farm', name: 'Farm', cost: { wood: 30, food: 10 }, icon: Utensils, minTech: 1 },
  { type: 'mine', name: 'Mine', cost: { wood: 50, stone: 20 }, icon: Mountain, minTech: 1 },
  { type: 'storage', name: 'Storage', cost: { wood: 40, stone: 40 }, icon: Coins, minTech: 1 },
  { type: 'lab', name: 'Lab', cost: { gold: 200, electronics: 10 }, icon: Microscope, minTech: 2 },
  { type: 'oil_rig', name: 'Oil Rig', cost: { gold: 500, electronics: 50 }, icon: Droplet, minTech: 3 },
  { type: 'factory', name: 'Factory', cost: { gold: 800, electronics: 100, stone: 200 }, icon: Factory, minTech: 4 },
  { type: 'university', name: 'University', cost: { gold: 1500, electronics: 200 }, icon: GraduationCap, minTech: 5 },
  { type: 'hospital', name: 'Hospital', cost: { gold: 1200, stone: 300, wood: 200 }, icon: Hospital, minTech: 4 },
  { type: 'bank', name: 'Bank', cost: { gold: 2000, stone: 500 }, icon: Landmark, minTech: 6 },
  { type: 'missile_silo', name: 'Missile Silo', cost: { gold: 5000, oil: 500, electronics: 300 }, icon: Rocket, minTech: 7 },
];

const MARKET_ITEMS = [
  { res: 'oil', name: 'Oil', amount: 10, price: 100, icon: Droplet },
  { res: 'fruits', name: 'Fruits', amount: 20, price: 50, icon: Apple },
  { res: 'electronics', name: 'Electronics', amount: 5, price: 200, icon: Cpu },
  { res: 'food', name: 'Food', amount: 50, price: 30, icon: Utensils },
];

export function HUD({ 
  resources, stats, creatures, ships, onSelectBuilding, isPlacing, 
  onOpenAlliances, onOpenTrades, onUpdateTax, onBuyResource, onResearch,
  onRecruitCreature, onBuildShip, onSendShip
}: HUDProps) {
  const [activeTab, setActiveTab] = useState<'build' | 'market' | 'tech' | 'creatures' | 'ships' | null>(null);

  const currencyIcons: Record<string, any> = {
    'Gold': Coins,
    'Credits': ShoppingCart,
    'Energy': Zap,
    'Quantum': Atom
  };
  const CurrencyIcon = currencyIcons[stats.currencyType] || Coins;

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 font-sans">
      {/* Top Bar: Resources & Stats */}
      <div className="flex flex-col gap-4 items-center">
        <div className="flex justify-center gap-2 pointer-events-auto flex-wrap max-w-4xl">
          <ResourceItem icon={CurrencyIcon} value={resources.gold} label={stats.currencyType} color="text-yellow-400" />
          <ResourceItem icon={Utensils} value={resources.food} label="Food" color="text-orange-400" />
          <ResourceItem icon={TreeDeciduous} value={resources.wood} label="Wood" color="text-green-400" />
          <ResourceItem icon={Mountain} value={resources.stone} label="Stone" color="text-gray-400" />
          <ResourceItem icon={Droplet} value={resources.oil} label="Oil" color="text-blue-600" />
          <ResourceItem icon={Apple} value={resources.fruits} label="Fruits" color="text-red-400" />
          <ResourceItem icon={Cpu} value={resources.electronics} label="Electronics" color="text-cyan-400" />
        </div>
        
        <div className="flex justify-center gap-4 pointer-events-auto">
          <StatItem icon={Users2} value={`${Math.floor(stats.population)}/${stats.maxPopulation}`} label="Population" color="text-blue-400" />
          <StatItem icon={Heart} value={`${Math.floor(stats.happiness)}%`} label="Happiness" color="text-pink-400" />
          <StatItem icon={TrendingUp} value={`$${Math.floor(stats.gdp)}B`} label="GDP" color="text-emerald-400" />
          <StatItem icon={FlaskConical} value={`Lv.${stats.techLevel}`} label="Tech" color="text-purple-400" />
          
          {stats.activeCrisis !== 'None' && (
            <div className="bg-red-600/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-red-400 flex items-center gap-2 shadow-xl animate-pulse">
              <AlertTriangle className="text-white" size={14} />
              <div className="flex flex-col">
                <span className="text-white font-bold leading-none text-xs uppercase">{stats.activeCrisis}</span>
                <span className="text-[8px] text-white/70 uppercase tracking-wider">Active Crisis ({stats.crisisDuration}s)</span>
              </div>
            </div>
          )}
          
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-xl">
            <Percent className="text-purple-400" size={16} />
            <div className="flex flex-col">
              <input 
                type="range" 
                min="0" max="50" 
                value={stats.taxRate} 
                onChange={(e) => onUpdateTax(parseInt(e.target.value))}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="text-[10px] text-white/50 uppercase tracking-wider">Tax: {stats.taxRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side Bar: Social & Tabs */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto">
        <MenuButton icon={Users} onClick={onOpenAlliances} label="Alliances" />
        <MenuButton icon={Repeat} onClick={onOpenTrades} label="World Map" />
        <div className="h-px bg-white/10 my-2" />
        <MenuButton icon={ShoppingCart} onClick={() => setActiveTab(activeTab === 'market' ? null : 'market')} label="Market" active={activeTab === 'market'} />
        <MenuButton icon={Microscope} onClick={() => setActiveTab(activeTab === 'tech' ? null : 'tech')} label="Technology" active={activeTab === 'tech'} />
        <MenuButton icon={UserPlus} onClick={() => setActiveTab(activeTab === 'creatures' ? null : 'creatures')} label="Creatures" active={activeTab === 'creatures'} />
        <MenuButton icon={Rocket} onClick={() => setActiveTab(activeTab === 'ships' ? null : 'ships')} label="Ships & Fleet" active={activeTab === 'ships'} />
        <div className="h-px bg-white/10 my-2" />
        <MenuButton icon={Hammer} onClick={() => setActiveTab(activeTab === 'build' ? null : 'build')} label="Build Menu" active={activeTab === 'build'} />
      </div>

      {/* Bottom Center: Active Tab Content */}
      <div className="flex flex-col items-center gap-4 pointer-events-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'market' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 flex gap-4"
            >
              {MARKET_ITEMS.map((item) => (
                <button
                  key={item.res}
                  onClick={() => onBuyResource(item.res as any, item.amount, item.price)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                >
                  <item.icon size={24} className="text-blue-400" />
                  <span className="text-xs font-bold">{item.amount} {item.name}</span>
                  <span className="text-[10px] text-yellow-400 font-mono">{item.price} Gold</span>
                </button>
              ))}
            </motion.div>
          )}

          {activeTab === 'tech' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-black/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10 w-96"
            >
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-lg font-bold">Technology Level {stats.techLevel}</h3>
                  <p className="text-xs text-white/50">Progress to next level</p>
                </div>
                <span className="text-xs font-mono">{Math.floor(stats.techPoints)} / {stats.techLevel * 120}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.techPoints / (stats.techLevel * 120)) * 100}%` }}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'creatures' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 flex flex-col gap-4 w-80"
            >
              <div>
                <h3 className="text-sm font-bold px-2 mb-2">Population Roles</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['worker', 'soldier', 'scientist', 'farmer', 'politician', 'artist'].map((role) => (
                    <div key={role} className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                      <span className="text-[10px] capitalize">{role}s</span>
                      <span className="text-[10px] font-mono">{creatures.filter(c => c.role === role).length}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div>
                <h3 className="text-sm font-bold px-2 mb-2">Recruit New Citizen</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['human', 'beast', 'robot', 'cyborg', 'spirit', 'alien'].map((type) => (
                      <button
                        key={type}
                        onClick={() => onRecruitCreature(type as any, 'worker')}
                        className="flex-shrink-0 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-[10px] font-bold transition-all"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/40 px-2 italic">Cost: 100 Gold, 50 Food</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ships' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 flex flex-col gap-4 w-80"
            >
              <div>
                <h3 className="text-sm font-bold px-2 mb-2">Your Fleet</h3>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto no-scrollbar">
                  {(ships || []).map((ship) => (
                    <div key={ship.id} className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] capitalize font-bold">{ship.type}</span>
                        <span className="text-[8px] text-white/40 uppercase">{ship.status}</span>
                      </div>
                      <button 
                        onClick={() => onOpenTrades()} // Open map to send
                        className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 px-2 py-1 rounded text-[8px] font-bold"
                      >
                        SEND
                      </button>
                    </div>
                  ))}
                  {(!ships || ships.length === 0) && <p className="text-[10px] text-white/30 text-center py-2">No ships in fleet</p>}
                </div>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <h3 className="text-sm font-bold px-2 mb-2">Build Ship</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'merchant', icon: Repeat, cost: '500G' },
                    { type: 'explorer', icon: Microscope, cost: '300G' },
                    { type: 'warship', icon: ShieldCheck, cost: '1000G' }
                  ].map((s) => (
                    <button
                      key={s.type}
                      onClick={() => onBuildShip(s.type as any)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <s.icon size={16} className="text-blue-400" />
                      <span className="text-[8px] capitalize">{s.type}</span>
                      <span className="text-[8px] text-yellow-400">{s.cost}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'build' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 grid grid-cols-4 gap-2 max-w-lg"
            >
              {BUILDINGS.map((b) => {
                const locked = stats.techLevel < b.minTech;
                return (
                  <button
                    key={b.type}
                    disabled={locked}
                    onClick={() => {
                      onSelectBuilding(b.type);
                      setActiveTab(null);
                    }}
                    className={`group relative p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                      locked ? 'opacity-30 grayscale cursor-not-allowed' :
                      isPlacing === b.type ? 'bg-white text-black' : 'hover:bg-white/10 text-white'
                    }`}
                  >
                    <b.icon size={20} />
                    <span className="text-[8px] font-bold whitespace-nowrap">{b.name}</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] p-2 rounded whitespace-nowrap pointer-events-none border border-white/10 z-50">
                      {Object.entries(b.cost).map(([res, val]) => (
                        <p key={res} className="flex justify-between gap-4">
                          <span className="capitalize">{res}:</span>
                          <span>{val}</span>
                        </p>
                      ))}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Placement Indicator */}
        <div className="flex justify-center gap-4">
          <AnimatePresence>
            {isPlacing && (
              <motion.button
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                onClick={() => onSelectBuilding(null)}
                className="bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-red-700 transition-colors"
              >
                Cancel Placement
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ResourceItem({ icon: Icon, value, label, color }: { icon: any, value: number, label: string, color: string }) {
  return (
    <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
      <Icon className={color} size={14} />
      <div className="flex flex-col">
        <span className="text-white font-mono font-bold leading-none text-xs">{Math.floor(value)}</span>
        <span className="text-[8px] text-white/50 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, value, label, color }: { icon: any, value: string | number, label: string, color: string }) {
  return (
    <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
      <Icon className={color} size={14} />
      <div className="flex flex-col">
        <span className="text-white font-mono font-bold leading-none text-xs">{value}</span>
        <span className="text-[8px] text-white/50 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

function MenuButton({ icon: Icon, onClick, label, active }: { icon: any, onClick: () => void, label: string, active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border transition-all group relative ${
        active ? 'bg-white text-black border-white' : 'bg-black/40 backdrop-blur-md border-white/10 text-white hover:bg-white/10'
      }`}
    >
      <Icon size={24} />
      <span className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none text-white">
        {label}
      </span>
    </button>
  );
}
