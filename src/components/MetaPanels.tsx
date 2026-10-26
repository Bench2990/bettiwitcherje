'use client';

import { useState } from 'react';
import { ACHIEVEMENTS, CARDS, PERMANENTS, permanentCost } from '@/game/data/definitions';
import type { ProgressStore } from '@/lib/storage';
import type { MetaScreen } from './MainMenu';
import GameIcon, { WolfMark } from './GameIcon';
import type { Progress } from '@/game/types';

export function CardArt({icon,rarity='rare'}:{icon:string;rarity?:string}) {
  return <div className={`card-art rarity-${rarity}`}><div className="card-art-rune"/><div className="card-art-ring"/><GameIcon name={icon} size={58}/><i/><b>✦</b></div>;
}

export default function MetaPanels({screen,store,progress,onClose,onSettings}:{screen:MetaScreen;store:ProgressStore;progress:Progress;onClose:()=>void;onSettings:()=>void}) {
  const [filter,setFilter]=useState('all');
  const [purchaseMessage,setPurchaseMessage]=useState('');
  if(!screen)return null;
  const titles={upgrades:['THE ARMORY','A stronger hunter. A darker night.','Spend the gold you bring home on permanent improvements.'],collection:['THE GRIMOIRE','Power takes many forms.','Discover arcana during your hunts. Bind up to five cards to shape your run.'],achievements:['CHRONICLES','Every scar tells a story.','Your deeds are remembered across every hunt.'],settings:['PREFERENCES','Make the night your own.','Settings are saved automatically on this device.'],guide:['THE HUNTER’S HANDBOOK','Trust your silver. Keep moving.','No two hunts are alike. Here is all you need to know.']};
  const [eyebrow,title,subtitle]=titles[screen];
  return <div className="meta-backdrop"><section className={`meta-panel ${screen==='settings'||screen==='guide'?'narrow-panel':''}`} role="dialog" aria-modal="true" aria-label={eyebrow}>
    <div className="panel-top"><button className="text-button" onClick={onClose}><GameIcon name="back" size={17}/> Back to the hunt</button><span className="wallet"><GameIcon name="coins" size={18}/>{progress.gold.toLocaleString()}<small>GOLD</small></span></div>
    <header className="panel-heading"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{subtitle}</p></header>
    {screen==='upgrades'&&<><div className="armory-note"><WolfMark size={22}/><span>Permanent upgrades carry into every new hunt.</span><span role="status">{purchaseMessage}</span></div><div className="permanent-grid">{PERMANENTS.map(def=>{
      const level=progress.upgrades[def.id],cost=permanentCost(def,level),maxed=level>=def.max;
      return <article className="permanent-card" key={def.id}><div className="permanent-icon"><GameIcon name={def.icon} size={26}/></div><div className="permanent-main"><span className="small-label">{def.amount} / RANK</span><h3>{def.name}</h3><p>{def.description}</p><div className="rank-pips">{Array.from({length:def.max},(_,i)=><span className={i<level?'filled':''} key={i}/>)}<small>{level} / {def.max}</small></div></div><button className="purchase-button" disabled={maxed||progress.gold<cost} onClick={()=>{if(store.purchase(def.id))setPurchaseMessage(`${def.name} improved.`);}}>{maxed?<><GameIcon name="check" size={15}/>Max rank</>:<><GameIcon name="coins" size={15}/>{cost}</>}</button></article>;
    })}</div></>}
    {screen==='collection'&&<><div className="collection-toolbar"><span>{progress.discovered.length} / {CARDS.length} DISCOVERED</span><div>{['all','rare','epic','legendary'].map(f=><button key={f} className={filter===f?'selected':''} onClick={()=>setFilter(f)}>{f}</button>)}</div></div><div className="collection-grid">{CARDS.filter(c=>filter==='all'||c.rarity===filter).map(card=>{
      const found=progress.discovered.includes(card.id);
      return <article className={`collection-card rarity-${card.rarity} ${found?'discovered':'undiscovered'}`} key={card.id}><span className="card-rarity">{card.rarity}{found&&<GameIcon name="check" size={13}/>}</span><CardArt icon={card.icon} rarity={card.rarity}/><h3>{card.name}</h3><p>{card.description}</p>{card.synergy&&<div className="card-synergy"><GameIcon name="sparkles" size={12}/>{card.synergy}</div>}<span className="card-lore">{found?card.lore:'Awaiting discovery in the Blackwood'}</span></article>;
    })}</div></>}
    {screen==='achievements'&&<><div className="achievement-summary"><GameIcon name="trophy" size={29}/><strong>{progress.achievements.length}<span>/ {ACHIEVEMENTS.length}</span></strong><span>CHRONICLES WRITTEN</span></div><div className="achievement-grid">{ACHIEVEMENTS.map(def=>{
      const unlocked=progress.achievements.includes(def.id),value=Math.min(def.goal,progress.lifetime[def.key]);
      return <article key={def.id} className={`achievement-card ${unlocked?'unlocked':''}`}><div className="achievement-icon"><GameIcon name={def.icon} size={27}/></div><div><h3>{def.name}{unlocked&&<GameIcon name="check" size={15}/>}</h3><p>{def.description}</p><div className="tiny-track"><i style={{width:`${value/def.goal*100}%`}}/></div><small>{value.toLocaleString()} / {def.goal.toLocaleString()}</small></div></article>;
    })}</div></>}
    {screen==='settings'&&<div className="settings-list">{[
      {id:'sound' as const,icon:'sound',name:'Sound effects',description:'Procedural steel, spells, and echoes of the forest.'},
      {id:'reducedEffects' as const,icon:'sparkles',name:'Reduced effects',description:'Fewer particles and no screen shake. Best for older phones.'},
      {id:'floatingJoystick' as const,icon:'move',name:'Floating joystick',description:'The movement stick follows your first touch in the lower-left area.'},
    ].map(s=><div className="setting-row" key={s.id}><GameIcon name={s.icon} size={23}/><div><h3>{s.name}</h3><p>{s.description}</p></div><button role="switch" aria-checked={progress.settings[s.id]} aria-label={s.name} className={`toggle ${progress.settings[s.id]?'on':''}`} onClick={()=>{store.commit(d=>{d.settings[s.id]=!d.settings[s.id];});onSettings();}}><span/></button></div>)}<div className="save-note"><GameIcon name="shield" size={21}/><p>Your legend lives on this device.<br/><small>Clearing browser storage removes your progress. No account or connection is needed after loading.</small></p></div></div>}
    {screen==='guide'&&<div className="guide-content"><div className="guide-hero"><WolfMark size={59}/><p>You are the blade between<br/>the world and the dark.</p></div>{[
      ['move','Never stand still','Drag the left joystick, or use WASD / arrow keys. Your sword automatically strikes the nearest monster in reach.'],
      ['flame','Steel is only the beginning','Tap your two spells (Q / E), dodge (Space), drink a potion (R), or throw a bomb (F). Dodging briefly makes you invulnerable.'],
      ['gem','Grow into the legend','Collect green experience crystals. Every level offers three upgrades. Choose one. Chests glow gold; walk close to open them.'],
      ['cards','Find your own path','Bind up to five cards. Combine them for real synergies. Swap spells, potions, and bombs from the pause menu (Esc).'],
      ['crown','Survive the Blackwood','Bosses awaken at 3, 6, and 10 minutes. Move out of their warning circles. Defeat the Wraith Queen to unlock endless survival.'],
      ['coins','No hunt is wasted','Gold is banked when you finish, fall, restart, or quit. Spend it in the armory. Pausing or backgrounding the app freezes all gameplay.'],
    ].map(([icon,name,text])=><div className="guide-row" key={name}><GameIcon name={icon} size={25}/><div><h3>{name}</h3><p>{text}</p></div></div>)}</div>}
    <footer className="panel-footer"><span>THE WHITE WOLF</span><span>CHRONICLES OF THE HUNT</span></footer>
  </section></div>;
}
