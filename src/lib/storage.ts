import { ACHIEVEMENTS, CARDS, PERMANENTS, permanentCost } from '@/game/data/definitions';
import type { PermanentId, Progress } from '@/game/types';

export const SAVE_KEY = 'white-wolf:save:v1';
export const freshProgress = (): Progress => ({
  version: 1, gold: 0, bestScore: 0, bestTime: 0, endlessUnlocked: false,
  upgrades: { health: 0, damage: 0, speed: 0, crit: 0, armor: 0, pickup: 0, potions: 0 },
  discovered: [], achievements: [],
  lifetime: { kills: 0, bosses: 0, burns: 0, chests: 0, cards: 0, noDamage: 0, survival: 0, legendary: 0, runs: 0 },
  settings: { sound: true, reducedEffects: false, floatingJoystick: false },
});
const safeNumber = (value: unknown, max = 1e12) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;

/** Whitelist fields instead of trusting or mutating arbitrary localStorage data. */
export function validateProgress(raw: unknown): Progress {
  const result = freshProgress();
  if (!raw || typeof raw !== 'object' || (raw as { version?: number }).version !== 1) return result;
  const data = raw as Partial<Progress>;
  for (const key of ['gold', 'bestScore', 'bestTime'] as const) result[key] = safeNumber(data[key]);
  result.endlessUnlocked = data.endlessUnlocked === true;
  for (const def of PERMANENTS) result.upgrades[def.id] = safeNumber(data.upgrades?.[def.id], def.max);
  for (const key of Object.keys(result.lifetime) as (keyof Progress['lifetime'])[]) result.lifetime[key] = safeNumber(data.lifetime?.[key]);
  result.discovered = [...new Set(Array.isArray(data.discovered) ? data.discovered.filter(id => CARDS.some(c => c.id === id)) : [])];
  result.achievements = [...new Set(Array.isArray(data.achievements) ? data.achievements.filter(id => ACHIEVEMENTS.some(a => a.id === id)) : [])];
  result.lifetime.cards = result.discovered.length;
  for (const key of Object.keys(result.settings) as (keyof Progress['settings'])[]) {
    if (typeof data.settings?.[key] === 'boolean') result.settings[key] = data.settings[key];
  }
  return result;
}

export class ProgressStore {
  data: Progress;
  unavailable = false;
  private listeners = new Set<() => void>();
  constructor() {
    this.data = freshProgress();
    try {
      if (typeof window !== 'undefined') this.data = validateProgress(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'));
    } catch { /* A corrupted or blocked save never prevents playing. */ }
  }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  snapshot = () => this.data;
  commit(update: (draft: Progress) => void) {
    const draft = structuredClone(this.data);
    update(draft);
    this.data = validateProgress(draft);
    this.save();
    this.listeners.forEach(fn => fn());
  }
  save() {
    try { if (typeof window !== 'undefined') localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); }
    catch { this.unavailable = true; }
  }
  purchase(id: PermanentId) {
    const def = PERMANENTS.find(d => d.id === id);
    if (!def) return false;
    const level = this.data.upgrades[id];
    const cost = permanentCost(def, level);
    if (level >= def.max || this.data.gold < cost) return false;
    this.commit(draft => { draft.gold -= cost; draft.upgrades[id]++; });
    return true;
  }
}
