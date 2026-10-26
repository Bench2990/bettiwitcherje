export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type SpellId = 'flame' | 'force' | 'shield' | 'trap' | 'charm';
export type EnemyId = 'ghoul' | 'drowner' | 'wraith' | 'necrophage' | 'hound' | 'cultist';
export type BossId = 'guardian' | 'vampire' | 'queen';
export type WeaponId = 'worn' | 'hunter' | 'moonsteel' | 'bloodfang' | 'stormbringer' | 'infernal' | 'ancient';
export type CardId = 'flaming' | 'wolf' | 'secondWind' | 'bloodPact' | 'golden' | 'thunder' | 'frozen' | 'vampire' | 'instinct' | 'echo' | 'explosive' | 'phantom' | 'iron' | 'crown' | 'relic';
export type PotionId = 'healing' | 'berserker' | 'swift' | 'arcane';
export type BombId = 'fire' | 'frost';
export type PermanentId = 'health' | 'damage' | 'speed' | 'crit' | 'armor' | 'pickup' | 'potions';
export type UpgradeId = 'damage' | 'speed' | 'health' | 'heal' | 'move' | 'crit' | 'magic' | 'cooldown' | 'pickup' | 'slash' | 'burn' | 'lifesteal' | 'armor' | 'dodge' | 'gold' | 'force' | 'trap' | 'charm';

export interface CardDef { id: CardId; name: string; rarity: Rarity; icon: string; description: string; lore: string; synergy?: string }
export interface WeaponDef { id: WeaponId; name: string; rarity: Rarity; damage: number; interval: number; crit: number; color: number; effect: string; icon: string }
export interface EnemyDef { id: EnemyId; name: string; hp: number; speed: number; damage: number; interval: number; xp: number; gold: number; radius: number; color: number }
export interface SpellDef { id: SpellId; name: string; short: string; icon: string; color: string; cooldown: number; description: string }
export interface BossDef { id: BossId; name: string; title: string; time: number; hp: number; speed: number; damage: number; color: number; radius: number }
export interface UpgradeDef { id: UpgradeId; name: string; description: string; rarity: Rarity; icon: string; max: number }
export interface PermanentDef { id: PermanentId; name: string; description: string; icon: string; max: number; baseCost: number; amount: string }
export interface AchievementDef { id: string; name: string; description: string; icon: string; goal: number; key: keyof LifetimeStats }
export interface LifetimeStats { kills: number; bosses: number; burns: number; chests: number; cards: number; noDamage: number; survival: number; legendary: number; runs: number }
export interface Settings { sound: boolean; reducedEffects: boolean; floatingJoystick: boolean }
export interface Progress {
  version: 1; gold: number; bestScore: number; bestTime: number; endlessUnlocked: boolean;
  upgrades: Record<PermanentId, number>; discovered: CardId[]; achievements: string[];
  lifetime: LifetimeStats; settings: Settings;
}
export interface Stats {
  maxHp: number; damage: number; moveSpeed: number; interval: number; crit: number; critDamage: number;
  armor: number; pickup: number; magic: number; cooldown: number; dodgeCooldown: number; gold: number; xp: number;
}
export interface RunTotals { kills: number; elites: number; damage: number; bosses: number; highestCombo: number; gold: number; cards: number; burns: number; chests: number }
export interface RunSummary extends RunTotals { time: number; level: number; score: number; best: boolean; victory: boolean; reward: number }
export type Modal =
  | { type: 'pause' }
  | { type: 'upgrade'; choices: UpgradeDef[] }
  | { type: 'card'; card: CardId }
  | { type: 'weapon'; weapon: WeaponId }
  | { type: 'encounter'; encounter: 'altar' | 'merchant' }
  | { type: 'death'; summary: RunSummary }
  | { type: 'victory' };
export interface Toast { id: number; title: string; text: string; icon: string; rarity?: Rarity }
export interface Snapshot {
  hp: number; maxHp: number; xp: number; nextXp: number; level: number; time: number;
  score: number; gold: number; combo: number; kills: number; weapon: WeaponId; cards: CardId[];
  spells: SpellId[]; learned: SpellId[]; cooldowns: Record<SpellId | 'dodge', number>;
  cooldownMax: Record<SpellId | 'dodge', number>; shield: boolean; stats: Stats;
  potions: Record<PotionId, number>; bombs: Record<BombId, number>; potion: PotionId; bomb: BombId;
  boss: { name: string; hp: number; maxHp: number; phase: number } | null;
  modal: Modal | null; toasts: Toast[]; hint: string; ready: boolean; endless: boolean;
}
export type Intent = { type: 'spell'; id: SpellId } | { type: 'dodge' } | { type: 'potion' } | { type: 'bomb' };
