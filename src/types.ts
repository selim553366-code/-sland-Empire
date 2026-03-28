export interface Resources {
  euro: number;
  food: number;
  wood: number;
  stone: number;
  oil: number;
  fruits: number;
  electronics: number;
}

export type CurrencyType = 'Euro' | 'Credits' | 'Energy' | 'Quantum';
export type CrisisType = 'None' | 'Hyperinflation' | 'Market Crash' | 'Famine' | 'Plague' | 'Golden Age';
export type Ideology = 'Neutral' | 'Capitalist' | 'Socialist' | 'Technocratic' | 'Expansionist';

export type WorkStatus = 'working' | 'resting';

export interface IslandStats {
  population: number;
  maxPopulation: number;
  happiness: number;
  taxRate: number;
  techPoints: number;
  techLevel: number;
  missileCount: number;
  currencyType: CurrencyType;
  ideology: Ideology;
  activeCrisis: CrisisType;
  crisisDuration: number;
  gdp: number; // Gross Domestic Product simulation
  workStatus: WorkStatus;
}

export interface Creature {
  id: string;
  type: 'human' | 'beast' | 'robot' | 'cyborg' | 'spirit' | 'alien';
  role: 'worker' | 'soldier' | 'scientist' | 'farmer' | 'politician' | 'artist' | 'miner';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  health: number;
  state: 'idle' | 'moving' | 'working';
  weapon?: 'none' | 'sword' | 'rifle' | 'laser';
  speed?: number;
}

export interface Building {
  id: string;
  type: 'house' | 'farm' | 'mine' | 'storage' | 'lab' | 'oil_rig' | 'missile_silo' | 'factory' | 'university' | 'hospital' | 'bank' | 'navy_base';
  x: number;
  y: number;
  progress: number;
  level: number; // Building specific level for evolution
  health: number;
  maxHealth: number;
}

export interface Ship {
  id: string;
  type: 'merchant' | 'explorer' | 'warship';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  cargo: Partial<Resources>;
  status: 'idle' | 'sailing' | 'trading' | 'exploring' | 'attacking';
  health: number;
  maxHealth: number;
  attackPower: number;
  weaponType: 'cannon' | 'missile' | 'torpedo' | 'none';
  targetId?: string; // ID of ship or building being attacked
  targetType?: 'ship' | 'building' | 'island';
}

export interface Tree {
  id: string;
  x: number;
  y: number;
  type: 'pine' | 'oak' | 'palm';
}

export interface Diplomacy {
  targetIslandId: string;
  status: 'neutral' | 'war' | 'alliance' | 'trade_agreement';
}

export interface Island {
  id: string;
  name?: string;
  ownerId: string;
  ownerName: string;
  resources: Resources;
  stats: IslandStats;
  buildings: Building[];
  creatures: Creature[];
  ships: Ship[];
  recentEvents: any[];
  trees: Tree[];
  discoveredIslandIds: string[];
  lastUpdated: number;
  diplomacy: Diplomacy[];
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  activeIslandId: string;
  allianceId?: string;
}

export interface Alliance {
  id: string;
  name: string;
  members: string[];
  bonuses: Record<string, number>;
}

export interface Trade {
  id: string;
  fromId: string;
  toId: string;
  offer: Partial<Resources>;
  request: Partial<Resources>;
  status: 'pending' | 'accepted' | 'declined';
}
