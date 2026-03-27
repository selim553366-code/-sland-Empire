export interface Resources {
  gold: number;
  food: number;
  wood: number;
  stone: number;
  oil: number;
  fruits: number;
  electronics: number;
}

export type CurrencyType = 'Gold' | 'Credits' | 'Energy' | 'Quantum';
export type CrisisType = 'None' | 'Hyperinflation' | 'Market Crash' | 'Famine' | 'Plague' | 'Golden Age';
export type Ideology = 'Neutral' | 'Capitalist' | 'Socialist' | 'Technocratic' | 'Expansionist';

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
}

export interface Creature {
  id: string;
  type: 'human' | 'beast' | 'robot' | 'cyborg' | 'spirit' | 'alien';
  role: 'worker' | 'soldier' | 'scientist' | 'farmer' | 'politician' | 'artist';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  health: number;
  state: 'idle' | 'moving' | 'working';
}

export interface Building {
  id: string;
  type: 'house' | 'farm' | 'mine' | 'storage' | 'lab' | 'oil_rig' | 'missile_silo' | 'factory' | 'university' | 'hospital' | 'bank';
  x: number;
  y: number;
  progress: number;
  level: number; // Building specific level for evolution
}

export interface Ship {
  id: string;
  type: 'merchant' | 'explorer' | 'warship';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  cargo: Partial<Resources>;
  status: 'idle' | 'sailing' | 'trading' | 'exploring';
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
  discoveredIslandIds: string[];
  lastUpdated: number;
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
