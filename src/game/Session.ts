import { ACHIEVEMENTS, CARDS, SPELLS, cardById, weaponById } from './data/definitions';
import type { CardId, Intent, Modal, RunSummary, Snapshot, Toast, UpgradeId, WeaponId } from './types';
import { RunModel } from './systems/RunModel';
import { AudioSystem } from './systems/AudioSystem';
import type { ProgressStore } from '@/lib/storage';

export class Session {
  readonly model: RunModel;
  readonly audio: AudioSystem;
  input = { x: 0, y: 0 };
  intents: Intent[] = [];
  modal: Modal | null = null;
  private queue: Modal[] = [];
  private listeners = new Set<() => void>();
  private snapshotValue!: Snapshot;
  private toasts: (Toast & { expires: number })[] = [];
  private toastId = 0;
  private checkpointCounts = { kills: 0, bosses: 0, burns: 0, chests: 0 };
  private saved = false;
  private destroyed = false;
  ready = false;
  blockedUI = false;
  hint = 'The forest remembers. Keep moving.';
  boss: Snapshot['boss'] = null;
  constructor(readonly progress: ProgressStore, audio: AudioSystem) {
    this.model = new RunModel({ ...progress.data.upgrades });
    this.audio = audio;
    this.publish();
  }
  get paused() { return this.blockedUI || this.modal !== null || !this.ready; }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  snapshot = () => this.snapshotValue;
  publish() {
    if (this.destroyed) return;
    const m = this.model;
    const max = { dodge: m.stats.dodgeCooldown, flame: 0, shield: 0, force: 0, trap: 0, charm: 0 };
    SPELLS.forEach(s => { max[s.id] = s.cooldown * m.stats.cooldown; });
    this.toasts = this.toasts.filter(t => t.expires > performance.now());
    this.snapshotValue = {
      hp: m.hp, maxHp: m.stats.maxHp, xp: m.xp, nextXp: m.nextXp, level: m.level, time: m.time,
      score: m.score, gold: m.gold, combo: m.combo, kills: m.totals.kills, weapon: m.weapon,
      cards: [...m.cards], spells: [...m.spells], learned: [...m.learned], cooldowns: { ...m.cooldowns }, cooldownMax: max,
      shield: m.shield, stats: { ...m.stats }, potions: { ...m.potions }, bombs: { ...m.bombs }, potion: m.potion, bomb: m.bomb,
      boss: this.boss ? { ...this.boss } : null, modal: this.modal, toasts: [...this.toasts], hint: this.hint, ready: this.ready, endless: m.endless,
    };
    this.listeners.forEach(fn => fn());
  }
  action(intent: Intent) { if (!this.paused && !this.model.dead && this.intents.length < 10) this.intents.push(intent); }
  show(modal: Modal) {
    this.input.x = 0; this.input.y = 0; this.intents.length = 0;
    if (this.modal) this.queue.push(modal); else this.modal = modal;
    this.publish();
  }
  close() { this.modal = this.queue.shift() ?? null; this.publish(); }
  pause() { if (!this.modal && this.ready && !this.model.dead) this.show({ type: 'pause' }); }
  toast(title: string, text: string, icon = 'sparkles', rarity?: Toast['rarity']) {
    this.toasts.push({ id: ++this.toastId, title, text, icon, rarity, expires: performance.now() + 4000 });
    if (this.toasts.length > 3) this.toasts.shift();
    this.publish();
  }
  gainXp(amount: number) {
    if(this.model.dead) return;
    const count = this.model.gainXp(amount);
    for (let i = 0; i < count; i++) this.show({ type: 'upgrade', choices: this.model.upgradeChoices() });
    if (count) this.audio.play('level');
  }
  chooseUpgrade(id: UpgradeId) {
    if (this.modal?.type !== 'upgrade' || !this.modal.choices.some(c => c.id === id)) return;
    this.model.upgrade(id); this.audio.play('card'); this.close();
    // Generate queued options against the newly changed state, not stale prerequisites.
    if (this.modal?.type === 'upgrade') this.modal.choices = this.model.upgradeChoices();
    this.publish();
  }
  offerCard(id?: CardId) {
    const available = CARDS.filter(c => !this.model.has(c.id));
    if (!available.length) { this.model.addGold(25); return; }
    const weights = { common: 6, rare: 4, epic: 2, legendary: 0.8 };
    let roll = Math.random() * available.reduce((sum, c) => sum + weights[c.rarity], 0);
    const card = id ? cardById(id) : available.find(c => (roll -= weights[c.rarity]) < 0) ?? available[0];
    if (!card || this.model.has(card.id)) { this.model.addGold(20); return; }
    this.discoverCard(card.id);
    this.audio.play('rare'); this.show({ type: 'card', card: card.id });
  }
  takeCard(replace?: CardId) {
    if (this.modal?.type !== 'card') return;
    const id = this.modal.card;
    if (!this.model.equipCard(id, replace)) return;
    this.progress.commit(draft => { if (!draft.discovered.includes(id)) draft.discovered.push(id); });
    this.audio.play('card'); this.toast('Arcana bound', cardById(id).name, cardById(id).icon, cardById(id).rarity);
    this.close(); this.checkpoint();
  }
  /** A rare drop is discovered even when the hunter chooses not to bind it. */
  discoverCard(id: CardId) {
    this.progress.commit(draft => { if (!draft.discovered.includes(id)) draft.discovered.push(id); });
  }
  offerWeapon(id: WeaponId) { this.audio.play('rare'); this.show({ type: 'weapon', weapon: id }); }
  takeWeapon() {
    if (this.modal?.type !== 'weapon') return;
    const id = this.modal.weapon;
    this.model.equipWeapon(id);
    if (weaponById(id).rarity === 'legendary') this.progress.commit(draft => { draft.lifetime.legendary = 1; });
    this.toast('Silver, sharpened', weaponById(id).name, 'sword', weaponById(id).rarity);
    this.close(); this.checkpoint();
  }
  checkpoint() {
    if (this.destroyed) return;
    const m = this.model;
    const newlyUnlocked: typeof ACHIEVEMENTS = [];
    this.progress.commit(draft => {
      for (const key of Object.keys(this.checkpointCounts) as (keyof typeof this.checkpointCounts)[]) {
        draft.lifetime[key] += Math.max(0, m.totals[key] - this.checkpointCounts[key]);
        this.checkpointCounts[key] = m.totals[key];
      }
      draft.lifetime.noDamage = Math.max(draft.lifetime.noDamage, Math.floor(m.time - m.lastHurt));
      draft.lifetime.survival = Math.max(draft.lifetime.survival, Math.floor(m.time));
      draft.lifetime.cards = draft.discovered.length;
      for (const def of ACHIEVEMENTS) {
        if (!draft.achievements.includes(def.id) && draft.lifetime[def.key] >= def.goal) { draft.achievements.push(def.id); newlyUnlocked.push(def); }
      }
    });
    newlyUnlocked.forEach(a => this.toast('Achievement unlocked', a.name, a.icon, 'legendary'));
  }
  victory() {
    this.progress.commit(draft => { draft.endlessUnlocked = true; });
    this.model.addGold(300); this.audio.play('victory');
    this.show({ type: 'victory' }); this.checkpoint();
  }
  continueEndless() {
    if (this.modal?.type !== 'victory') return;
    this.model.endless = true; this.model.heal(this.model.stats.maxHp); this.close();
    this.toast('The night is endless', 'The hunt goes on. Your legend grows.', 'moon', 'legendary');
  }
  finish(victory = false): RunSummary {
    const m = this.model;
    const reward = Math.floor(m.gold + m.time / 8 + m.totals.bosses * 75);
    const best = m.score > this.progress.data.bestScore;
    if (!this.saved) {
      this.saved = true;
      this.checkpoint();
      this.progress.commit(draft => {
        draft.gold += reward; draft.bestScore = Math.max(draft.bestScore, m.score); draft.bestTime = Math.max(draft.bestTime, Math.floor(m.time)); draft.lifetime.runs++;
      });
    }
    return { ...m.totals, time: m.time, level: m.level, score: m.score, best, victory: victory || m.endless, reward };
  }
  die() {
    this.queue = []; this.audio.play('death');
    this.modal = { type: 'death', summary: this.finish() }; this.publish();
  }
  destroy() { this.checkpoint(); this.destroyed = true; this.listeners.clear(); this.intents.length = 0; this.input.x = 0; this.input.y = 0; }
}
