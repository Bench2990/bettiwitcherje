'use client';

import type { CSSProperties } from 'react';
import type { Session } from '@/game/Session';
import { cardById, spellById } from '@/game/data/definitions';
import type { Snapshot } from '@/game/types';
import GameIcon, { WolfMark } from './GameIcon';
import VirtualJoystick from './VirtualJoystick';

export const timeLabel=(time:number)=>`${String(Math.floor(time/60)).padStart(2,'0')}:${String(Math.floor(time%60)).padStart(2,'0')}`;

function Ability({icon,label,hotkey,color,remaining=0,max=1,onClick,large=false,active=false,disabled=false}:{icon:string;label:string;hotkey:string;color:string;remaining?:number;max?:number;onClick:()=>void;large?:boolean;active?:boolean;disabled?:boolean}) {
  return <button className={`ability-button ${large?'dodge-button':''} ${remaining>0?'on-cooldown':''} ${active?'ability-active':''}`} style={{'--ability-color':color,'--cooldown':`${Math.min(100,remaining/max*100)}%`} as CSSProperties} disabled={remaining>0||disabled} aria-label={label} onPointerDown={e=>{e.preventDefault();if(remaining<=0&&!disabled)onClick();}}><span className="ability-ring"/><span className="ability-inner"><GameIcon name={icon} size={large?29:26}/>{remaining>0&&<span className="cooldown-number">{Math.ceil(remaining)}</span>}</span><kbd>{hotkey}</kbd><span className="ability-label">{label}</span></button>;
}

export default function GameHUD({session,snapshot:s}:{session:Session;snapshot:Snapshot}) {
  const hidden=!!s.modal;
  return <>
    <div className={`game-hud ${hidden?'hud-dimmed':''}`}>
      <div className="hud-top"><div className="hud-vitals"><div className="hunter-medallion"><WolfMark size={37}/><span>{s.level}</span></div><div className="vital-bars"><div className="vital-heading"><span>THE WHITE WOLF</span><span>{Math.ceil(s.hp)}<small> / {s.maxHp}</small></span></div><div className={`health-track ${s.hp/s.maxHp<0.3?'health-low':''}`}><i style={{width:`${s.hp/s.maxHp*100}%`}}/>{s.shield&&<GameIcon name="shield" size={12}/>}</div><div className="xp-track"><i style={{width:`${s.xp/s.nextXp*100}%`}}/></div><div className="xp-caption"><span>LV. {s.level}</span><span>{Math.floor(s.xp)} / {s.nextXp} XP</span></div></div></div><div className="hud-time"><GameIcon name={s.endless?'infinity':'clock'} size={14}/><strong>{timeLabel(s.time)}</strong><span>{s.endless?'ENDLESS HUNT':'SURVIVE THE NIGHT'}</span></div><div className="hud-resources"><span><GameIcon name="coins" size={16}/>{s.gold.toLocaleString()}</span><span className="score-label">{s.score.toLocaleString()} <small>PTS</small></span></div><button className="pause-button" aria-label="Pause game" onClick={()=>session.pause()}><GameIcon name="pause" size={20}/></button></div>
      {s.boss&&<div className="boss-hud"><div><GameIcon name="skull" size={16}/><span>{s.boss.name}</span><small>PHASE {s.boss.phase}</small></div><div className="boss-track"><i style={{width:`${Math.max(0,s.boss.hp/s.boss.maxHp*100)}%`}}/></div><span className="boss-hp">{Math.ceil(Math.max(0,s.boss.hp))} / {Math.ceil(s.boss.maxHp)}</span></div>}
      <div className="hud-side"><span className="biome-label"><i/> THE BLACKWOOD</span><span><GameIcon name="skull" size={13}/>{s.kills} SLAIN</span>{s.combo>=5&&<div className={`combo-display ${s.combo>=50?'berserk':''}`}><strong>{s.combo}<small>×</small></strong><span>{s.combo>=50?'BERSERK':'KILL STREAK'}</span></div>}</div>
      {s.cards.length>0&&<button className="active-card-strip" onClick={()=>session.pause()} aria-label="View active cards">{s.cards.map(id=><span key={id} className={`mini-card rarity-${cardById(id).rarity}`} title={cardById(id).name}><GameIcon name={cardById(id).icon} size={16}/></span>)}</button>}
      {s.time<14&&<div className="first-hint"><GameIcon name="sword" size={16}/><span>Your sword strikes automatically.<br/><b>Keep moving. Trust your instincts.</b></span></div>}
      <div className="battle-location"><span>OLD KING’S ROAD</span><small>{s.hint}</small></div>
    </div>
    {!hidden&&s.ready&&!session.model.dead&&<div className="game-controls"><VirtualJoystick session={session} floating={session.progress.data.settings.floatingJoystick}/><div className="ability-controls"><div className="spell-row">{s.spells.map((id,index)=>{
      const spell=spellById(id);return <Ability key={`${index}-${id}`} icon={spell.icon} label={spell.short} hotkey={index===0?'Q':'E'} color={spell.color} remaining={s.cooldowns[id]} max={s.cooldownMax[id]} onClick={()=>session.action({type:'spell',id})} active={id==='shield'&&s.shield} disabled={id==='shield'&&session.model.shieldDisabled>0}/>;
    })}</div><div className="utility-row"><button className="consumable-button" aria-label={`Use ${s.potion} potion`} disabled={s.potions[s.potion]<=0} onPointerDown={e=>{e.preventDefault();session.action({type:'potion'});}}><GameIcon name="potion" size={21}/><span>{s.potions[s.potion]}</span><kbd>R</kbd><small>{s.potion==='healing'?'HEAL':s.potion.toUpperCase()}</small></button><Ability icon="wind" label="Dodge" hotkey="SPACE" color="#bfd1c3" remaining={s.cooldowns.dodge} max={s.cooldownMax.dodge} onClick={()=>session.action({type:'dodge'})} large/><button className="consumable-button bomb-control" aria-label={`Use ${s.bomb} bomb`} disabled={s.bombs[s.bomb]<=0} onPointerDown={e=>{e.preventDefault();session.action({type:'bomb'});}}><GameIcon name={s.bomb==='fire'?'bomb':'snow'} size={21}/><span>{s.bombs[s.bomb]}</span><kbd>F</kbd><small>{s.bomb.toUpperCase()}</small></button></div></div></div>}
    <div className="toast-stack" aria-live="polite">{s.toasts.map(toast=><div key={toast.id} className={`game-toast rarity-${toast.rarity||'common'}`}><span className="toast-icon"><GameIcon name={toast.icon} size={25}/></span><div><small>{toast.title}</small><strong>{toast.text}</strong></div><i/></div>)}</div>
    {!s.ready&&<div className="loading-screen"><WolfMark size={66}/><span className="eyebrow">ENTERING THE BLACKWOOD</span><p>Silver sharp. Senses sharper.</p><i/></div>}
  </>;
}
