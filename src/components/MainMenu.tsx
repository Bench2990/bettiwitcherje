import GameIcon, { WolfMark } from './GameIcon';
import type { Progress } from '@/game/types';

export type MetaScreen = 'upgrades' | 'collection' | 'achievements' | 'settings' | 'guide' | null;
const formatTime=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;

export default function MainMenu({progress,onPlay,onOpen,onSound}:{progress:Progress;onPlay:()=>void;onOpen:(screen:MetaScreen)=>void;onSound:()=>void}) {
  return <main className="main-menu">
    <div className="menu-art" aria-hidden="true"><img src="/art/forest-hunter.svg" alt=""/><div className="art-shade"/></div>
    <div className="grain-overlay" aria-hidden="true"/>
    <div className="floating-motes" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i} style={{left:`${20+(i*17)%77}%`,top:`${8+(i*23)%81}%`,animationDelay:`${i*-0.73}s`,animationDuration:`${7+i%5}s`}}/>)}</div>
    <header className="menu-header">
      <a className="brand" href="#" aria-label="The White Wolf home" onClick={e=>e.preventDefault()}><WolfMark size={37}/><span>WHITE WOLF<span className="brand-sub">CHRONICLES OF THE HUNT</span></span></a>
      <nav className="main-nav" aria-label="Main navigation"><span className="nav-active">The hunt</span><button onClick={()=>onOpen('collection')}>The grimoire</button><button onClick={()=>onOpen('achievements')}>Chronicles</button></nav>
      <div className="header-actions"><span className="wallet"><GameIcon name="coins" size={17}/>{progress.gold.toLocaleString()}</span><span className="header-rule"/><button className="icon-button" aria-label={progress.settings.sound?'Mute sound':'Enable sound'} onClick={onSound}><GameIcon name={progress.settings.sound?'sound':'mute'}/></button><button className="icon-button" aria-label="Settings" onClick={()=>onOpen('settings')}><GameIcon name="settings"/></button></div>
    </header>
    <section className="menu-content">
      <div className="chapter-label"><span/> A DARK FANTASY SURVIVAL <span className="chapter-number">VOL. I</span></div>
      <h1><span className="title-the">THE</span><span>WHITE</span><span className="title-wolf">WOLF<span className="title-dot">.</span></span></h1>
      <div className="title-ornament"><span/><WolfMark size={24}/><span/></div>
      <p className="menu-tagline">Steel for the beasts.<br/><em>Courage for the darkness.</em></p>
      <p className="menu-description">The forest has fallen silent. Something ancient stirs.<br className="desktop-break"/> Draw your silver. Survive the night. Become the legend.</p>
      <div className="menu-cta-group">
        <button className="begin-button" onClick={onPlay}><GameIcon name="swords" size={25}/><span>BEGIN THE HUNT<small>A new night. A new legend.</small></span><GameIcon name="next" size={21}/></button>
        <div className="menu-secondary"><button onClick={()=>onOpen('upgrades')}><GameIcon name="rune" size={19}/>The armory<GameIcon name="chevron" size={15}/></button><button onClick={()=>onOpen('collection')}><GameIcon name="cards" size={19}/>Card collection<GameIcon name="chevron" size={15}/></button></div>
      </div>
      <div className="run-features"><span><i/> SINGLE PLAYER</span><b>·</b><span>10 MINUTE RUNS</span><b>·</b><span>ENDLESS POSSIBILITIES</span></div>
    </section>
    <aside className="world-caption"><div className="location-line"/><span>01 / THE BLACKWOOD</span><h2>Where monsters roam.<br/>And legends are born.</h2><p><i/> THE NIGHT IS WAITING</p></aside>
    <section className="menu-bottom">
      <div className="starting-loadout"><div className="loadout-heading"><span className="small-label">YOUR HUNT BEGINS WITH</span><span className="loadout-line"/></div><div className="loadout-items"><div className="loadout-item"><span className="item-icon"><GameIcon name="sword" size={24}/></span><span>Silver sword<small>STEEL & INSTINCT</small></span></div><span className="loadout-divider"/><div className="loadout-item"><span className="item-icon flame"><GameIcon name="flame" size={24}/></span><span>Flame & guardian<small>THE OLD MAGIC</small></span></div><span className="loadout-divider"/><div className="loadout-item"><span className="item-icon"><GameIcon name="heart" size={23}/></span><span>{100+progress.upgrades.health*10} vitality<small>ONE LIFE. MAKE IT COUNT.</small></span></div></div></div>
      <div className="personal-record"><GameIcon name="trophy" size={23}/><div><span className="small-label">YOUR PERSONAL BEST</span><strong>{progress.bestScore?progress.bestScore.toLocaleString():'— — —'}<small>{progress.bestTime?formatTime(progress.bestTime):'A LEGEND YET TO BE WRITTEN'}</small></strong></div></div>
    </section>
    <footer className="menu-footer"><span>FORGED IN SILVER. WRITTEN IN BLOOD.</span><button onClick={()=>onOpen('guide')}><GameIcon name="help" size={14}/> How to play</button><span className="version"><i/> ALL PROGRESS SAVED LOCALLY <b>v1.0</b></span></footer>
  </main>;
}
