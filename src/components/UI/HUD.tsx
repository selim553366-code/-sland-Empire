import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, ShoppingCart, Microscope, Anchor, TrendingUp, Hammer, Utensils, 
  Mountain, Coins, Droplet, Factory, GraduationCap, Hospital, Landmark, 
  Rocket, ShieldCheck, Shield, Apple, Cpu, Zap, Atom, TreeDeciduous, 
  Users2, Heart, FlaskConical, AlertTriangle, UserPlus, Repeat, Building2,
  Percent, LayoutGrid, X, UserPlus as UserIcon, Anchor as ShipIcon, 
  TrendingUp as EconomyIcon, ShieldCheck as DiplomacyIcon,
  FlaskConical as TechIcon, ShoppingCart as MarketIcon,
  LayoutGrid as BuildIcon, Hammer as ConstructionIcon
} from 'lucide-react';
import { 
  Resources, Building, IslandStats, Creature, Ship, Island, Diplomacy 
} from '../../types';
import { useState } from 'react';

interface HUDProps {
  resources: Resources;
  stats: IslandStats;
  creatures: Creature[];
  ships: Ship[];
  otherIslands: Island[];
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
  onAttack: (shipId: string, targetId: string, targetType: 'ship' | 'building' | 'island') => void;
  onLaunchMissile: (targetId: string) => void;
  onSetDiplomacy: (targetIslandId: string, status: Diplomacy['status']) => void;
  onUpdateWorkStatus: (status: 'working' | 'resting') => void;
  onInvest?: (sector: keyof NonNullable<IslandStats['investments']>, amount: number) => void;
  onToggleWarProtocol?: () => void;
  onBuyMissile?: () => void;
  onGetBonus?: () => void;
  selectedShipId?: string | null;
  selectedSiloId?: string | null;
  onClearSelection?: () => void;
  viewMode: '3D' | '2D';
  onToggleView: () => void;
  notifications: string[];
}

const BUILDINGS = [
  { type: 'house', name: 'Ev', cost: { euro: 50, wood: 20 }, icon: Hammer, minTech: 1 },
  { type: 'farm', name: 'Çiftlik', cost: { wood: 30, food: 10 }, icon: Utensils, minTech: 1 },
  { type: 'mine', name: 'Maden', cost: { wood: 50, stone: 20 }, icon: Mountain, minTech: 1 },
  { type: 'storage', name: 'Depo', cost: { wood: 40, stone: 40 }, icon: Coins, minTech: 1 },
  { type: 'lab', name: 'Laboratuvar', cost: { euro: 200, electronics: 10 }, icon: Microscope, minTech: 2 },
  { type: 'oil_rig', name: 'Petrol Kuyusu', cost: { euro: 500, electronics: 50 }, icon: Droplet, minTech: 3 },
  { type: 'factory', name: 'Fabrika', cost: { euro: 800, electronics: 100, stone: 200 }, icon: Factory, minTech: 4 },
  { type: 'university', name: 'Üniversite', cost: { euro: 1500, electronics: 200 }, icon: GraduationCap, minTech: 5 },
  { type: 'hospital', name: 'Hastane', cost: { euro: 1200, stone: 300, wood: 200 }, icon: Hospital, minTech: 4 },
  { type: 'bank', name: 'Banka', cost: { euro: 2000, stone: 500 }, icon: Landmark, minTech: 6 },
  { type: 'missile_silo', name: 'Füze Silosu', cost: { euro: 5000, oil: 500, electronics: 300 }, icon: Rocket, minTech: 7 },
  { type: 'navy_base', name: 'Deniz Üssü', cost: { euro: 3000, stone: 1000, electronics: 500 }, icon: ShieldCheck, minTech: 5 },
  { type: 'port', name: 'Liman', cost: { euro: 1000, wood: 500, stone: 200 }, icon: Anchor, minTech: 3 },
  { type: 'defense_tower', name: 'Savunma Kulesi', cost: { euro: 2000, stone: 800, electronics: 100 }, icon: Shield, minTech: 4 },
  { type: 'missile_destroyer', name: 'Füze Yok Edici', cost: { euro: 4000, stone: 1500, electronics: 500 }, icon: ShieldCheck, minTech: 6 },
];

const MARKET_ITEMS = [
  { res: 'oil', name: 'Petrol', amount: 10, price: 100, icon: Droplet },
  { res: 'fruits', name: 'Meyve', amount: 20, price: 50, icon: Apple },
  { res: 'electronics', name: 'Elektronik', amount: 5, price: 200, icon: Cpu },
  { res: 'food', name: 'Yiyecek', amount: 50, price: 30, icon: Utensils },
];

export function HUD({ 
  resources, stats, creatures, ships, otherIslands, onSelectBuilding, isPlacing, 
  onOpenAlliances, onOpenTrades, onUpdateTax, onBuyResource, onResearch,
  onRecruitCreature, onBuildShip, onSendShip, onAttack, onLaunchMissile,
  onSetDiplomacy, onUpdateWorkStatus, onInvest, onToggleWarProtocol, onBuyMissile, onGetBonus,
  selectedShipId, selectedSiloId, onClearSelection,
  viewMode, onToggleView, notifications
}: HUDProps) {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'market' | 'tech' | 'creatures' | 'ships' | 'diplomacy' | 'government'>('build');

  const currencyIcons: Record<string, any> = {
    'Euro': Coins,
    'Gold': Coins,
    'Credits': ShoppingCart,
    'Energy': Zap,
    'Quantum': Atom
  };
  const CurrencyIcon = currencyIcons[stats.currencyType] || Coins;

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 font-sans">
      {/* Notifications */}
      <div className="fixed top-24 right-6 flex flex-col gap-2 pointer-events-none z-50">
        <AnimatePresence>
          {notifications.map((notif, i) => (
            <motion.div
              key={`${notif}-${i}`}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="bg-blue-600/90 text-white px-4 py-2 rounded-xl shadow-xl border border-blue-400 text-sm font-bold flex items-center gap-2"
            >
              <Globe size={16} />
              {notif}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Bar: Resources & Stats */}
      <div className="flex flex-col gap-4 items-center">
        <div className="flex justify-center gap-2 pointer-events-auto flex-wrap max-w-4xl">
          <ResourceItem icon={CurrencyIcon} value={resources.euro} label={stats.currencyType === 'Euro' ? 'Euro' : stats.currencyType} color="text-yellow-400" />
          <ResourceItem icon={Utensils} value={resources.food} label="Yiyecek" color="text-orange-400" />
          <ResourceItem icon={TreeDeciduous} value={resources.wood} label="Odun" color="text-green-400" />
          <ResourceItem icon={Mountain} value={resources.stone} label="Taş" color="text-gray-400" />
          <ResourceItem icon={Droplet} value={resources.oil} label="Petrol" color="text-blue-600" />
          <ResourceItem icon={Apple} value={resources.fruits} label="Meyve" color="text-red-400" />
          <ResourceItem icon={Cpu} value={resources.electronics} label="Elektronik" color="text-cyan-400" />
        </div>
        
        <div className="flex justify-center gap-4 pointer-events-auto">
          <StatItem icon={Users2} value={`${Math.floor(stats.population)}/${stats.maxPopulation}`} label="Nüfus" color="text-blue-400" />
          <StatItem icon={Heart} value={`${Math.floor(stats.happiness)}%`} label="Mutluluk" color="text-pink-400" />
          <StatItem icon={TrendingUp} value={`$${Math.floor(stats.gdp)}B`} label="GSYH" color="text-emerald-400" />
          <StatItem icon={FlaskConical} value={`Lv.${stats.techLevel}`} label="Teknoloji" color="text-purple-400" />
          
          {stats.activeCrisis !== 'None' && (
            <div className="bg-red-600/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-red-400 flex items-center gap-2 shadow-xl animate-pulse">
              <AlertTriangle className="text-white" size={14} />
              <div className="flex flex-col">
                <span className="text-white font-bold leading-none text-xs uppercase">{stats.activeCrisis}</span>
                <span className="text-[8px] text-white/70 uppercase tracking-wider">Aktif Kriz ({stats.crisisDuration}s)</span>
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
              <span className="text-[10px] text-white/50 uppercase tracking-wider">Vergi: {stats.taxRate}%</span>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-xl pointer-events-auto">
            <button
              onClick={() => onUpdateWorkStatus(stats.workStatus === 'working' ? 'resting' : 'working')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                stats.workStatus === 'working' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
              }`}
            >
              {stats.workStatus === 'working' ? 'Çalışma Modu' : 'Dinlenme Modu'}
            </button>
            <button
              onClick={onToggleView}
              className="px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all bg-blue-500 text-white hover:bg-blue-400"
            >
              {viewMode} Görünüm
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Center: Active Tab Content */}
      <div className="flex flex-col items-center gap-4 pointer-events-auto">
        <AnimatePresence mode="wait">
          {isDashboardOpen && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed inset-x-4 bottom-24 top-24 bg-black/90 backdrop-blur-xl rounded-3xl border border-white/20 flex flex-col overflow-hidden z-50 pointer-events-auto shadow-2xl"
            >
              {/* Dashboard Header / Tabs */}
              <div className="flex items-center border-b border-white/10 overflow-x-auto no-scrollbar bg-black/50">
                {[
                  { id: 'build', label: 'Binalar', icon: Hammer },
                  { id: 'market', label: 'Pazar', icon: ShoppingCart },
                  { id: 'tech', label: 'Teknoloji', icon: Microscope },
                  { id: 'creatures', label: 'Vatandaşlar', icon: UserPlus },
                  { id: 'ships', label: 'Araçlar', icon: Rocket },
                  { id: 'diplomacy', label: 'Diplomasi', icon: ShieldCheck },
                  { id: 'government', label: 'Hükümet', icon: Building2 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 font-bold transition-colors whitespace-nowrap ${
                      activeTab === tab.id ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
                <button 
                  onClick={() => setIsDashboardOpen(false)} 
                  className="ml-auto px-6 py-4 text-red-400 hover:bg-red-400/10 font-bold transition-colors"
                >
                  Kapat
                </button>
              </div>

              {/* Dashboard Content */}
              <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
                <AnimatePresence mode="wait">
                  {activeTab === 'market' && (
                    <motion.div
                      key="market"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col gap-8 w-full max-w-4xl"
                    >
                      <div className="flex gap-4 flex-wrap justify-center">
                        {MARKET_ITEMS.map((item) => (
                          <button
                            key={item.res}
                            onClick={() => onBuyResource(item.res as any, item.amount, item.price)}
                            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 min-w-[120px]"
                          >
                            <item.icon size={32} className="text-blue-400" />
                            <span className="text-sm font-bold">{item.amount} {item.name}</span>
                            <span className="text-xs text-yellow-400 font-mono">{item.price} Euro</span>
                          </button>
                        ))}
                      </div>

                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <h3 className="text-lg font-bold mb-4 text-orange-400">Askeri & Özel Alımlar</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <button
                            onClick={() => { onSelectBuilding('missile'); setIsDashboardOpen(false); }}
                            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 transition-all border border-orange-500/20"
                          >
                            <Rocket size={32} className="text-orange-500" />
                            <span className="text-sm font-bold">Füze & Silo</span>
                            <span className="text-xs text-yellow-400 font-mono">5000 Euro</span>
                          </button>
                          <button
                            onClick={() => { onSelectBuilding('warship'); setIsDashboardOpen(false); }}
                            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-all border border-blue-500/20"
                          >
                            <ShieldCheck size={32} className="text-blue-500" />
                            <span className="text-sm font-bold">Savaş Gemisi</span>
                            <span className="text-xs text-yellow-400 font-mono">1000 Euro</span>
                          </button>
                          <button
                            onClick={() => { onSelectBuilding('merchant'); setIsDashboardOpen(false); }}
                            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                          >
                            <Repeat size={32} className="text-emerald-500" />
                            <span className="text-sm font-bold">Ticaret Gemisi</span>
                            <span className="text-xs text-yellow-400 font-mono">500 Euro</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'government' && (
                    <motion.div
                      key="gov"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-4xl text-white"
                    >
                      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-400">
                        <Building2 /> Ülke Kontrol Paneli
                      </h2>
                      
                      <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                          <h3 className="text-sm text-white/50 uppercase tracking-wider mb-4">Ekonomik Durum</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Toplam Borç:</span>
                              <span className="text-red-400 font-mono text-lg">{Math.floor(stats.debt || 0)} Euro</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">GSYH:</span>
                              <span className="text-emerald-400 font-mono text-lg">${Math.floor(stats.gdp)}B</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Vergi Oranı:</span>
                              <span className="text-purple-400 font-mono text-lg">%{stats.taxRate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                          <h3 className="text-sm text-white/50 uppercase tracking-wider mb-4">Savaş Protokolü</h3>
                          <p className="text-sm text-gray-400 mb-6">
                            Savaş protokolü aktif edildiğinde savunma sistemleri devreye girer ancak ekonomik giderler artar.
                          </p>
                          <button
                            onClick={() => onToggleWarProtocol?.()}
                            className={`w-full py-3 rounded-xl font-bold uppercase text-sm transition-colors ${
                              stats.warProtocol ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-500'
                            }`}
                          >
                            {stats.warProtocol ? 'Protokolü Kapat' : 'Protokolü Aktif Et'}
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold mb-4 text-yellow-400">Yatırımlar (Maliyet: 1000 Euro)</h3>
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        {[
                          { id: 'military', name: 'Askeri', icon: Shield, color: 'text-red-400' },
                          { id: 'science', name: 'Bilim', icon: FlaskConical, color: 'text-blue-400' },
                          { id: 'agriculture', name: 'Tarım', icon: Utensils, color: 'text-green-400' },
                          { id: 'sports', name: 'Spor', icon: Heart, color: 'text-pink-400' }
                        ].map(sector => (
                          <div key={sector.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <sector.icon className={sector.color} size={32} />
                              <div>
                                <div className="font-bold text-lg">{sector.name}</div>
                                <div className="text-sm text-gray-400">Seviye: {stats.investments?.[sector.id as keyof typeof stats.investments] || 0}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => onInvest?.(sector.id as keyof NonNullable<IslandStats['investments']>, 1000)}
                              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold"
                            >
                              Yatırım Yap
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'tech' && (
                    <motion.div
                      key="tech"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-2xl"
                    >
                      <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                        <div className="flex justify-between items-end mb-6">
                          <div>
                            <h3 className="text-2xl font-bold">Teknoloji Seviyesi {stats.techLevel}</h3>
                            <p className="text-sm text-white/50 mt-1">Sonraki seviyeye ilerleme</p>
                          </div>
                          <span className="text-lg font-mono">{Math.floor(stats.techPoints)} / {stats.techLevel * 120}</span>
                        </div>
                        <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden mb-6">
                          <motion.div 
                            className="h-full bg-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(stats.techPoints / (stats.techLevel * 120)) * 100}%` }}
                          />
                        </div>
                        <button
                          onClick={onResearch}
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-colors"
                        >
                          Araştırma Yap ({stats.techLevel * 200} Euro)
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'creatures' && (
                    <motion.div
                      key="creatures"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-3xl flex flex-col gap-8"
                    >
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <h3 className="text-lg font-bold mb-4">Vatandaş Rolleri</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {['worker', 'soldier', 'scientist', 'farmer', 'politician', 'artist', 'miner'].map((role) => (
                            <div key={role} className="flex justify-between items-center p-4 rounded-xl bg-white/5">
                              <span className="text-sm capitalize">{role}</span>
                              <span className="text-sm font-mono font-bold">{creatures.filter(c => c.role === role).length}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <h3 className="text-lg font-bold mb-4">Yeni Vatandaş Al</h3>
                        <div className="flex flex-col gap-4">
                          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                            {['human', 'beast', 'robot', 'cyborg', 'spirit', 'alien'].map((type) => (
                              <button
                                key={type}
                                onClick={() => onRecruitCreature(type as any, 'worker')}
                                className="flex-shrink-0 bg-white/10 hover:bg-white/20 px-6 py-4 rounded-xl text-sm font-bold transition-all"
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                          <p className="text-sm text-white/40 italic">Maliyet: 100 Euro, 50 Yiyecek</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'ships' && (
                    <motion.div
                      key="ships"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-4xl flex flex-col gap-8"
                    >
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <h3 className="text-lg font-bold mb-4">Filo ve Araçlar</h3>
                        <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto no-scrollbar">
                          {(ships || []).map((ship) => (
                            <div key={ship.id} className="flex flex-col p-4 rounded-xl bg-white/5 gap-3">
                              <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                  <span className="text-sm capitalize font-bold">{ship.type === 'merchant' ? 'Ticaret Gemisi' : ship.type === 'explorer' ? 'Keşif Gemisi' : ship.type === 'warship' ? 'Savaş Gemisi' : 'Tank'}</span>
                                  <span className="text-xs text-white/40 uppercase">{ship.status}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => { setIsDashboardOpen(false); onOpenTrades(); }} 
                                    className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 px-3 py-1.5 rounded text-xs font-bold"
                                  >
                                    GÖNDER
                                  </button>
                                  {(ship.type === 'warship' || ship.type === 'tank') && (
                                    <button 
                                      onClick={() => {
                                        const target = otherIslands[0];
                                        if (target) onAttack(ship.id, target.id, 'island');
                                      }}
                                      className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1.5 rounded text-xs font-bold"
                                    >
                                      SALDIR
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500" 
                                  style={{ width: `${(ship.health / ship.maxHealth) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                          {(!ships || ships.length === 0) && <p className="text-sm text-white/30 text-center py-4 col-span-2">Henüz aracınız yok</p>}
                        </div>
                      </div>
                      
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <h3 className="text-lg font-bold mb-4">Araç Üret</h3>
                        <div className="grid grid-cols-4 gap-4">
                          {[
                            { type: 'merchant', name: 'Ticaret', icon: Repeat, cost: '500E' },
                            { type: 'explorer', name: 'Keşif', icon: Microscope, cost: '300E' },
                            { type: 'warship', name: 'Savaş', icon: ShieldCheck, cost: '1000E' },
                            { type: 'tank', name: 'Tank', icon: Shield, cost: '1500E' }
                          ].map((s) => (
                            <button
                              key={s.type}
                              onClick={() => { setIsDashboardOpen(false); onSelectBuilding(s.type); }}
                              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/20"
                            >
                              <s.icon size={24} className="text-blue-400" />
                              <span className="text-sm capitalize font-bold">{s.name}</span>
                              <span className="text-xs text-yellow-400">{s.cost}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'diplomacy' && (
                    <motion.div
                      key="diplomacy"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-3xl"
                    >
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold">Diplomasi</h3>
                          <button
                            onClick={() => { setIsDashboardOpen(false); onOpenTrades(); }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                          >
                            <Globe size={16} /> Dünya Haritası
                          </button>
                        </div>
                        <div className="flex flex-col gap-4 max-h-80 overflow-y-auto no-scrollbar">
                          {otherIslands.map((target) => (
                            <div key={target.id} className="p-4 rounded-2xl bg-white/5 flex flex-col gap-4 border border-white/5">
                              <div className="flex justify-between items-center">
                                <span className="text-base font-bold">{target.name}</span>
                                <span className="text-xs text-white/40 uppercase">
                                  {stats.missileCount > 0 && (
                                    <button 
                                      onClick={() => onLaunchMissile(target.id)}
                                      className="text-red-400 hover:text-red-300 ml-2 bg-red-400/10 px-3 py-1.5 rounded-lg flex items-center gap-2"
                                    >
                                      <Rocket size={14} /> Füze Fırlat
                                    </button>
                                  )}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <button 
                                  onClick={() => onSetDiplomacy(target.id, 'war')}
                                  className="bg-red-500/20 hover:bg-red-500/40 text-red-400 py-2 rounded-lg text-xs font-bold"
                                >
                                  Savaş İlan Et
                                </button>
                                <button 
                                  onClick={() => onSetDiplomacy(target.id, 'alliance')}
                                  className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 py-2 rounded-lg text-xs font-bold"
                                >
                                  İttifak Kur
                                </button>
                                <button 
                                  onClick={() => onSetDiplomacy(target.id, 'trade_agreement')}
                                  className="bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 py-2 rounded-lg text-xs font-bold"
                                >
                                  Ticaret Anlaşması
                                </button>
                              </div>
                            </div>
                          ))}
                          {otherIslands.length === 0 && <p className="text-sm text-white/30 text-center py-4">Keşfedilmiş başka ada yok</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'build' && (
                    <motion.div
                      key="build"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-5xl"
                    >
                      <div className="grid grid-cols-4 gap-4">
                        {BUILDINGS.map((b) => {
                          const locked = stats.techLevel < b.minTech;
                          return (
                            <button
                              key={b.type}
                              disabled={locked}
                              onClick={() => {
                                onSelectBuilding(b.type);
                                setIsDashboardOpen(false);
                              }}
                              className={`group relative p-4 rounded-2xl transition-all flex flex-col items-center gap-2 border ${
                                locked ? 'opacity-30 grayscale cursor-not-allowed border-transparent' :
                                isPlacing === b.type ? 'bg-white text-black border-white' : 'bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-white/30'
                              }`}
                            >
                              <b.icon size={32} className={isPlacing === b.type ? 'text-black' : 'text-blue-400'} />
                              <span className="text-sm font-bold whitespace-nowrap">{b.name}</span>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs p-3 rounded-xl whitespace-nowrap pointer-events-none border border-white/20 z-50 shadow-xl">
                                {Object.entries(b.cost).map(([res, val]) => (
                                  <p key={res} className="flex justify-between gap-6 mb-1 last:mb-0">
                                    <span className="capitalize text-white/70">{res}:</span>
                                    <span className="font-mono font-bold">{val}</span>
                                  </p>
                                ))}
                                {locked && <p className="text-red-400 mt-2 font-bold">Gereken Teknoloji: {b.minTech}</p>}
                              </div>
                            </button>
                          );
                        })}
                        
                        {/* Missile Build Button */}
                        <button
                          onClick={() => {
                            onSelectBuilding('missile');
                            setIsDashboardOpen(false);
                          }}
                          className={`group relative p-4 rounded-2xl transition-all flex flex-col items-center gap-2 border bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-white/30`}
                        >
                          <Rocket size={32} className="text-orange-500" />
                          <span className="text-sm font-bold whitespace-nowrap">Füze & Silo</span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs p-3 rounded-xl whitespace-nowrap pointer-events-none border border-white/20 z-50 shadow-xl">
                            <p className="flex justify-between gap-6 mb-1"><span className="text-white/70">Euro:</span><span className="font-mono font-bold">5000</span></p>
                            <p className="flex justify-between gap-6 mb-1"><span className="text-white/70">Petrol:</span><span className="font-mono font-bold">500</span></p>
                            <p className="flex justify-between gap-6 mb-1"><span className="text-white/70">Elektronik:</span><span className="font-mono font-bold">300</span></p>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Dashboard Toggle Button */}
        {isPlacing && (
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => onSelectBuilding(null)}
            className="pointer-events-auto bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-3xl font-bold shadow-2xl flex items-center gap-3 border border-red-400/30"
          >
            <X size={24} />
            İnşayı İptal Et ({isPlacing})
          </motion.button>
        )}

        {(selectedShipId || selectedSiloId) && (
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={onClearSelection}
            className="pointer-events-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-3xl font-bold shadow-2xl flex items-center gap-3 border border-orange-400/30"
          >
            <X size={24} />
            Hedef Seçimini İptal Et
          </motion.button>
        )}

        {!isPlacing && !isDashboardOpen && !selectedShipId && !selectedSiloId && (
          <div className="flex gap-4">
            <motion.button
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={() => setIsDashboardOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold shadow-2xl text-lg flex items-center gap-3 border border-blue-400/30 transition-all hover:scale-105"
            >
              <Globe size={24} /> Ülke Yönetimi
            </motion.button>

            <motion.button
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={onGetBonus}
              className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-4 rounded-full font-bold shadow-2xl text-lg flex items-center gap-3 border border-yellow-400/30 transition-all hover:scale-105"
            >
              <Coins size={24} /> 10.000 Euro Bonus
            </motion.button>
          </div>
        )}

        {/* Active Placement Indicator */}
        <div className="flex justify-center gap-4">
          <AnimatePresence>
            {isPlacing && (
              <motion.button
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                onClick={() => onSelectBuilding(null)}
                className="bg-red-600 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-red-700 transition-colors flex items-center gap-2 text-lg"
              >
                Yerleştirmeyi İptal Et
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
