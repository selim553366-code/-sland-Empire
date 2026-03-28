import { useState, useEffect, useCallback } from 'react';
import { auth, db } from './firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, where, arrayUnion } from 'firebase/firestore';
import { Scene } from './components/Game/Scene';
import { HUD } from './components/UI/HUD';
import { WorldMap } from './components/UI/WorldMap';
import { Login } from './components/UI/Login';
import { Island, UserProfile, Resources, Building, Creature, Ship, Diplomacy } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Loader2, Trophy, Shield, Swords, Utensils, Heart } from 'lucide-react';

const INITIAL_RESOURCES: Resources = {
  euro: 500,
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
  const [otherIslands, setOtherIslands] = useState<Island[]>([]);
  const [npcIslands, setNpcIslands] = useState<Island[]>([]);
  const [viewingIslandId, setViewingIslandId] = useState<string | null>(null);

  // Generate NPC islands once
  useEffect(() => {
    const npcs: Island[] = [];
    const names = ['Tortuga', 'Atlantis', 'Avalon', 'Lemuria', 'Mu', 'Shangri-La'];
    for (let i = 0; i < 6; i++) {
      npcs.push({
        id: `npc-${i}`,
        name: names[i],
        ownerId: 'system',
        ownerName: 'Ancient Civilization',
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
            workStatus: 'working'
          };
        }
        if (!data.stats.currencyType) data.stats.currencyType = 'Euro';
        if (!data.stats.ideology) data.stats.ideology = 'Neutral';
        if (!data.stats.activeCrisis) data.stats.activeCrisis = 'None';
        if (!data.stats.crisisDuration) data.stats.crisisDuration = 0;
        if (!data.stats.gdp) data.stats.gdp = 100;
        data.buildings = (data.buildings || []).map(b => ({
          ...b,
          health: b.health ?? 500,
          maxHealth: b.maxHealth ?? 500
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
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
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
              workStatus: 'working'
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
            workStatus: 'working'
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
        setIsland(data);
      }
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
      } else if (stats.population < stats.maxPopulation) {
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
      
      const baseIncome = {
        euro: stats.population * (stats.taxRate / 100) * 0.2 * incomeMultiplier,
        food: 0.2,
        wood: 0.2,
        stone: 0.1,
        oil: 0,
        fruits: 0,
        electronics: 0,
        tech: 0.02 * stats.population
      };

      buildings.forEach(b => {
        if (b.progress < 100) b.progress += 5; // Faster progress
        
        if (b.progress >= 100) {
          if (b.type === 'farm') baseIncome.food += 2 * efficiency;
          if (b.type === 'mine') baseIncome.stone += 1 * efficiency;
          if (b.type === 'storage') baseIncome.euro += 1 * efficiency;
          if (b.type === 'lab') baseIncome.tech += 1 * efficiency;
          if (b.type === 'oil_rig') baseIncome.oil += 0.5 * efficiency;
          if (b.type === 'factory') {
            const scientistCount = creatures.filter(c => c.role === 'scientist').length;
            baseIncome.electronics += (0.3 + (scientistCount * 0.1)) * efficiency;
          }
          if (b.type === 'bank') baseIncome.euro += 5 * efficiency;
          if (b.type === 'university') baseIncome.tech += 2 * efficiency;
          if (b.type === 'hospital') stats.happiness += 0.1;
          
          if (b.type === 'house') {
            stats.maxPopulation = 20 + (buildings.filter(x => x.type === 'house' && x.progress >= 100).length * 15);
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

      resources.euro += baseIncome.euro;
      resources.food += baseIncome.food;
      resources.wood += baseIncome.wood;
      resources.stone += baseIncome.stone;
      resources.oil += baseIncome.oil;
      resources.fruits += baseIncome.fruits;
      resources.electronics += baseIncome.electronics;
      stats.techPoints += baseIncome.tech;

      if (stats.techPoints >= stats.techLevel * 120) {
        stats.techPoints -= stats.techLevel * 120;
        stats.techLevel += 1;
      }

      // 6. Creature AI & Movement
      let miningEuroBonus = 0;
      const newEvents: any[] = [];
      const newCreatures = [...creatures];
      
      // Spawn or remove creatures to match population
      const targetCreatureCount = Math.min(20, Math.floor(stats.population / 2));
      
      // Spawn new creatures
      if (newCreatures.length < targetCreatureCount) {
        const roles: Creature['role'][] = ['worker', 'farmer', 'scientist', 'artist', 'politician', 'miner'];
        const types: Creature['type'][] = ['human', 'robot', 'cyborg'];
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
      }
      // Remove creatures if population decreased
      else if (newCreatures.length > targetCreatureCount) {
        newCreatures.pop();
      }

      // Population growth
      if (stats.population < stats.maxPopulation && Math.random() < 0.05) {
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
            return true;
          });

          if (relevantBuildings.length > 0 && Math.random() > 0.3) {
            const target = relevantBuildings[Math.floor(Math.random() * relevantBuildings.length)];
            creature.targetX = target.x + (Math.random() - 0.5) * 5;
            creature.targetY = target.y + (Math.random() - 0.5) * 5;
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
            miningEuroBonus += 15; // Found some euro!
            newEvents.push({
              id: Math.random().toString(36).substr(2, 9),
              type: 'euro_found',
              x: creature.x,
              y: creature.y,
              amount: 15,
              timestamp: Date.now()
            });
          }

          // Miner role logic: find euro anywhere
          if (creature.role === 'miner' && Math.random() < 0.1) {
            miningEuroBonus += 5;
          }

          if (Math.random() < 0.3) {
            creature.state = 'idle';
          }
        }

        return creature;
      });

      // 7. Ship Movement & Combat
      let tradeIncome = 0;
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
      alert('Not enough euro!');
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
      alert('No missiles available!');
      return;
    }

    // Launch logic
    await updateDoc(doc(db, 'islands', user.uid), { 'stats.missileCount': island.stats.missileCount - 1 });
    
    // Impact logic: damage target island buildings
    const targetDoc = await getDoc(doc(db, 'islands', targetId));
    if (targetDoc.exists()) {
      const targetData = targetDoc.data() as Island;
      const newBuildings = [...targetData.buildings];
      
      if (newBuildings.length > 0) {
        // Find a random building to damage
        const targetIdx = Math.floor(Math.random() * newBuildings.length);
        const targetBuilding = { ...newBuildings[targetIdx] };
        
        targetBuilding.health = (targetBuilding.health || 500) - 200;
        
        if (targetBuilding.health <= 0) {
          newBuildings.splice(targetIdx, 1); // Destroyed
        } else {
          newBuildings[targetIdx] = targetBuilding;
        }
      }

      const newStats = { ...targetData.stats };
      newStats.population = Math.max(0, newStats.population - 5);
      newStats.happiness = Math.max(0, newStats.happiness - 20);
      
      await updateDoc(doc(db, 'islands', targetId), { 
        buildings: newBuildings,
        stats: newStats,
        recentEvents: arrayUnion({
          id: Math.random().toString(36).substr(2, 9),
          type: 'missile_hit',
          timestamp: Date.now(),
          from: island.name
        })
      });
      alert('Missile impact confirmed!');
    }
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
      alert(`Not enough euro! Need ${cost} Euro.`);
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
      missile_silo: { euro: 5000, oil: 500, electronics: 300 },
      navy_base: { euro: 3000, stone: 1000, electronics: 500 },
    };

    const cost = costs[type];
    const canAfford = Object.entries(cost).every(
      ([res, val]) => island.resources[res as keyof Resources] >= (val || 0)
    );

    if (!canAfford) {
      alert('Not enough resources!');
      return;
    }

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

    const newResources = { ...island.resources };
    Object.entries(cost).forEach(([res, val]) => {
      (newResources[res as keyof Resources] as number) -= (val || 0);
    });

    await updateDoc(doc(db, 'islands', user.uid), {
      buildings: arrayUnion(newBuilding),
      resources: newResources
    });

    setIsPlacing(null);
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
      alert('Not enough resources to recruit!');
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

  const handleBuildShip = async (type: 'merchant' | 'explorer' | 'warship') => {
    if (!island || !user) return;
    const costs = {
      merchant: { euro: 500, wood: 200 },
      explorer: { euro: 300, wood: 150 },
      warship: { euro: 1000, wood: 400, electronics: 50 }
    };
    const cost = costs[type];
    if (island.resources.euro < cost.euro || island.resources.wood < (cost.wood || 0)) {
      alert('Not enough resources to build ship!');
      return;
    }

    const newShip: Ship = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 0,
      y: 0,
      cargo: {},
      status: 'idle',
      health: type === 'warship' ? 1000 : 500,
      maxHealth: type === 'warship' ? 1000 : 500,
      attackPower: type === 'warship' ? 50 : 0,
      weaponType: type === 'warship' ? 'cannon' : 'none'
    };

    await updateDoc(doc(db, 'islands', user.uid), {
      'resources.euro': island.resources.euro - cost.euro,
      'resources.wood': island.resources.wood - (cost.wood || 0),
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

  const handleUpdateWorkStatus = async (status: 'working' | 'resting') => {
    if (!island || !user) return;
    const newStats = { ...island.stats, workStatus: status };
    await updateDoc(doc(db, 'islands', user.uid), { stats: newStats });
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

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-blue-950 text-white">
        <Loader2 className="animate-spin" size={48} />
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
          <Scene 
            island={currentIsland} 
            onPlaceBuilding={handlePlaceBuilding} 
            isPlacing={viewingIslandId ? null : isPlacing} 
            onUpdateCreatureRole={handleUpdateCreatureRole}
          />
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
              workStatus: 'working'
            }}
            creatures={island?.creatures || []}
            ships={island?.ships || []}
            otherIslands={otherIslands}
            onSelectBuilding={setIsPlacing} 
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
                onClose={() => setViewingIslandId(null)}
                islands={[island!, ...otherIslands, ...npcIslands]}
                currentIslandId={user.uid}
                onVisit={(id) => setViewingIslandId(id === user.uid ? null : id)}
                onLaunchMissile={handleLaunchMissile}
                missileCount={island?.stats.missileCount || 0}
                discoveredIslandIds={island?.discoveredIslandIds || [user.uid]}
                onSendShip={handleSendShip}
                ships={island?.ships || []}
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
