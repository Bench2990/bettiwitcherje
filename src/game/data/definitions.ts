import type { AchievementDef, BossDef, CardDef, EnemyDef, PermanentDef, SpellDef, UpgradeDef, WeaponDef } from '../types';

export const BALANCE = {
  arena: 2800, maxEnemies: 105, maxPickups: 150, maxProjectiles: 100,
  swordRange: 78, swordArc: 1.9, hurtGrace: 0.85, comboWindow: 6.5,
  dodgeDuration: 0.28, dodgeSpeed: 660, bossTimes: [180, 360, 600],
};

export const ENEMIES: EnemyDef[] = [
  { id: 'ghoul', name: 'Grave Ghoul', hp: 25, speed: 49, damage: 9, interval: 1.3, xp: 5, gold: 2, radius: 13, color: 0x879478 },
  { id: 'drowner', name: 'Mire Drowner', hp: 20, speed: 86, damage: 7, interval: 1.1, xp: 6, gold: 2, radius: 12, color: 0x557e84 },
  { id: 'wraith', name: 'Hollow Wraith', hp: 36, speed: 61, damage: 12, interval: 1.5, xp: 10, gold: 3, radius: 14, color: 0xa39ac9 },
  { id: 'necrophage', name: 'Rotbound Brute', hp: 105, speed: 34, damage: 21, interval: 1.9, xp: 16, gold: 5, radius: 20, color: 0x8a7964 },
  { id: 'hound', name: 'Wild Hound', hp: 32, speed: 90, damage: 12, interval: 2.8, xp: 9, gold: 3, radius: 12, color: 0x80716a },
  { id: 'cultist', name: 'Dark Cultist', hp: 48, speed: 45, damage: 12, interval: 2.8, xp: 13, gold: 4, radius: 13, color: 0x8c5e79 },
];

export const SPELLS: SpellDef[] = [
  { id: 'flame', name: 'Flame Wave', short: 'Flame', icon: 'flame', color: '#e99b62', cooldown: 6, description: 'A cone of searing fire. Deals 34 magic damage and burns for 4 seconds.' },
  { id: 'shield', name: 'Guardian Shield', short: 'Shield', icon: 'shield', color: '#dec98a', cooldown: 13, description: 'A golden ward absorbs the next hit and bursts, repelling nearby enemies.' },
  { id: 'force', name: 'Force Blast', short: 'Force', icon: 'wind', color: '#8ec8e2', cooldown: 8, description: 'A crushing shockwave deals 24 magic damage, knocks back, and stuns.' },
  { id: 'trap', name: 'Spectral Trap', short: 'Trap', icon: 'rune', color: '#b9a0ef', cooldown: 11, description: 'An 8-second rune slows enemies and tears through intangible wraiths.' },
  { id: 'charm', name: 'Mind Charm', short: 'Charm', icon: 'eye', color: '#96c99b', cooldown: 15, description: 'Bend a nearby monster to your will for 12 seconds. Bosses are immune.' },
];

export const WEAPONS: WeaponDef[] = [
  { id: 'worn', name: 'Worn Silver Sword', rarity: 'common', damage: 12, interval: 0.75, crit: 0, color: 0xc6d4cc, effect: 'Faithful steel. A balanced blade for the long road.', icon: 'sword' },
  { id: 'hunter', name: "Hunter’s Blade", rarity: 'rare', damage: 15, interval: 0.57, crit: 0.02, color: 0x9bc2bd, effect: 'Light and relentless. Attacks 24% faster.', icon: 'sword' },
  { id: 'moonsteel', name: 'Moonsteel', rarity: 'rare', damage: 19, interval: 0.7, crit: 0.14, color: 0xa1c7f0, effect: 'Moon-kissed silver. +14% critical chance.', icon: 'moon' },
  { id: 'bloodfang', name: 'Bloodfang', rarity: 'epic', damage: 23, interval: 0.67, crit: 0.05, color: 0xde7c81, effect: 'Drink the darkness. Sword hits restore 2% of damage as health.', icon: 'drop' },
  { id: 'stormbringer', name: 'Stormbringer', rarity: 'epic', damage: 25, interval: 0.64, crit: 0.08, color: 0x9eaeed, effect: '25% chance to chain lightning through three enemies.', icon: 'bolt' },
  { id: 'infernal', name: 'Infernal Edge', rarity: 'epic', damage: 28, interval: 0.73, crit: 0.04, color: 0xf8a264, effect: 'An ember in the abyss. Every sword hit ignites its target.', icon: 'flame' },
  { id: 'ancient', name: 'Ancient Silver Blade', rarity: 'legendary', damage: 38, interval: 0.59, crit: 0.13, color: 0xf6dfa0, effect: 'Forged before the first kings. Every third slash strikes twice.', icon: 'crown' },
];

export const CARDS: CardDef[] = [
  { id: 'flaming', name: 'Flaming Blade', rarity: 'rare', icon: 'flame', description: 'Sword strikes ignite enemies for 4 seconds.', lore: 'Let silver burn where sunlight cannot.', synergy: 'Explosive Death: burning foes trigger chain explosions.' },
  { id: 'wolf', name: 'Spirit Wolf', rarity: 'epic', icon: 'wolf', description: 'A spectral wolf hunts beside you, striking every 1.2 seconds.', lore: 'Even the lone hunter has a shadow.', synergy: 'Hunter’s Instinct: your companion can critically strike.' },
  { id: 'secondWind', name: 'Second Wind', rarity: 'legendary', icon: 'heart', description: 'Once per run, survive a lethal blow with 30% health.', lore: 'Death will have to ask twice.' },
  { id: 'bloodPact', name: 'Blood Pact', rarity: 'epic', icon: 'drop', description: '+40% sword damage, but lose 25% maximum health.', lore: 'Power always remembers its price.' },
  { id: 'golden', name: 'Golden Touch', rarity: 'common', icon: 'coins', description: 'Find 30% more gold from monsters and treasure.', lore: 'Fortune favors the bloodstained.' },
  { id: 'thunder', name: 'Thunder Strike', rarity: 'epic', icon: 'bolt', description: 'Every tenth sword swing chains lightning through nearby enemies.', lore: 'The storm knows your name.' },
  { id: 'frozen', name: 'Frozen Heart', rarity: 'rare', icon: 'snow', description: 'Critical hits slow enemies by 55% for 3 seconds.', lore: 'A heart of winter. A blade of ice.', synergy: 'Phantom Step: dodging leaves a freezing trail.' },
  { id: 'vampire', name: 'Vampire’s Gift', rarity: 'rare', icon: 'heart', description: 'Every ten kills restore 8 health.', lore: 'Borrowed life tastes of iron.' },
  { id: 'instinct', name: 'Hunter’s Instinct', rarity: 'rare', icon: 'eye', description: '+20% critical chance against bosses.', lore: 'Every monster has a weakness.', synergy: 'Spirit Wolf: companion gains 25% critical chance.' },
  { id: 'echo', name: 'Arcane Echo', rarity: 'epic', icon: 'sparkles', description: 'Magic has a 25% chance to echo at no extra cost.', lore: 'The old words speak themselves again.', synergy: 'Ancient Relic: echo chance increases to 45%.' },
  { id: 'explosive', name: 'Explosive Death', rarity: 'epic', icon: 'bomb', description: 'Burning enemies explode for 28 magic damage on death.', lore: 'An ending can be a beginning.', synergy: 'Flaming Blade: chain explosions ignite nearby enemies.' },
  { id: 'phantom', name: 'Phantom Step', rarity: 'rare', icon: 'wind', description: 'Dodging leaves an afterimage that damages nearby foes.', lore: 'Be where the blade is not.', synergy: 'Frozen Heart: your afterimage becomes a frost trail.' },
  { id: 'iron', name: 'Iron Skin', rarity: 'common', icon: 'shield', description: 'Gain 6 additional armor while below 50% health.', lore: 'The wounded wolf bites deepest.' },
  { id: 'crown', name: 'Cursed Crown', rarity: 'legendary', icon: 'crown', description: 'Gain 50% more experience. Enemies deal 20% more damage.', lore: 'Knowledge is never innocent.' },
  { id: 'relic', name: 'Ancient Relic', rarity: 'legendary', icon: 'rune', description: 'Reduce all spell and dodge cooldowns by 22%.', lore: 'A fragment of the world before.', synergy: 'Arcane Echo: magic echoes more frequently.' },
];

export const UPGRADES: UpgradeDef[] = [
  { id: 'damage', name: 'Silver Edge', description: '+20% sword damage.', rarity: 'common', icon: 'sword', max: 8 },
  { id: 'speed', name: 'Quickening', description: 'Attack 15% faster.', rarity: 'common', icon: 'wind', max: 6 },
  { id: 'health', name: 'Wolf’s Vitality', description: '+20 maximum health. Restore 20 health.', rarity: 'common', icon: 'heart', max: 6 },
  { id: 'heal', name: 'Second Breath', description: 'Restore 35 health immediately.', rarity: 'common', icon: 'potion', max: 99 },
  { id: 'move', name: 'Fleet of Foot', description: '+10% movement speed.', rarity: 'common', icon: 'boot', max: 4 },
  { id: 'crit', name: 'Killer Instinct', description: '+8% critical hit chance.', rarity: 'rare', icon: 'eye', max: 6 },
  { id: 'magic', name: 'Elder Blood', description: '+25% magic and burning damage. Greater spell area.', rarity: 'rare', icon: 'sparkles', max: 6 },
  { id: 'cooldown', name: 'Runic Flow', description: 'Reduce spell cooldowns by 10%.', rarity: 'rare', icon: 'rune', max: 5 },
  { id: 'pickup', name: 'Magnetic Soul', description: '+35% experience and gold pickup radius.', rarity: 'common', icon: 'gem', max: 4 },
  { id: 'slash', name: 'Twin Fangs', description: 'Each attack releases one additional sword slash.', rarity: 'legendary', icon: 'swords', max: 2 },
  { id: 'burn', name: 'Embersteel', description: 'Sword attacks burn enemies. Further ranks strengthen the burn.', rarity: 'epic', icon: 'flame', max: 3 },
  { id: 'lifesteal', name: 'Sanguine Steel', description: 'Heal for 2% of sword damage dealt.', rarity: 'epic', icon: 'drop', max: 3 },
  { id: 'armor', name: 'Studded Resolve', description: '+2 armor. Each point reduces incoming damage.', rarity: 'common', icon: 'shield', max: 5 },
  { id: 'dodge', name: 'Ghost Dance', description: 'Dodge recharges 15% faster.', rarity: 'rare', icon: 'wind', max: 4 },
  { id: 'gold', name: 'Bounty Hunter', description: 'Collect 25% more gold.', rarity: 'common', icon: 'coins', max: 4 },
  { id: 'force', name: 'Learn Force Blast', description: 'Unlock a stunning blue shockwave. Equip it in the pause menu.', rarity: 'rare', icon: 'wind', max: 1 },
  { id: 'trap', name: 'Learn Spectral Trap', description: 'Unlock a slowing, wraith-piercing rune. Equip it while paused.', rarity: 'rare', icon: 'rune', max: 1 },
  { id: 'charm', name: 'Learn Mind Charm', description: 'Unlock the power to turn a monster into an ally.', rarity: 'epic', icon: 'eye', max: 1 },
];

export const BOSSES: BossDef[] = [
  { id: 'guardian', name: 'Ancient Forest Guardian', title: 'THE ROOT OF ALL EVIL', time: 180, hp: 1700, speed: 32, damage: 24, color: 0xa1ad76, radius: 42 },
  { id: 'vampire', name: 'Crimson Vampire', title: 'BLOOD OF THE FORGOTTEN', time: 360, hp: 3500, speed: 81, damage: 27, color: 0xd2747d, radius: 29 },
  { id: 'queen', name: 'Wraith Queen', title: 'THE LAST LIGHT FADES', time: 600, hp: 6200, speed: 54, damage: 30, color: 0xb8a2e2, radius: 35 },
];

export const PERMANENTS: PermanentDef[] = [
  { id: 'health', name: 'Vitality', description: '+10 starting health per rank.', icon: 'heart', max: 5, baseCost: 65, amount: '+10 HP' },
  { id: 'damage', name: 'Silver Mastery', description: '+5% sword damage per rank.', icon: 'sword', max: 5, baseCost: 85, amount: '+5% DMG' },
  { id: 'speed', name: 'Wolf’s Stride', description: '+3% movement speed per rank.', icon: 'boot', max: 5, baseCost: 60, amount: '+3% SPD' },
  { id: 'crit', name: 'Keen Eye', description: '+2% critical chance per rank.', icon: 'eye', max: 5, baseCost: 90, amount: '+2% CRIT' },
  { id: 'armor', name: 'Leather & Steel', description: '+1 starting armor per rank.', icon: 'shield', max: 5, baseCost: 80, amount: '+1 ARMOR' },
  { id: 'pickup', name: 'Hunter’s Reach', description: '+12% pickup radius per rank.', icon: 'gem', max: 5, baseCost: 45, amount: '+12% REACH' },
  { id: 'potions', name: 'Alchemist’s Pouch', description: '+1 potion capacity and starting healing potion per rank.', icon: 'potion', max: 3, baseCost: 100, amount: '+1 POTION' },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first', name: 'First Blood', description: 'Slay your first monster.', icon: 'sword', goal: 1, key: 'kills' },
  { id: 'hunter', name: 'Monster Hunter', description: 'Slay 100 monsters across all hunts.', icon: 'wolf', goal: 100, key: 'kills' },
  { id: 'slayer', name: 'Slayer of a Thousand', description: 'Slay 1,000 monsters.', icon: 'swords', goal: 1000, key: 'kills' },
  { id: 'untouchable', name: 'Untouchable', description: 'Survive 2 minutes without taking damage.', icon: 'shield', goal: 120, key: 'noDamage' },
  { id: 'pyro', name: 'Pyromancer', description: 'Set 100 monsters ablaze.', icon: 'flame', goal: 100, key: 'burns' },
  { id: 'treasure', name: 'Treasure Hunter', description: 'Open 20 treasure chests.', icon: 'chest', goal: 20, key: 'chests' },
  { id: 'collector', name: 'Keeper of the Arcana', description: 'Discover 10 different cards.', icon: 'cards', goal: 10, key: 'cards' },
  { id: 'giant', name: 'Giant Slayer', description: 'Defeat your first boss.', icon: 'crown', goal: 1, key: 'bosses' },
  { id: 'survivor', name: 'Against the Night', description: 'Reach 10 minutes in one hunt.', icon: 'clock', goal: 600, key: 'survival' },
  { id: 'legend', name: 'Legendary Hunter', description: 'Wield a legendary weapon.', icon: 'sparkles', goal: 1, key: 'legendary' },
];

export const RARITY_COLORS = { common: '#9aa99e', rare: '#82b5c8', epic: '#b29ad8', legendary: '#d5b577' };
export const weaponById = (id: string) => WEAPONS.find(w => w.id === id) ?? WEAPONS[0];
export const cardById = (id: string) => CARDS.find(c => c.id === id)!;
export const spellById = (id: string) => SPELLS.find(s => s.id === id)!;
export const permanentCost = (def: PermanentDef, level: number) => Math.round(def.baseCost * Math.pow(1.65, level));
