import { useState, useEffect, useCallback, useRef } from 'react';
import { auth, db } from './firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, where, arrayUnion } from 'firebase/firestore';
import { Scene } from './components/Game/Scene';
import { Map2D } from './components/Game/Map2D';
import { HUD } from './components/UI/HUD';
import { WorldMap } from './components/UI/WorldMap';
import { Login } from './components/UI/Login';
import { Island, UserProfile, Resources, Building, Creature, Ship, Diplomacy, IslandStats } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Loader2, Trophy, Shield, Swords, Utensils, Heart } from 'lucide-react';

const INITIAL_RESOURCES: Resources = {
  euro: 1000,
  food: 200,
  wood: 200,
  stone: 100,
  oil: 0,
  fruits: 0,
  electronics: 0
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [island, setIsland] = useState<Island | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlacing, setIsPlacing] = useState<string | null>(null);

  const handleSelectBuilding = (type: string | null) => {
    setIsPlacing(type);
    if (type) {
      setViewingIslandId(null); // Go back to my island when placing
    }
  };
  const [otherIslands, setOtherIslands] = useState<Island[]>([]);
  const [npcIslands, setNpcIslands] = useState<Island[]>([]);
  const [viewingIslandId, setViewingIslandId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [selectedSiloId, setSelectedSiloId] = useState<string | null>(null);
  const [activeMissiles, setActiveMissiles] = useState<{ id: string, start: [number, number], end: [number, number], progress: number }[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const prevTechLevel = useRef<number | null>(null);

  useEffect(() => {
    if (activeMissiles.length === 0) return;
    
    const interval = setInterval(() => {
      setActiveMissiles(prev => prev.map(m => ({ ...m, progress: m.progress + 0.05 }))
        .filter(m => m.progress < 1));
    }, 50);
    
    return () => clearInterval(interval);
  }, [activeMissiles]);

  useEffect(() => {
    if (island?.stats.techLevel && prevTechLevel.current && island.stats.techLevel > prevTechLevel.current) {
      setNotifications(prev => [...prev.slice(-4), `Teknoloji Seviyesi ${island.stats.techLevel}'ye yükseldi! +500 Elektronik!`]);
    }
    if (island?.stats.techLevel) {
      prevTechLevel.current = island.stats.techLevel;
    }
  }, [island?.stats.techLevel]);

  // Generate NPC islands once
  useEffect(() => {
    const npcs: Island[] = [];
    const names = ['Tortuga', 'Atlantis', 'Avalon', 'Lemuria', 'Mu', 'Shangri-La', 'Zanzibar', 'Madagascar', 'Iceland', 'Greenland'];
    for (let i = 0; i < 10; i++) {
      npcs.push({
        id: `npc-${i}`,
        name: names[i],
        ownerId: 'system',
        ownerName: 'Ancient Civilization',
        x: (Math.random() - 0.5) * 300,
        y: (Math.random() - 0.5) * 300,
        resources: INITIAL_RESOURCES,
        stats: {
          population: 50,
          maxPopulation: 100,
          happiness: 80,
          taxRate: 15,
          techPoints: 500,
          techLevel: 3,
          missileCount: 0,
          currencyType: 'Euro',
          ideology: 'Neutral',
          activeCrisis: 'None',
          crisisDuration: 0,
          gdp: 500,
          workStatus: 'working'
        },
        buildings: [],
        creatures: [],
        ships: [],
        recentEvents: [],
        trees: Array.from({ length: 15 }).map((_, j) => ({
          id: `npc-${i}-tree-${j}`,
          x: (Math.random() - 0.5) * 28,
          y: (Math.random() - 0.5) * 28,
          type: ['pine', 'oak', 'palm'][Math.floor(Math.random() * 3)] as any
        })),
        discoveredIslandIds: [],
        lastUpdated: Date.now(),
        diplomacy: []
      });
    }
    setNpcIslands(npcs);
  }, []);

  // Fetch other islands
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'islands'), where('ownerId', '!=', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const islands = snapshot.docs.map(doc => {
        const data = doc.data() as Island;
        if (!data.name) data.name = `${data.ownerName}'s Empire`;
        if (!data.stats) {
          data.stats = {
            population: 10,
            maxPopulation: 20,
            happiness: 100,
            taxRate: 10,
            techPoints: 0,
            techLevel: 1,
            missileCount: 0,
            currencyType: 'Euro',
            ideology: 'Neutral',
            activeCrisis: 'None',
            crisisDuration: 0,
            gdp: 100,
            workStatus: 'working',
            debt: 0,
            investments: { military: 0, science: 0, agriculture: 0, sports: 0 },
            warProtocol: false
          };
        }
        if (!data.stats.currencyType) data.stats.currencyType = 'Euro';
        if (!data.stats.ideology) data.stats.ideology = 'Neutral';
        if (!data.stats.activeCrisis) data.stats.activeCrisis = 'None';
        if (!data.stats.crisisDuration) data.stats.crisisDuration = 0;
        if (!data.stats.gdp) data.stats.gdp = 100;
        if (data.stats.debt === undefined) data.stats.debt = 0;
        if (!data.stats.investments) data.stats.investments = { military: 0, science: 0, agriculture: 0, sports: 0 };
        if (data.stats.warProtocol === undefined) data.stats.warProtocol = false;
        
        // Safety checks for NaN and missing fields
        data.stats.population = data.stats.population || 10;
        data.stats.maxPopulation = data.stats.maxPopulation || 20;
        data.stats.happiness = data.stats.happiness || 100;
        data.stats.techPoints = data.stats.techPoints || 0;
        data.stats.techLevel = data.stats.techLevel || 1;
        
        data.buildings = (data.buildings || []).map(b => ({
          ...b,
          health: b.health ?? 500,
          maxHealth: b.maxHealth ?? 500,
          progress: b.progress ?? 0
        }));
        data.ships = (data.ships || []).map(s => ({
          ...s,
          health: s.health ?? (s.type === 'warship' ? 1000 : 500),
          maxHealth: s.maxHealth ?? (s.type === 'warship' ? 1000 : 500),
          attackPower: s.attackPower ?? (s.type === 'warship' ? 50 : 0),
          weaponType: s.weaponType ?? (s.type === 'warship' ? 'cannon' : 'none')
        }));
        return data;
      });
      setOtherIslands(islands);
    });
    return unsub;
  }, [user]);

  const currentIsland = viewingIslandId 
    ? otherIslands.find(i => i.id === viewingIslandId) || island 
    : island;
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
            // Ensure island exists even if user profile exists
            const islandDoc = await getDoc(doc(db, 'islands', u.uid));
            if (!islandDoc.exists()) {
              const newIsland: Island = {
                id: u.uid,
                name: `${u.displayName || 'New'}'s Empire`,
                ownerId: u.uid,
                ownerName: u.displayName || 'Player',
                x: 0,
                y: 0,
                resources: INITIAL_RESOURCES,
                stats: {
                  population: 10,
                  maxPopulation: 20,
                  happiness: 100,
                  taxRate: 10,
                  techPoints: 0,
                  techLevel: 1,
                  missileCount: 0,
                  currencyType: 'Euro',
                  ideology: 'Neutral',
                  activeCrisis: 'None',
                  crisisDuration: 0,
                  gdp: 100,
                  workStatus: 'working',
                  debt: 0,
                  investments: { military: 0, science: 0, agriculture: 0, sports: 0 },
                  warProtocol: false
                },
                diplomacy: [],
                buildings: [],
                creatures: [
                  { id: 'c1', type: 'human', role: 'worker', x: 0, y: 0, health: 100, state: 'idle' },
                  { id: 'c2', type: 'human', role: 'farmer', x: 2, y: 2, health: 100, state: 'idle' },
                  { id: 'c3', type: 'human', role: 'scientist', x: -2, y: -2, health: 100, state: 'idle' },
                  { id: 'c4', type: 'human', role: 'artist', x: 5, y: -5, health: 100, state: 'idle' },
                  { id: 'c5', type: 'human', role: 'politician', x: -5, y: 5, health: 100, state: 'idle' }
                ],
                ships: [],
                recentEvents: [],
                trees: Array.from({ length: 20 }).map((_, i) => ({
                  id: `tree-${i}`,
                  x: (Math.random() - 0.5) * 28,
                  y: (Math.random() - 0.5) * 28,
                  type: ['pine', 'oak', 'palm'][Math.floor(Math.random() * 3)] as any
                })),
                discoveredIslandIds: [u.uid],
                lastUpdated: Date.now(),
              };
              await setDoc(doc(db, 'islands', u.uid), newIsland);
            }
          } else {
            const newProfile: UserProfile = {
              uid: u.uid,
              username: u.displayName || 'Player',
              email: u.email || '',
              activeIslandId: u.uid,
            };
            await setDoc(doc(db, 'users', u.uid), newProfile);
            setProfile(newProfile);

            // Create initial island
            const newIsland: Island = {
              id: u.uid,
              name: `${u.displayName || 'New'}'s Empire`,
              ownerId: u.uid,
              ownerName: u.displayName || 'Player',
              x: 0,
              y: 0,
              resources: INITIAL_RESOURCES,
              stats: {
                population: 10,
                maxPopulation: 20,
                happiness: 100,
                taxRate: 10,
                techPoints: 0,
                techLevel: 1,
                missileCount: 0,
                currencyType: 'Euro',
                ideology: 'Neutral',
                activeCrisis: 'None',
                crisisDuration: 0,
                gdp: 100,
                workStatus: 'working',
                debt: 0,
                investments: { military: 0, science: 0, agriculture: 0, sports: 0 },
                warProtocol: false
              },
              diplomacy: [],
              buildings: [],
              creatures: [
                { id: 'c1', type: 'human', role: 'worker', x: 0, y: 0, health: 100, state: 'idle' },
                { id: 'c2', type: 'human', role: 'farmer', x: 2, y: 2, health: 100, state: 'idle' },
                { id: 'c3', type: 'human', role: 'scientist', x: -2, y: -2, health: 100, state: 'idle' },
                { id: 'c4', type: 'human', role: 'artist', x: 5, y: -5, health: 100, state: 'idle' },
                { id: 'c5', type: 'human', role: 'politician', x: -5, y: 5, health: 100, state: 'idle' }
              ],
              ships: [],
              recentEvents: [],
              trees: Array.from({ length: 20 }).map((_, i) => ({
                id: `tree-${i}`,
                x: (Math.random() - 0.5) * 28,
                y: (Math.random() - 0.5) * 28,
                type: ['pine', 'oak', 'palm'][Math.floor(Math.random() * 3)] as any
              })),
              discoveredIslandIds: [u.uid],
              lastUpdated: Date.now(),
            };
            await setDoc(doc(db, 'islands', u.uid), newIsland);
          }
        } catch (error) {
          console.error("Error loading user profile or island:", error);
        }
      }
      setLoading(false);
    });
  }, []);

  // Island Sync
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'islands', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Island;
        if (!data.stats) {
          data.stats = {
            population: 10,
            maxPopulation: 20,
            happiness: 100,
            taxRate: 10,
            techPoints: 0,
            techLevel: 1,
            missileCount: 0,
            currencyType: 'Euro',
            ideology: 'Neutral',
            activeCrisis: 'None',
            crisisDuration: 0,
            gdp: 100,
            workStatus: 'working',
            debt: 0,
            investments: { military: 0, science: 0, agriculture: 0, sports: 0 },
            warProtocol: false
          };
        }
        if (!data.stats.currencyType) data.stats.currencyType = 'Euro';
        if (!data.stats.ideology) data.stats.ideology = 'Neutral';
        if (!data.stats.activeCrisis) data.stats.activeCrisis = 'None';
        if (!data.stats.crisisDuration) data.stats.crisisDuration = 0;
        if (!data.stats.gdp) data.stats.gdp = 100;
        if (!data.creatures) data.creatures = [];
        if (!data.ships) data.ships = [];
        if (!data.discoveredIslandIds) data.discoveredIslandIds = [user.uid];
        if (!data.resources.oil) {
          data.resources.oil = 0;
          data.resources.fruits = 0;
          data.resources.electronics = 0;
        }
        
        if (data.stats.debt === undefined) data.stats.debt = 0;
        if (!data.stats.investments) data.stats.investments = { military: 0, science: 0, agriculture: 0, sports: 0 };
        if (data.stats.warProtocol === undefined) data.stats.warProtocol = false;

        // Safety checks for NaN and missing fields
        Object.keys(INITIAL_RESOURCES).forEach(key => {
          const k = key as keyof Resources;
          if (isNaN(data.resources[k]) || data.resources[k] == null) {
            data.resources[k] = INITIAL_RESOURCES[k] || 0;
          }
        });
        
        if (isNaN(data.stats.debt)) data.stats.debt = 0;
        if (isNaN(data.stats.investments.military)) data.stats.investments.military = 0;
        if (isNaN(data.stats.investments.science)) data.stats.investments.science = 0;
        if (isNaN(data.stats.investments.agriculture)) data.stats.investments.agriculture = 0;
        if (isNaN(data.stats.investments.sports)) data.stats.investments.sports = 0;

        if (isNaN(data.stats.population)) data.stats.population = 10;
        if (isNaN(data.stats.maxPopulation)) data.stats.maxPopulation = 20;
        if (isNaN(data.stats.happiness)) data.stats.happiness = 100;
        if (isNaN(data.stats.techPoints)) data.stats.techPoints = 0;
        if (isNaN(data.stats.techLevel)) data.stats.techLevel = 1;
        if (isNaN(data.stats.gdp)) data.stats.gdp = 100;
        if (isNaN(data.stats.taxRate)) data.stats.taxRate = 10;
        
        data.buildings = (data.buildings || []).map(b => ({
          ...b,
          health: b.health ?? 500,
          maxHealth: b.maxHealth ?? 500,
          progress: b.progress ?? 0
        }));
        
        data.ships = (data.ships || []).map(s => ({
          ...s,
          health: s.health ?? (s.type === 'warship' ? 1000 : 500),
          maxHealth: s.maxHealth ?? (s.type === 'warship' ? 1000 : 500)
        }));
        
        setIsland(data);
      }
    }, (error) => {
      console.error("Error syncing island:", error);
    });
    return unsub;
  }, [user]);

  // Passive Resource & Population Logic
  useEffect(() => {
    if (!user || viewingIslandId) return;

    const interval = setInterval(async () => {
      // Fetch latest island data to avoid stale closures
      const islandRef = doc(db, 'islands', user.uid);
      const islandDoc = await getDoc(islandRef);
      if (!islandDoc.exists()) return;
      
      const currentIslandData = islandDoc.data() as Island;
      const stats = { ...currentIslandData.stats };
      const resources = { ...currentIslandData.resources };
      const buildings = [...currentIslandData.buildings];
      const creatures = [...(currentIslandData.creatures || [])];
      const ships = [...(currentIslandData.ships || [])];
      
      // 1. GDP & Economy Simulation
      stats.gdp = (stats.population * 15) + (buildings.length * 75);
      
      // Currency Evolution based on Tech Level
      if (stats.techLevel >= 12) stats.currencyType = 'Quantum';
      else if (stats.techLevel >= 8) stats.currencyType = 'Energy';
      else if (stats.techLevel >= 4) stats.currencyType = 'Credits';
      else stats.currencyType = 'Euro';

      // Crisis Management
      if (stats.activeCrisis !== 'None') {
        stats.crisisDuration--;
        if (stats.crisisDuration <= 0) stats.activeCrisis = 'None';
      } else if (Math.random() < 0.03) {
        const crises: any[] = ['Hyperinflation', 'Market Crash', 'Famine', 'Plague', 'Golden Age'];
        stats.activeCrisis = crises[Math.floor(Math.random() * crises.length)];
        stats.crisisDuration = 15;
      }

      // Crisis Effects
      let incomeMultiplier = 1;
      let happinessModifier = 0;
      if (stats.activeCrisis === 'Hyperinflation') {
        incomeMultiplier = 0.4;
        happinessModifier = -0.5;
      }
      if (stats.activeCrisis === 'Market Crash') {
        incomeMultiplier = 0.1;
        happinessModifier = -1;
      }
      if (stats.activeCrisis === 'Golden Age') {
        incomeMultiplier = 3.0;
        happinessModifier = 1.5;
      }

      // 2. Consumption
      const foodConsumption = stats.population * (stats.activeCrisis === 'Famine' ? 0.15 : 0.05);
      resources.food -= foodConsumption;

      // 3. Starvation & Growth
      if (resources.food <= 0) {
        resources.food = 0;
        const deaths = Math.ceil(stats.population * 0.08);
        stats.population = Math.max(0, stats.population - deaths);
        stats.happiness = Math.max(0, stats.happiness - 15);
      } else {
        if (stats.happiness > 50) {
          stats.population += 0.3 * (stats.activeCrisis === 'Golden Age' ? 2 : 1);
        }
      }

      // 4. Happiness Logic
      const taxImpact = (stats.taxRate - 12) * 0.6;
      stats.happiness = Math.max(0, Math.min(100, stats.happiness - taxImpact + happinessModifier + (resources.food > 20 ? 0.2 : -0.3)));

      if (stats.activeCrisis === 'Plague') {
        stats.population = Math.max(0, stats.population - (stats.population * 0.02));
        stats.happiness = Math.max(0, stats.happiness - 1);
      }

      // 5. Production
      const efficiency = (stats.population / 10) * (stats.happiness / 100) * incomeMultiplier;
      const inv = stats.investments || { military: 0, science: 0, agriculture: 0, sports: 0 };
      
      const baseIncome = {
        euro: stats.population * (stats.taxRate / 100) * 0.2 * incomeMultiplier,
        food: 0.2 + ((inv.agriculture || 0) * 0.05),
        wood: 0.2,
        stone: 0.1,
        oil: 0,
        fruits: 0,
        electronics: 0,
        tech: (0.02 * stats.population) + ((inv.science || 0) * 0.05)
      };
      
      stats.happiness = Math.min(100, stats.happiness + ((inv.sports || 0) * 0.01));
      let expenses = ((inv.military || 0) + (inv.science || 0) + (inv.agriculture || 0) + (inv.sports || 0)) * 2;
      if (stats.warProtocol) expenses += 50; // Active defense cost

      buildings.forEach(b => {
        if (b.progress < 100) b.progress += 5; // Faster progress
        
        if (b.progress >= 100) {
          if (b.type === 'farm') baseIncome.food += 2 * efficiency;
          if (b.type === 'mine') baseIncome.stone += 1 * efficiency;
          if (b.type === 'storage') baseIncome.euro += 1 * efficiency;
          if (b.type === 'lab') baseIncome.tech += 1 * efficiency;
          if (b.type === 'oil_rig') baseIncome.oil += 60; // 20 per second * 3 seconds
          if (b.type === 'factory') {
            const scientistCount = creatures.filter(c => c.role === 'scientist').length;
            baseIncome.electronics += (0.3 + (scientistCount * 0.1)) * efficiency;
          }
          if (b.type === 'bank') baseIncome.euro += 5 * efficiency;
          if (b.type === 'university') baseIncome.tech += 2 * efficiency;
          if (b.type === 'hospital') stats.happiness += 0.1;
          
          if (b.type === 'house') {
            stats.maxPopulation = 1000 + (buildings.filter(x => x.type === 'house' && x.progress >= 100).length * 100);
          }
          if (b.type === 'missile_silo') {
            if (Math.random() < 0.1) stats.missileCount += 1;
          }
          if (b.type === 'navy_base') {
            // Navy base could provide some defensive bonus or ship repair
            ships.forEach(s => {
              if (s.health < s.maxHealth) s.health = Math.min(s.maxHealth, s.health + 5);
            });
          }
        }
      });

      const minerCount = creatures.filter(c => c.role === 'miner').length;
      baseIncome.stone += minerCount * 60; // 20 per second * 3 seconds

      const farmerCount = creatures.filter(c => c.role === 'farmer').length;
      baseIncome.food += farmerCount * 150; // 50 per second * 3 seconds

      resources.euro += baseIncome.euro - expenses;
      if (resources.euro < 0) {
        stats.debt = (stats.debt || 0) + Math.abs(resources.euro);
        resources.euro = 0;
        stats.happiness = Math.max(0, stats.happiness - 2); // Debt causes unhappiness
      } else if ((stats.debt || 0) > 0 && resources.euro > 0) {
        // Pay off debt automatically if we have money
        const payment = Math.min(resources.euro, stats.debt || 0);
        resources.euro -= payment;
        stats.debt = (stats.debt || 0) - payment;
      }
      
      resources.food += baseIncome.food;
      resources.wood += baseIncome.wood;
      resources.stone += baseIncome.stone;
      resources.oil += baseIncome.oil;
      resources.fruits += baseIncome.fruits;
      resources.electronics += baseIncome.electronics;
      stats.techPoints += baseIncome.tech;

      const newEvents: any[] = [];
      if (stats.techPoints >= stats.techLevel * 120) {
        stats.techPoints -= stats.techLevel * 120;
        stats.techLevel += 1;
        resources.electronics += 500;
        newEvents.push({
          id: Math.random().toString(36).substr(2, 9),
          type: 'tech_bonus',
          x: 0,
          y: 0,
          amount: 500,
          timestamp: Date.now()
        });
      }

      // 6. Creature AI & Movement
      let miningEuroBonus = 0;
      const newCreatures = [...creatures];
      
      // Spawn or remove creatures to match population
      // User wants all population to be outside. Capping at 200 for performance.
      const targetCreatureCount = Math.min(200, Math.floor(stats.population));
      
      // Spawn new creatures (multiple at once if needed)
      const roles: Creature['role'][] = ['worker', 'farmer', 'scientist', 'artist', 'politician', 'miner'];
      const types: Creature['type'][] = ['human', 'robot', 'cyborg'];
      
      while (newCreatures.length < targetCreatureCount) {
        newCreatures.push({
          id: Math.random().toString(36).substr(2, 9),
          type: types[Math.floor(Math.random() * types.length)],
          role: roles[Math.floor(Math.random() * roles.length)],
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
          health: 100,
          speed: 1 + Math.random() * 0.5,
          state: 'idle'
        });
        // Limit batch spawn to 10 per interval to avoid spikes
        if (newCreatures.length - creatures.length >= 10) break;
      }
      // Remove creatures if population decreased
      while (newCreatures.length > targetCreatureCount) {
        newCreatures.pop();
        if (creatures.length - newCreatures.length >= 10) break;
      }

      // Population growth
      if (Math.random() < 0.05) {
        stats.population += 1;
      }

      const updatedCreatures = newCreatures.map(c => {
        const creature = { ...c };
        
        if (creature.state === 'idle' || !creature.targetX) {
          const relevantBuildings = buildings.filter(b => {
            if (stats.workStatus === 'resting') return b.type === 'house';
            
            if (creature.role === 'farmer') return b.type === 'farm';
            if (creature.role === 'scientist') return b.type === 'lab' || b.type === 'university';
            if (creature.role === 'worker') return b.type === 'mine' || b.type === 'factory' || b.type === 'storage';
            if (creature.role === 'politician') return b.type === 'bank';
            if (creature.role === 'artist') return b.type === 'house';
            if (creature.role === 'soldier') return b.type === 'navy_base' || b.type === 'missile_silo' || b.type === 'defense_tower';
            return true;
          });

          if (relevantBuildings.length > 0 && Math.random() > 0.3) {
            const target = relevantBuildings[Math.floor(Math.random() * relevantBuildings.length)];
            if (creature.role === 'soldier' || creature.role === 'scientist') {
              creature.targetX = target.x;
              creature.targetY = target.y;
            } else {
              creature.targetX = target.x + (Math.random() - 0.5) * 5;
              creature.targetY = target.y + (Math.random() - 0.5) * 5;
            }
            creature.state = 'moving';
          } else {
            creature.targetX = (Math.random() - 0.5) * 25;
            creature.targetY = (Math.random() - 0.5) * 25;
            creature.state = 'moving';
          }
        }

        if (creature.state === 'moving' && creature.targetX !== undefined && creature.targetY !== undefined) {
          const dx = creature.targetX - creature.x;
          const dy = creature.targetY - creature.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 1.5) { // Increased distance threshold to prevent getting stuck
            creature.state = 'working';
          } else {
            // Reduced random jitter to improve movement stability
            creature.x += (dx / dist) * (creature.speed || 1.5) + (Math.random() - 0.5) * 0.05;
            creature.y += (dy / dist) * (creature.speed || 1.5) + (Math.random() - 0.5) * 0.05;
          }
        }

        if (creature.state === 'working') {
          // Check if working at a mine to find euro
          const nearMine = buildings.find(b => 
            b.type === 'mine' && 
            b.progress >= 100 &&
            Math.sqrt(Math.pow(b.x - creature.x, 2) + Math.pow(b.y - creature.y, 2)) < 5
          );
          
          if (nearMine && Math.random() < 0.2) {
            miningEuroBonus += 120; // 40 per second * 3 seconds
            newEvents.push({
              id: Math.random().toString(36).substr(2, 9),
              type: 'euro_found',
              x: creature.x,
              y: creature.y,
              amount: 15,
              timestamp: Date.now()
            });
          }

          // Miner role logic: 30 euro per second (90 per 3s interval)
          if (creature.role === 'miner') {
            miningEuroBonus += 90;
          }

          if (Math.random() < 0.3) {
            if (creature.role !== 'soldier' && creature.role !== 'scientist') {
              creature.state = 'idle';
            } else if (stats.workStatus === 'resting') {
              creature.state = 'idle';
            }
          }
        }

        return creature;
      });

      // 7. Ship Movement & Combat & Discovery
      let tradeIncome = 0;
      const discoveredIds = [...(currentIslandData.discoveredIslandIds || [])];
      let discoveryMade = false;

      const newShips = ships.map(s => {
        const ship = { ...s };
        
        if (ship.status === 'sailing' && ship.targetX !== undefined && ship.targetY !== undefined) {
          const dx = ship.targetX - ship.x;
          const dy = ship.targetY - ship.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 2) {
            ship.status = 'idle';
            if (ship.type === 'merchant') tradeIncome += 200;
          } else {
            ship.x += (dx / dist) * 5;
            ship.y += (dy / dist) * 5;

            // Discovery Logic for Explorer Ships
            if (ship.type === 'explorer') {
              [...otherIslands, ...npcIslands].forEach(targetIsland => {
                if (!discoveredIds.includes(targetIsland.id)) {
                  // Check distance in world map coordinates
                  // For simplicity, we assume ship.x/y are world coords when sailing
                  const dX = targetIsland.id === 'system' ? 0 : (Math.random() - 0.5) * 160; // Mock world pos
                  const dY = targetIsland.id === 'system' ? 0 : (Math.random() - 0.5) * 160;
                  // This is a bit complex since we don't store world positions in the DB.
                  // Let's just say explorers have a 5% chance to discover a new island every 3s
                  if (Math.random() < 0.05) {
                    const undiscovered = [...otherIslands, ...npcIslands].find(i => !discoveredIds.includes(i.id));
                    if (undiscovered) {
                      discoveredIds.push(undiscovered.id);
                      discoveryMade = true;
                      newEvents.push({
                        id: Math.random().toString(36).substr(2, 9),
                        type: 'discovery',
                        islandName: undiscovered.name || 'Yeni Ada',
                        timestamp: Date.now()
                      });
                      setNotifications(prev => [...prev, `Yeni ada keşfedildi: ${undiscovered.name || 'Yeni Ada'}`]);
                    }
                  }
                }
              });
            }
          }
        } else if (ship.status === 'exploring' && ship.targetIslandId) {
          const targetIsland = [...otherIslands, ...npcIslands].find(i => i.id === ship.targetIslandId);
          if (targetIsland) {
            if (Math.random() < 0.1) {
              ship.status = 'idle';
              if (!discoveredIds.includes(targetIsland.id)) {
                discoveredIds.push(targetIsland.id);
                discoveryMade = true;
                newEvents.push({
                  id: Math.random().toString(36).substr(2, 9),
                  type: 'discovery',
                  islandName: targetIsland.name || 'Yeni Ada',
                  timestamp: Date.now()
                });
                setNotifications(prev => [...prev, `Yeni ada keşfedildi: ${targetIsland.name || 'Yeni Ada'}`]);
              }
            }
          } else {
            ship.status = 'idle';
          }
        }

        if (ship.status === 'attacking' && ship.targetId) {
          // Combat logic: simplified for now, assuming target is on the same map or we just simulate damage
          // In a real multi-island game, we'd need to know which island the target belongs to.
          // For now, let's assume warships deal damage to their target if they are "close" (which they always are in this simplified view)
          if (Math.random() < 0.3) { // Attack chance
             // We'd need to find the target and reduce health.
             // This is hard without knowing the target's island.
             // Let's add a simple event for now.
             newEvents.push({
               id: Math.random().toString(36).substr(2, 9),
               type: 'combat_action',
               shipId: ship.id,
               targetId: ship.targetId,
               timestamp: Date.now()
             });
          }
        }

        return ship;
      });

      resources.euro += tradeIncome + miningEuroBonus;

      await updateDoc(islandRef, {
        resources,
        stats,
        buildings,
        creatures: updatedCreatures,
        ships: newShips,
        discoveredIslandIds: discoveredIds,
        recentEvents: [...(currentIslandData.recentEvents || []), ...newEvents].slice(-10),
        lastUpdated: Date.now()
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [user, viewingIslandId]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleBuyResource = async (res: keyof Resources, amount: number, price: number) => {
    if (!island || !user) return;
    if (island.resources.euro < price) {
      alert('Yeterli Euro yok!');
      return;
    }
    const newResources = { ...island.resources };
    newResources.euro -= price;
    (newResources[res] as number) += amount;
    await updateDoc(doc(db, 'islands', user.uid), { resources: newResources });
  };

  const handleLaunchMissile = async (targetId: string) => {
    if (!island || !user) return;
    if (island.stats.missileCount <= 0) {
      alert('Füze yok!');
      return;
    }

    // Find the silo position
    const silo = island.buildings.find(b => b.id === selectedSiloId) || island.buildings.find(b => b.type === 'missile_silo');
    const startPos: [number, number] = silo ? [silo.x, silo.y] : [0, 0];

    // Launch logic
    await updateDoc(doc(db, 'islands', user.uid), { 'stats.missileCount': island.stats.missileCount - 1 });
    
    // Add to active missiles for animation
    const missileId = Math.random().toString(36).substr(2, 9);
    // Find target island position for animation
    const targetIslandDoc = await getDoc(doc(db, 'islands', targetId));
    const targetIslandData = targetIslandDoc.exists() ? targetIslandDoc.data() as Island : null;
    const endPos: [number, number] = targetIslandData ? [targetIslandData.x || 0, targetIslandData.y || 0] : [0, 0];
    
    setActiveMissiles(prev => [...prev, { id: missileId, start: startPos, end: endPos, progress: 0 }]);

    // Impact logic: damage target island buildings
    setTimeout(async () => {
      const targetDoc = await getDoc(doc(db, 'islands', targetId));
      if (targetDoc.exists()) {
        const targetData = targetDoc.data() as Island;
        const newBuildings = [...targetData.buildings];
        const newStats = { ...targetData.stats };
        
        // Defense logic
        let damage = 200;
        let intercepted = false;
        
        const defenseTowers = newBuildings.filter(b => b.type === 'defense_tower' && b.progress >= 100);
        const missileDestroyers = newBuildings.filter(b => b.type === 'missile_destroyer' && b.progress >= 100);
        
        if (missileDestroyers.length > 0) {
          // Missile destroyers have a 60% chance each to intercept
          const interceptChance = Math.min(0.95, missileDestroyers.length * 0.6);
          if (Math.random() < interceptChance) {
            intercepted = true;
            setNotifications(prev => [...prev, `${targetData.name} füzeyi yok edici ile imha etti!`]);
          }
        }

        if (!intercepted && targetData.stats.warProtocol) {
          if (defenseTowers.length > 0) {
            // Each tower has a 20% chance to intercept the missile
            const interceptChance = Math.min(0.8, defenseTowers.length * 0.2);
            if (Math.random() < interceptChance) {
              intercepted = true;
              setNotifications(prev => [...prev, `${targetData.name} füzeyi havada imha etti!`]);
            } else {
              damage = Math.max(50, damage - (defenseTowers.length * 30));
            }
          }
        }

        if (!intercepted && newBuildings.length > 0) {
          // Find a random building to damage
          const targetIdx = Math.floor(Math.random() * newBuildings.length);
          const targetBuilding = { ...newBuildings[targetIdx] };
          
          targetBuilding.health = (targetBuilding.health || 500) - damage;
          
          if (targetBuilding.health <= 0) {
            newBuildings.splice(targetIdx, 1); // Destroyed
          } else {
            newBuildings[targetIdx] = targetBuilding;
          }
          setNotifications(prev => [...prev, `${targetData.name} adasına füze isabet etti! ${damage} hasar verildi!`]);
        }
        
        if (!intercepted) {
          newStats.population = Math.max(0, newStats.population - 5);
          newStats.happiness = Math.max(0, newStats.happiness - 20);
        }
        
        await updateDoc(doc(db, 'islands', targetId), { 
          buildings: newBuildings,
          stats: newStats,
          recentEvents: arrayUnion({
            id: Math.random().toString(36).substr(2, 9),
            type: intercepted ? 'missile_intercepted' : 'missile_hit',
            timestamp: Date.now(),
            from: island.name || island.ownerName
          })
        });
      }
      setActiveMissiles(prev => prev.filter(m => m.id !== missileId));
    }, 2000); // Wait for animation
  };

  const handleGetBonus = async () => {
    if (!island || !user) return;
    const newEuro = (island.resources.euro || 0) + 10000;
    await updateDoc(doc(db, 'islands', user.uid), { 'resources.euro': newEuro });
    setNotifications(prev => [...prev, '10.000 Euro bonus eklendi!']);
  };

  const handleAttack = async (shipId: string, targetId: string, targetType: 'ship' | 'building' | 'island') => {
    if (!island || !user) return;
    const newShips = island.ships.map(s => 
      s.id === shipId ? { ...s, status: 'attacking' as const, targetId, targetType } : s
    );
    await updateDoc(doc(db, 'islands', user.uid), { ships: newShips });
  };

  const handleSetDiplomacy = async (targetIslandId: string, status: Diplomacy['status']) => {
    if (!island || !user) return;
    const existingDiplomacy = island.diplomacy || [];
    const updatedDiplomacy = [...existingDiplomacy];
    const index = updatedDiplomacy.findIndex(d => d.targetIslandId === targetIslandId);
    
    if (index >= 0) {
      updatedDiplomacy[index] = { ...updatedDiplomacy[index], status };
    } else {
      updatedDiplomacy.push({ targetIslandId, status });
    }
    
    await updateDoc(doc(db, 'islands', user.uid), { diplomacy: updatedDiplomacy });
  };

  const handleResearch = async () => {
    if (!island || !user) return;
    const cost = island.stats.techLevel * 200;
    if (island.resources.euro < cost) {
      alert(`Yeterli Euro yok! ${cost} Euro gerekiyor.`);
      return;
    }

    await updateDoc(doc(db, 'islands', user.uid), {
      'resources.euro': island.resources.euro - cost,
      'stats.techPoints': island.stats.techPoints + 50
    });
  };

  const handlePlaceBuilding = async (type: string, x: number, y: number) => {
    if (!island || !user) return;

    const costs: Record<string, Partial<Resources>> = {
      house: { euro: 50, wood: 20 },
      farm: { wood: 30, food: 10 },
      mine: { wood: 50, stone: 20 },
      storage: { wood: 40, stone: 40 },
      lab: { euro: 200, electronics: 10 },
      oil_rig: { euro: 500, electronics: 50 },
      factory: { euro: 800, electronics: 100, stone: 200 },
      university: { euro: 1500, electronics: 200 },
      hospital: { euro: 1200, stone: 300, wood: 200 },
      bank: { euro: 2000, stone: 500 },
      missile_destroyer: { euro: 4000, stone: 1500, electronics: 500 },
      missile_silo: { euro: 5000, oil: 500, electronics: 300 },
      missile: { euro: 5000, oil: 500, electronics: 300 }, // Same cost as silo, gives both
      navy_base: { euro: 3000, stone: 1000, electronics: 500 },
      merchant: { euro: 500 },
      explorer: { euro: 300 },
      warship: { euro: 1000 },
      tank: { euro: 1500 },
    };

    const isShip = ['merchant', 'explorer', 'warship', 'tank'].includes(type);
    const distFromCenter = Math.sqrt(x * x + y * y);
    
    if (!isShip && distFromCenter > 15) {
      alert('Binalar sadece ada üzerine yerleştirilebilir!');
      setIsPlacing(null);
      return;
    }

    const cost = costs[type] || {};
    const canAfford = Object.entries(cost).every(
      ([res, val]) => (island.resources[res as keyof Resources] || 0) >= (val || 0)
    );

    if (!canAfford) {
      alert('Yeterli kaynak yok!');
      setIsPlacing(null);
      return;
    }

    const newResources = { ...island.resources };
    Object.entries(cost).forEach(([res, val]) => {
      (newResources[res as keyof Resources] as number) -= (val || 0);
    });

    const updates: any = {
      resources: newResources,
    };

    if (isShip) {
      // Place a port at the clicked location
      const newBuilding: Building = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'port',
        x,
        y,
        progress: 100,
        level: 1,
        health: 500,
        maxHealth: 500
      };
      
      // Place the ship in the sea, pushed out from the clicked location
      const dist = Math.sqrt(x * x + y * y) || 1;
      const shipX = x + (x / dist) * 20; // Pushed further out into water
      const shipY = y + (y / dist) * 20;

      const newShip: Ship = {
        id: Math.random().toString(36).substr(2, 9),
        type: type as any,
        x: shipX,
        y: shipY,
        cargo: {},
        status: 'idle',
        health: 500,
        maxHealth: 500,
        attackPower: type === 'warship' ? 50 : type === 'tank' ? 100 : 10,
        weaponType: type === 'warship' ? 'cannon' : type === 'tank' ? 'missile' : 'none'
      };

      updates.buildings = arrayUnion(newBuilding);
      updates.ships = arrayUnion(newShip);
    } else if (type === 'missile' || type === 'missile_silo' || type === 'missile_destroyer') {
      // Place a building and set progress to 100
      const newBuilding: Building = {
        id: Math.random().toString(36).substr(2, 9),
        type: (type === 'missile' ? 'missile_silo' : type) as any,
        x,
        y,
        progress: 100,
        level: 1,
        health: 500,
        maxHealth: 500
      };
      updates.buildings = arrayUnion(newBuilding);
      if (type === 'missile' || type === 'missile_silo') {
        updates['stats.missileCount'] = (island.stats.missileCount || 0) + 1;
      }
    } else {
      const newBuilding: Building = {
        id: Math.random().toString(36).substr(2, 9),
        type: type as any,
        x,
        y,
        progress: 0,
        level: 1,
        health: 500,
        maxHealth: 500
      };
      updates.buildings = arrayUnion(newBuilding);
    }

    const updatedCreatures = island.creatures.map(c => {
      if (c.role === 'soldier' && (type === 'navy_base' || type === 'port' || type === 'missile_silo' || type === 'missile' || isShip)) {
        return { ...c, targetX: x, targetY: y, state: 'moving' as const };
      }
      if (c.role === 'scientist' && (type === 'lab' || type === 'university')) {
        return { ...c, targetX: x, targetY: y, state: 'moving' as const };
      }
      return c;
    });
    updates.creatures = updatedCreatures;

    await updateDoc(doc(db, 'islands', user.uid), updates);

    setIsPlacing(null);
  };

  const handleSelectTargetIsland = (targetId: string) => {
    if (selectedShipId) {
      // Find ship's target pos (simplified: use island's world pos)
      const targetIsland = npcIslands.find(i => i.id === targetId) || (targetId === user?.uid ? island : null);
      if (targetIsland) {
        // Simplified world pos calculation (same as WorldMap)
        const seed = targetId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const isSelf = targetId === user?.uid;
        const x = isSelf ? 0 : (Math.sin(seed) * 160);
        const y = isSelf ? 0 : (Math.cos(seed) * 160);
        handleSendShip(selectedShipId, x, y);
      }
      setSelectedShipId(null);
    } else if (selectedSiloId) {
      handleLaunchMissile(targetId);
      setSelectedSiloId(null);
    }
    setViewingIslandId(null);
  };

  const handleUpdateCreatureRole = async (creatureId: string, newRole: Creature['role']) => {
    if (!island || !user) return;
    const updatedCreatures = island.creatures.map(c => {
      if (c.id === creatureId) {
        return { ...c, role: newRole };
      }
      return c;
    });
    await updateDoc(doc(db, 'islands', user.uid), {
      creatures: updatedCreatures
    });
  };

  const handleRecruitCreature = async (type: Creature['type'], role: Creature['role']) => {
    if (!island || !user) return;
    const cost = { euro: 100, food: 50 };
    if (island.resources.euro < cost.euro || island.resources.food < cost.food) {
      alert('İşe almak için yeterli kaynak yok!');
      return;
    }

    const newCreature: Creature = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      role,
      x: 0,
      y: 0,
      health: 100,
      state: 'idle'
    };

    await updateDoc(doc(db, 'islands', user.uid), {
      'resources.euro': island.resources.euro - cost.euro,
      'resources.food': island.resources.food - cost.food,
      creatures: [...island.creatures, newCreature]
    });
  };

  const handleBuildShip = async (type: 'merchant' | 'explorer' | 'warship' | 'tank') => {
    if (!island || !user) return;
    const costs: Record<string, Partial<Resources>> = {
      merchant: { euro: 500, wood: 200 },
      explorer: { euro: 300, wood: 150 },
      warship: { euro: 1000, wood: 400, electronics: 50 },
      tank: { euro: 1500, stone: 300, electronics: 100 }
    };
    const cost = costs[type];
    if (island.resources.euro < (cost.euro || 0) || (cost.wood && island.resources.wood < cost.wood) || (cost.stone && island.resources.stone < cost.stone) || (cost.electronics && island.resources.electronics < cost.electronics)) {
      alert('Araç üretmek için yeterli kaynak yok!');
      return;
    }

    const port = island.buildings.find(b => b.type === 'port' || b.type === 'navy_base');
    let spawnX = 0;
    let spawnY = 0;

    if (type === 'tank') {
      // Tank spawns on land
      spawnX = (Math.random() - 0.5) * 10;
      spawnY = (Math.random() - 0.5) * 10;
    } else {
      // Ships spawn in water
      if (port) {
        // Spawn near port but further out in water
        const dirX = port.x === 0 ? 1 : port.x / Math.abs(port.x);
        const dirY = port.y === 0 ? 1 : port.y / Math.abs(port.y);
        spawnX = port.x + (dirX * 5);
        spawnY = port.y + (dirY * 5);
      } else {
        // Random water edge
        const angle = Math.random() * Math.PI * 2;
        spawnX = Math.cos(angle) * 18;
        spawnY = Math.sin(angle) * 18;
      }
    }

    const newShip: Ship = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: spawnX,
      y: spawnY,
      cargo: {},
      status: 'idle',
      health: type === 'warship' || type === 'tank' ? 1000 : 500,
      maxHealth: type === 'warship' || type === 'tank' ? 1000 : 500,
      attackPower: type === 'warship' || type === 'tank' ? 50 : 0,
      weaponType: type === 'warship' || type === 'tank' ? 'cannon' : 'none'
    };

    await updateDoc(doc(db, 'islands', user.uid), {
      'resources.euro': island.resources.euro - (cost.euro || 0),
      'resources.wood': island.resources.wood - (cost.wood || 0),
      'resources.stone': island.resources.stone - (cost.stone || 0),
      'resources.electronics': island.resources.electronics - (cost.electronics || 0),
      ships: [...(island.ships || []), newShip]
    });
  };

  const handleSendShip = async (shipId: string, targetX: number, targetY: number) => {
    if (!island || !user) return;
    const newShips = island.ships.map(s => 
      s.id === shipId ? { ...s, targetX, targetY, status: 'sailing' as const } : s
    );
    await updateDoc(doc(db, 'islands', user.uid), { ships: newShips });
  };

  const handleExploreIsland = async (shipId: string, islandId: string) => {
    if (!island || !user) return;
    const newShips = island.ships.map(s => 
      s.id === shipId ? { ...s, targetIslandId: islandId, status: 'exploring' as const } : s
    );
    await updateDoc(doc(db, 'islands', user.uid), { ships: newShips });
  };

  const handleUpdateWorkStatus = async (status: 'working' | 'resting') => {
    if (!island || !user) return;
    const newStats = { ...island.stats, workStatus: status };
    await updateDoc(doc(db, 'islands', user.uid), { stats: newStats });
  };

  const handleInvest = async (sector: keyof NonNullable<IslandStats['investments']>, amount: number) => {
    if (!island || !user) return;
    if (island.resources.euro < amount) {
      alert('Not enough Euro to invest!');
      return;
    }
    const newInvestments = { ...(island.stats.investments || { military: 0, science: 0, agriculture: 0, sports: 0 }) };
    newInvestments[sector] = (newInvestments[sector] || 0) + 1;
    await updateDoc(doc(db, 'islands', user.uid), { 
      'stats.investments': newInvestments,
      'resources.euro': island.resources.euro - amount
    });
  };

  const handleToggleWarProtocol = async () => {
    if (!island || !user) return;
    await updateDoc(doc(db, 'islands', user.uid), { 'stats.warProtocol': !island.stats.warProtocol });
  };

  const handleSettle = async (islandId: string) => {
    if (!island || !user) return;
    const target = npcIslands.find(i => i.id === islandId) || otherIslands.find(i => i.id === islandId);
    if (!target) return;

    if (island.resources.euro < 5000) {
      alert('Yeni bir adaya yerleşmek için 5000 Euro gerekiyor!');
      return;
    }

    // Settlement logic: In this game, we'll just "take over" the NPC island
    await updateDoc(doc(db, 'islands', islandId), {
      ownerId: user.uid,
      ownerName: profile?.username || user.email,
      name: `${profile?.username || user.email}'s New Colony`
    });

    await updateDoc(doc(db, 'islands', user.uid), {
      'resources.euro': island.resources.euro - 5000
    });

    setNotifications(prev => [...prev, `Yeni adaya yerleşildi: ${target.name}`]);
  };

  const handleBuyMissile = async () => {
    if (!island || !user) return;
    const hasSilo = island.buildings.some(b => b.type === 'missile_silo' && b.progress >= 100);
    if (!hasSilo) {
      alert('You need a fully built Missile Silo to store missiles!');
      return;
    }
    if (island.resources.euro < 1000) {
      alert('Not enough Euro! Missiles cost 1000 Euro.');
      return;
    }
    await updateDoc(doc(db, 'islands', user.uid), {
      'resources.euro': island.resources.euro - 1000,
      'stats.missileCount': island.stats.missileCount + 1
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = form.email.value;
    const password = form.password.value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Missile Animation Loop
  useEffect(() => {
    if (activeMissiles.length === 0) return;
    const interval = setInterval(() => {
      setActiveMissiles(prev => {
        const next = prev.map(m => ({ ...m, progress: m.progress + 0.05 }))
          .filter(m => m.progress < 1);
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [activeMissiles.length]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = form.email.value;
    const password = form.password.value;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading || (user && !island)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-blue-950 text-white gap-4">
        <Loader2 className="animate-spin" size={48} />
        <p className="text-sm font-bold animate-pulse">Oyun Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onGoogleLogin={handleLogin} onEmailLogin={handleEmailLogin} onEmailSignup={handleEmailSignup} />;
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {currentIsland && (
        <>
          {viewMode === '3D' ? (
            <Scene 
              island={currentIsland} 
              onPlaceBuilding={handlePlaceBuilding} 
              isPlacing={viewingIslandId && viewingIslandId !== 'map' ? null : isPlacing} 
              onUpdateCreatureRole={handleUpdateCreatureRole}
              onSelectShip={(id) => {
                setSelectedShipId(id);
                setNotifications(prev => [...prev.slice(-4), "Hedef adayı seçmek için Dünya Haritasına git veya bir adayı ziyaret et!"]);
              }}
              onSelectBuilding={(id, type) => {
                if (type === 'missile_silo') {
                  setSelectedSiloId(id);
                  setNotifications(prev => [...prev.slice(-4), "Hedef adayı seçmek için Dünya Haritasına git veya bir adayı ziyaret et!"]);
                }
              }}
              onSelectTargetIsland={handleSelectTargetIsland}
              selectedShipId={selectedShipId}
              selectedSiloId={selectedSiloId}
              activeMissiles={activeMissiles}
            />
          ) : (
            <Map2D
              island={currentIsland}
              islands={[island, ...otherIslands]}
              currentIslandId={user.uid}
              isPlacing={viewingIslandId ? null : isPlacing}
              onPlaceBuilding={handlePlaceBuilding}
              onUpdateCreatureRole={handleUpdateCreatureRole}
              onLaunchMissile={handleLaunchMissile}
              missileCount={currentIsland.stats.missileCount || 0}
              discoveredIslandIds={currentIsland.discoveredIslandIds || []}
              activeMissiles={activeMissiles}
            />
          )}
          <HUD 
            resources={island?.resources || INITIAL_RESOURCES} 
            stats={island?.stats || { 
              population: 0, 
              maxPopulation: 0, 
              happiness: 0, 
              taxRate: 0, 
              techPoints: 0, 
              techLevel: 1, 
              missileCount: 0,
              currencyType: 'Euro',
              ideology: 'Neutral',
              activeCrisis: 'None',
              crisisDuration: 0,
              gdp: 0,
              workStatus: 'working',
              debt: 0,
              investments: { military: 0, science: 0, agriculture: 0, sports: 0 },
              warProtocol: false
            }}
            creatures={island?.creatures || []}
            ships={island?.ships || []}
            otherIslands={otherIslands}
            onSelectBuilding={handleSelectBuilding} 
            isPlacing={isPlacing}
            onOpenAlliances={() => alert('Alliances coming soon!')}
            onOpenTrades={() => setViewingIslandId(viewingIslandId ? null : 'map')}
            onUpdateTax={(rate) => {
              if (user) {
                updateDoc(doc(db, 'islands', user.uid), {
                  'stats.taxRate': rate
                });
              }
            }}
            onBuyResource={handleBuyResource}
            onResearch={handleResearch}
            onRecruitCreature={handleRecruitCreature}
            onBuildShip={handleBuildShip}
            onSendShip={handleSendShip}
            onAttack={handleAttack}
            onLaunchMissile={handleLaunchMissile}
            onSetDiplomacy={handleSetDiplomacy}
            onUpdateWorkStatus={handleUpdateWorkStatus}
            onInvest={handleInvest}
            onToggleWarProtocol={handleToggleWarProtocol}
            onBuyMissile={handleBuyMissile}
            onGetBonus={handleGetBonus}
            selectedShipId={selectedShipId}
            selectedSiloId={selectedSiloId}
            onClearSelection={() => {
              setSelectedShipId(null);
              setSelectedSiloId(null);
            }}
            viewMode={viewMode}
            onToggleView={() => setViewMode(prev => prev === '3D' ? '2D' : '3D')}
            notifications={notifications}
          />

          {/* Crisis Overlays */}
          <AnimatePresence>
            {island && island.resources.food <= 0 && island.stats.population > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-red-600/90 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-2xl border border-red-400 animate-pulse"
              >
                <Utensils size={20} />
                FAMINE! PEOPLE ARE STARVING!
              </motion.div>
            )}
            {island && island.stats.happiness < 30 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-36 left-1/2 -translate-x-1/2 z-40 bg-orange-600/90 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-2xl border border-orange-400"
              >
                <Heart size={20} />
                UNREST! HAPPINESS IS CRITICALLY LOW!
              </motion.div>
            )}
          </AnimatePresence>

          {/* World Map Overlay */}
          <AnimatePresence>
            {viewingIslandId === 'map' && (
              <WorldMap 
                onClose={() => {
                  setViewingIslandId(null);
                  setSelectedShipId(null);
                  setSelectedSiloId(null);
                }}
                islands={[island!, ...otherIslands, ...npcIslands]}
                currentIslandId={user.uid}
                onVisit={(id) => setViewingIslandId(id === user.uid ? null : id)}
                onLaunchMissile={(targetId) => {
                  handleLaunchMissile(targetId);
                  setSelectedSiloId(null);
                }}
                missileCount={island?.stats.missileCount || 0}
                discoveredIslandIds={island?.discoveredIslandIds || [user.uid]}
                onSendShip={(shipId, x, y) => {
                  handleSendShip(shipId, x, y);
                  setSelectedShipId(null);
                }}
                ships={island?.ships || []}
                onSettle={handleSettle}
                externalSelectedShipId={selectedShipId}
                externalSelectedSiloId={selectedSiloId}
                activeMissiles={activeMissiles}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-2">
        <Icon className="text-blue-400" size={32} />
      </div>
      <h3 className="font-bold uppercase tracking-widest text-sm">{title}</h3>
      <p className="text-xs text-white/40">{desc}</p>
    </div>
  );
}
