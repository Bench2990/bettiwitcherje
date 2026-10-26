import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunModel } from '../src/game/systems/RunModel';
import { ACHIEVEMENTS, CARDS, ENEMIES, PERMANENTS, SPELLS, WEAPONS, permanentCost } from '../src/game/data/definitions';
import { ProgressStore, freshProgress, validateProgress } from '../src/lib/storage';
import { Session } from '../src/game/Session';
import { AudioSystem } from '../src/game/systems/AudioSystem';

const model = () => new RunModel(freshProgress().upgrades);

test('the full content roster is available with unique IDs',()=>{
  assert.ok(ENEMIES.length>=6);assert.ok(CARDS.length>=15);assert.ok(WEAPONS.length>=5);assert.equal(SPELLS.length,5);assert.ok(ACHIEVEMENTS.length>=10);
  for(const list of [ENEMIES,CARDS,WEAPONS,SPELLS,PERMANENTS])assert.equal(new Set(list.map(x=>x.id)).size,list.length);
});
test('baseline hunter statistics are balanced and healing is clamped',()=>{
  const m=model();assert.equal(m.hp,100);assert.equal(m.stats.damage,12);assert.equal(m.stats.moveSpeed,180);assert.equal(m.stats.interval,0.75);
  m.hurt(25);assert.equal(m.hp,75);m.heal(1000);assert.equal(m.hp,100);m.heal(-10);assert.equal(m.hp,100);
});
test('shield, post-hit invulnerability, and dodge prevent accidental double damage',()=>{
  const m=model();assert.equal(m.cast('shield'),true);assert.equal(m.hurt(1000),'shield');assert.equal(m.hp,100);
  assert.equal(m.hurt(1000),'ignored');m.tick(1);assert.equal(m.hurt(20),'hurt');assert.equal(m.hp,80);assert.equal(m.hurt(20),'ignored');
  m.tick(1);assert.equal(m.dodge(),true);assert.equal(m.dodge(),false);assert.equal(m.hurt(1000),'ignored');m.tick(4);assert.equal(m.dodge(),true);
});
test('spells and consumables validate inventory and equipped slots',()=>{
  const m=model();assert.equal(m.cast('force'),false);assert.equal(m.cast('flame'),true);assert.equal(m.cast('flame'),false);
  m.tick(6);assert.equal(m.cast('flame'),true);assert.equal(m.usePotion(),false);m.hurt(60);assert.equal(m.usePotion(),true);assert.equal(m.hp,80);
  m.usePotion();assert.equal(m.hp,100);assert.equal(m.usePotion(),false);assert.equal(m.potions.healing,0);
  assert.equal(m.useBomb(),true);assert.equal(m.useBomb(),true);assert.equal(m.useBomb(),false);assert.equal(m.bombs.fire,0);
  m.upgrade('force');m.equipSpell('force',0);assert.deepEqual(m.spells,['force','shield']);assert.equal(m.cast('flame'),false);assert.equal(m.cast('force'),true);
  m.equipSpell('force',1);assert.deepEqual(m.spells,['shield','force']);
});
test('experience supports multiple levels without losing overflow',()=>{
  const m=model();const first=m.nextXp;assert.equal(m.gainXp(first-1),0);assert.equal(m.gainXp(2),1);assert.equal(m.level,2);assert.equal(m.xp,1);
  assert.ok(m.gainXp(300)>=3);assert.ok(m.xp<m.nextXp);assert.ok(m.xp>=0);
});
test('upgrades apply real changes and respect prerequisites and rank caps',()=>{
  const m=model();const damage=m.stats.damage;m.upgrade('damage');assert.equal(m.stats.damage,damage*1.2);
  m.upgrade('health');assert.equal(m.hp,120);assert.equal(m.stats.maxHp,120);
  m.upgrade('speed');assert.ok(m.stats.interval<0.75);m.upgrade('crit');assert.equal(m.stats.crit,0.13);m.upgrade('armor');assert.equal(m.stats.armor,2);
  for(let i=0;i<30;i++)m.upgrade('slash');assert.equal(m.rank('slash'),2);
  m.upgrade('charm');for(let i=0;i<100;i++)assert.ok(!m.upgradeChoices().some(x=>x.id==='charm'||x.id==='slash'||x.id==='heal'));
  assert.equal(new Set(m.upgradeChoices(()=>0).map(x=>x.id)).size,3);
});
test('five card limit, replacement, passive effects, and Second Wind are centralized',()=>{
  const m=model();for(const id of ['bloodPact','golden','relic','crown','secondWind'] as const)assert.equal(m.equipCard(id),true);
  assert.equal(m.cards.length,5);assert.equal(m.stats.maxHp,75);assert.equal(m.stats.damage,12*1.4);assert.equal(m.stats.gold,1.3);assert.equal(m.stats.xp,1.5);assert.equal(m.stats.cooldown,0.78);
  assert.equal(m.equipCard('wolf'),false);assert.equal(m.equipCard('wolf','golden'),true);assert.equal(m.cards.length,5);assert.equal(m.stats.gold,1);
  assert.equal(m.hurt(999),'revived');assert.equal(m.hp,22.5);m.tick(4);assert.equal(m.hurt(999),'dead');assert.equal(m.hurt(999),'ignored');
});
test('weapons modify damage, critical chance, and attack speed immediately',()=>{
  const m=model();m.equipWeapon('moonsteel');assert.equal(m.stats.damage,19);assert.equal(m.stats.crit,0.19);assert.equal(m.stats.interval,0.7);
  m.equipWeapon('ancient');assert.equal(m.stats.damage,38);assert.equal(m.stats.interval,0.59);
});
test('kill streak bonuses expire; Vampire’s Gift heals on the tenth kill',()=>{
  const m=model();m.equipCard('vampire');m.hurt(40);for(let i=0;i<10;i++)m.kill();assert.equal(m.hp,68);assert.equal(m.stats.damage,12*1.05);assert.equal(m.totals.highestCombo,10);
  m.tick(7);assert.equal(m.combo,0);assert.equal(m.stats.damage,12);m.kill(true);assert.equal(m.totals.bosses,1);
});
test('save validation gracefully handles corrupted, future, and malicious data',()=>{
  assert.deepEqual(validateProgress(null),freshProgress());assert.deepEqual(validateProgress({version:99}),freshProgress());
  const bad={...freshProgress(),gold:-30,bestScore:Infinity,upgrades:{health:9999,damage:'4'},discovered:['wolf','wolf','nope'],achievements:['first','nope'],settings:{sound:'bad',reducedEffects:true}};
  const safe=validateProgress(bad);assert.equal(safe.gold,0);assert.equal(safe.bestScore,0);assert.equal(safe.upgrades.health,5);assert.equal(safe.upgrades.damage,0);assert.deepEqual(safe.discovered,['wolf']);assert.deepEqual(safe.achievements,['first']);assert.equal(safe.settings.sound,true);assert.equal(safe.settings.reducedEffects,true);
});
test('permanent purchases are bounded, immutable, and cost increasingly more',()=>{
  const store=new ProgressStore();const initial=store.data;store.commit(p=>{p.gold=10000;});assert.equal(initial.gold,0);
  assert.equal(store.purchase('health'),true);assert.equal(store.data.upgrades.health,1);assert.equal(store.data.gold,9935);
  for(let i=0;i<10;i++)store.purchase('health');assert.equal(store.data.upgrades.health,5);assert.equal(store.purchase('health'),false);
  assert.ok(permanentCost(PERMANENTS[0],3)>permanentCost(PERMANENTS[0],2));
  const m=new RunModel(store.data.upgrades);assert.equal(m.hp,150);
});
test('run rewards, deaths, checkpoint totals and achievement rewards cannot duplicate',()=>{
  const store=new ProgressStore(),s=new Session(store,new AudioSystem());s.ready=true;s.model.kill();s.model.addGold(100);s.model.time=120;
  s.checkpoint();s.checkpoint();assert.equal(store.data.lifetime.kills,1);assert.ok(store.data.achievements.includes('first'));assert.ok(store.data.achievements.includes('untouchable'));
  const result=s.finish();assert.equal(result.reward,115);assert.equal(store.data.gold,115);s.finish();s.finish();assert.equal(store.data.gold,115);assert.equal(store.data.lifetime.runs,1);s.destroy();assert.equal(store.data.lifetime.kills,1);
});
test('level-up and loot choices stop gameplay and accept exactly one valid selection',()=>{
  const s=new Session(new ProgressStore(),new AudioSystem());s.ready=true;s.gainXp(15);assert.equal(s.paused,true);assert.equal(s.modal?.type,'upgrade');
  if(s.modal?.type!=='upgrade')throw Error('Expected an upgrade');const id=s.modal.choices[0].id;s.chooseUpgrade(id);assert.equal(s.model.rank(id),1);s.chooseUpgrade(id);assert.equal(s.model.rank(id),1);
  s.offerCard('wolf');assert.equal(s.paused,true);s.takeCard();s.takeCard();assert.equal(s.model.cards.length,1);assert.equal(s.model.totals.cards,1);
  s.victory();assert.equal(s.progress.data.endlessUnlocked,true);s.continueEndless();assert.equal(s.model.endless,true);assert.equal(s.paused,false);
});

test('temporary consumables change real stats and expire without negative charges',()=>{
  const m=model();m.potions.berserker=1;m.potion='berserker';assert.equal(m.usePotion(),true);assert.equal(m.potions.berserker,0);assert.ok(m.stats.damage>12);assert.ok(m.stats.interval<0.75);assert.equal(m.usePotion(),false);
  m.tick(13);assert.equal(m.stats.damage,12);assert.equal(m.stats.interval,0.75);
  m.potions.swift=1;m.potion='swift';m.usePotion();assert.ok(m.stats.moveSpeed>180);m.tick(13);assert.equal(m.stats.moveSpeed,180);
  m.potions.arcane=1;m.potion='arcane';m.usePotion();m.cast('flame');assert.equal(m.cooldowns.flame,6*0.55);m.tick(13);assert.equal(m.stats.cooldown,1);
});
test('Iron Skin is conditional and the Cursed Crown penalty is real',()=>{
  const m=model();m.equipCard('iron');assert.equal(m.stats.armor,0);m.hurt(60);m.tick(1);assert.equal(m.stats.armor,6);m.hurt(10);assert.equal(m.hp,36);
  const cursed=model();cursed.equipCard('crown');cursed.hurt(10);assert.equal(cursed.hp,88);assert.equal(cursed.gainXp(10),1);
});
test('blocking a nested UI panel cannot resume the simulation or accept commands',()=>{
  const s=new Session(new ProgressStore(),new AudioSystem());s.ready=true;s.pause();s.blockedUI=true;s.close();assert.equal(s.paused,true);s.action({type:'dodge'});assert.equal(s.intents.length,0);s.blockedUI=false;assert.equal(s.paused,false);s.action({type:'dodge'});assert.equal(s.intents.length,1);
});
