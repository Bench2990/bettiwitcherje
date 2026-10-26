import { BALANCE, CARDS, SPELLS, UPGRADES, weaponById } from '../data/definitions';
import type { CardId, PermanentId, PotionId, SpellId, Stats, UpgradeDef, UpgradeId, WeaponId } from '../types';

export class RunModel {
  hp = 100; xp = 0; level = 1; time = 0; gold = 0; combo = 0; lastKill = -10; lastHurt = 0;
  weapon: WeaponId = 'worn';
  cards: CardId[] = [];
  learned: SpellId[] = ['flame', 'shield'];
  spells: SpellId[] = ['flame', 'shield'];
  upgrades: Partial<Record<UpgradeId, number>> = {};
  cooldowns: Record<SpellId | 'dodge', number> = { flame: 0, shield: 0, force: 0, trap: 0, charm: 0, dodge: 0 };
  potions = { healing: 2, berserker: 0, swift: 0, arcane: 0 };
  bombs = { fire: 2, frost: 0 };
  potion: PotionId = 'healing';
  bomb: 'fire' | 'frost' = 'fire';
  buffs = { berserker: 0, swift: 0, arcane: 0 };
  shield = false; invulnerable = 0; dodgeRemaining = 0; revived = false; dead = false; endless = false;
  altarDamage = 1; altarHp = 1; enemySpeed = 1; shieldDisabled = 0;
  totals = { kills: 0, elites: 0, damage: 0, bosses: 0, highestCombo: 0, gold: 0, cards: 0, burns: 0, chests: 0 };
  stats!: Stats;
  constructor(readonly permanent: Record<PermanentId, number>) {
    this.potions.healing += permanent.potions;
    this.recalculate(); this.hp = this.stats.maxHp;
  }
  has(id: CardId) { return this.cards.includes(id); }
  rank(id: UpgradeId) { return this.upgrades[id] ?? 0; }
  get nextXp() { return Math.round(14 + (this.level - 1) * 10 + Math.pow(this.level - 1, 1.5) * 2); }
  get score() {
    return Math.floor(this.totals.kills * 10 + this.totals.elites * 40 + this.totals.bosses * 500 + this.time * 2 + this.totals.highestCombo * 4 + this.totals.cards * 50 + this.level * 20);
  }
  get potionCapacity() { return 3 + this.permanent.potions; }
  recalculate() {
    const p = this.permanent, w = weaponById(this.weapon);
    const comboBonus = this.combo >= 50 ? 0.30 : this.combo >= 30 ? 0.15 : this.combo >= 15 ? 0.10 : this.combo >= 5 ? 0.05 : 0;
    this.stats = {
      maxHp: Math.max(1, Math.round((100 + p.health * 10 + this.rank('health') * 20) * (this.has('bloodPact') ? 0.75 : 1) * this.altarHp)),
      damage: w.damage * (1 + p.damage * 0.05 + this.rank('damage') * 0.2 + comboBonus) * (this.has('bloodPact') ? 1.4 : 1) * (this.buffs.berserker > 0 ? 1.4 : 1) * this.altarDamage,
      moveSpeed: 180 * (1 + p.speed * 0.03 + this.rank('move') * 0.1) * (this.buffs.swift > 0 ? 1.35 : 1),
      interval: w.interval / (1 + this.rank('speed') * 0.15) / (this.buffs.berserker > 0 ? 1.35 : 1),
      crit: Math.min(0.85, 0.05 + p.crit * 0.02 + w.crit + this.rank('crit') * 0.08), critDamage: 1.5,
      armor: p.armor + this.rank('armor') * 2 + (this.has('iron') && this.hp < (this.stats?.maxHp ?? 100) * 0.5 ? 6 : 0),
      pickup: 68 * (1 + p.pickup * 0.12 + this.rank('pickup') * 0.35),
      magic: 1 + this.rank('magic') * 0.25,
      cooldown: Math.pow(0.9, this.rank('cooldown')) * (this.has('relic') ? 0.78 : 1) * (this.buffs.arcane > 0 ? 0.55 : 1),
      dodgeCooldown: 3.8 * Math.pow(0.85, this.rank('dodge')) * (this.has('relic') ? 0.78 : 1),
      gold: 1 + this.rank('gold') * 0.25 + (this.has('golden') ? 0.3 : 0), xp: this.has('crown') ? 1.5 : 1,
    };
    this.hp = Math.max(0, Math.min(this.hp, this.stats.maxHp));
  }
  tick(dt: number) {
    this.time += dt;
    for (const key of Object.keys(this.cooldowns) as (keyof typeof this.cooldowns)[]) this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
    for (const key of Object.keys(this.buffs) as (keyof typeof this.buffs)[]) this.buffs[key] = Math.max(0, this.buffs[key] - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.dodgeRemaining = Math.max(0, this.dodgeRemaining - dt);
    this.shieldDisabled = Math.max(0, this.shieldDisabled - dt);
    if (this.combo && this.time - this.lastKill > BALANCE.comboWindow) this.combo = 0;
    this.recalculate();
  }
  heal(amount: number) { this.hp = Math.min(this.stats.maxHp, this.hp + Math.max(0, amount)); }
  hurt(amount: number): 'ignored' | 'shield' | 'hurt' | 'revived' | 'dead' {
    if (this.dead || this.invulnerable > 0 || this.dodgeRemaining > 0) return 'ignored';
    if (this.shield) { this.shield = false; this.invulnerable = 0.55; return 'shield'; }
    const damage = Math.max(1, amount * (this.has('crown') ? 1.2 : 1) - this.stats.armor);
    this.hp = Math.max(0, this.hp - damage);
    this.invulnerable = BALANCE.hurtGrace; this.lastHurt = this.time;
    if (damage > this.stats.maxHp * 0.08) this.combo = 0;
    if (this.hp <= 0) {
      if (this.has('secondWind') && !this.revived) {
        this.revived = true; this.hp = this.stats.maxHp * 0.3; this.invulnerable = 3; return 'revived';
      }
      this.dead = true; return 'dead';
    }
    return 'hurt';
  }
  kill(boss = false) {
    this.totals.kills++; if (boss) this.totals.bosses++;
    this.combo++; this.lastKill = this.time;
    this.totals.highestCombo = Math.max(this.totals.highestCombo, this.combo);
    if (this.has('vampire') && this.totals.kills % 10 === 0) this.heal(8);
    this.recalculate();
  }
  addGold(amount: number) { const value = Math.max(0, Math.round(amount * this.stats.gold)); this.gold += value; this.totals.gold += value; }
  gainXp(amount: number) {
    this.xp += Math.max(0, amount * this.stats.xp);
    let levels = 0;
    while (this.xp >= this.nextXp) { this.xp -= this.nextXp; this.level++; levels++; }
    return levels;
  }
  upgradeChoices(random = Math.random): UpgradeDef[] {
    const pool = UPGRADES.filter(u => this.rank(u.id) < u.max && (u.id !== 'heal' || this.hp < this.stats.maxHp - 15) && !this.learned.includes(u.id as SpellId));
    const result: UpgradeDef[] = [];
    const weights = { common: 6, rare: 3, epic: 1.3, legendary: 0.5 };
    while (result.length < 3 && pool.length) {
      const total = pool.reduce((sum, u) => sum + weights[u.rarity], 0);
      let cursor = random() * total;
      let index = pool.findIndex(u => (cursor -= weights[u.rarity]) < 0);
      if (index < 0) index = pool.length - 1;
      result.push(pool.splice(index, 1)[0]);
    }
    return result;
  }
  upgrade(id: UpgradeId) {
    const def = UPGRADES.find(u => u.id === id);
    if (!def || this.rank(id) >= def.max) return false;
    this.upgrades[id] = this.rank(id) + 1;
    if (id === 'force' || id === 'trap' || id === 'charm') { if (!this.learned.includes(id)) this.learned.push(id); }
    this.recalculate();
    if (id === 'health') this.heal(20);
    if (id === 'heal') this.heal(35);
    return true;
  }
  equipCard(id: CardId, replace?: CardId) {
    if (!CARDS.some(c => c.id === id) || this.has(id)) return false;
    if (this.cards.length >= 5) {
      const index = replace ? this.cards.indexOf(replace) : -1;
      if (index < 0) return false;
      this.cards.splice(index, 1, id);
    } else this.cards.push(id);
    this.totals.cards++; this.recalculate(); return true;
  }
  equipWeapon(id: WeaponId) { this.weapon = id; this.recalculate(); }
  equipSpell(id: SpellId, slot: number) {
    if (!this.learned.includes(id) || slot < 0 || slot > 1) return;
    const other = this.spells.indexOf(id);
    if (other >= 0) [this.spells[slot], this.spells[other]] = [this.spells[other], this.spells[slot]];
    else this.spells[slot] = id;
  }
  cast(id: SpellId) {
    if (this.dead || !this.spells.includes(id) || this.cooldowns[id] > 0 || (id === 'shield' && this.shieldDisabled > 0)) return false;
    this.cooldowns[id] = SPELLS.find(s => s.id === id)!.cooldown * this.stats.cooldown;
    if (id === 'shield') this.shield = true;
    return true;
  }
  dodge() {
    if (this.dead || this.cooldowns.dodge > 0) return false;
    this.cooldowns.dodge = this.stats.dodgeCooldown;
    this.dodgeRemaining = BALANCE.dodgeDuration; this.invulnerable = BALANCE.dodgeDuration + 0.1;
    return true;
  }
  usePotion() {
    if (this.dead || this.potions[this.potion] <= 0 || (this.potion === 'healing' && this.hp >= this.stats.maxHp)) return false;
    this.potions[this.potion]--;
    if (this.potion === 'healing') this.heal(40);
    else this.buffs[this.potion] = 12;
    this.recalculate(); return true;
  }
  useBomb() { if (this.dead || this.bombs[this.bomb] <= 0) return false; this.bombs[this.bomb]--; return true; }
}
