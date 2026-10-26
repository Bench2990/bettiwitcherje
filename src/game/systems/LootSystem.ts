import { WEAPONS } from '../data/definitions';
import type { PotionId, WeaponId } from '../types';

export function rollWeapon(time: number, boss = false, random = Math.random): WeaponId {
  const rank = random();
  if (boss && (time >= 590 || rank > 0.88)) return 'ancient';
  const pool = WEAPONS.filter(w => w.id !== 'worn' && (time >= 150 || boss || w.rarity === 'rare') && (w.rarity !== 'legendary' || time >= 500));
  return pool[Math.floor(random() * pool.length)].id;
}
export function rollPotion(random = Math.random): PotionId {
  const p = random(); return p < 0.58 ? 'healing' : p < 0.73 ? 'berserker' : p < 0.87 ? 'swift' : 'arcane';
}
