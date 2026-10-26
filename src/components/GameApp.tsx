'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import MainMenu, { type MetaScreen } from './MainMenu';
import MetaPanels from './MetaPanels';
import GameCanvas from './GameCanvas';
import GameHUD from './GameHUD';
import RunOverlays from './RunOverlays';
import { ProgressStore, freshProgress } from '@/lib/storage';
import { Session } from '@/game/Session';
import { AudioSystem } from '@/game/systems/AudioSystem';

function ActiveRun({session,onRestart,onMenu,onOpen}:{session:Session;onRestart:()=>void;onMenu:()=>void;onOpen:(screen:MetaScreen)=>void}) {
  const snapshot=useSyncExternalStore(session.subscribe,session.snapshot,session.snapshot);
  return <main className="active-run" onContextMenu={e=>e.preventDefault()}><GameCanvas session={session}/><GameHUD session={session} snapshot={snapshot}/><RunOverlays session={session} snapshot={snapshot} onRestart={onRestart} onMenu={onMenu} onUpgrades={()=>onOpen('upgrades')} onSettings={()=>onOpen('settings')} onFinish={()=>{session.modal={type:'death',summary:session.finish(true)};session.publish();}}/></main>;
}

function GameShell({store}:{store:ProgressStore}) {
  const progress=useSyncExternalStore(store.subscribe,store.snapshot,store.snapshot);
  const [session,setSession]=useState<Session|null>(null);
  const [meta,setMeta]=useState<MetaScreen>(null);
  const audio=useRef<AudioSystem|null>(null);
  const current=useRef<Session|null>(null);
  const getAudio=()=>{if(!audio.current)audio.current=new AudioSystem();audio.current.enabled=store.data.settings.sound;return audio.current;};
  const start=()=>{
    current.current?.finish();current.current?.destroy();
    const sound=getAudio();sound.unlock();sound.play('swing');
    const next=new Session(store,sound);current.current=next;setSession(next);setMeta(null);
  };
  const menu=()=>{current.current?.finish();current.current?.destroy();current.current=null;setSession(null);setMeta(null);};
  const soundToggle=()=>{store.commit(d=>{d.settings.sound=!d.settings.sound;});const a=getAudio();if(a.enabled){a.unlock();a.play('pickup');}};
  const settingsChanged=()=>{const a=getAudio();if(a.enabled)a.unlock();};
  const openMeta=(screen:MetaScreen)=>{if(current.current)current.current.blockedUI=!!screen;setMeta(screen);};
  useEffect(()=>{
    if(!meta)return;
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();if(current.current)current.current.blockedUI=false;setMeta(null);}};
    window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);
  },[meta]);
  useEffect(()=>{
    const save=()=>{current.current?.checkpoint();store.save();};
    window.addEventListener('pagehide',save);
    return()=>{window.removeEventListener('pagehide',save);audio.current?.destroy();};
  },[store]);
  useEffect(()=>{
    if(process.env.NODE_ENV!=='production'){
      const target=window as unknown as {__WHITE_WOLF__?:{session:Session|null;store:ProgressStore}};
      target.__WHITE_WOLF__={session,store};return()=>{delete target.__WHITE_WOLF__;};
    }
  },[session,store]);
  useEffect(()=>{
    document.body.classList.toggle('in-game',!!session);
    return()=>document.body.classList.remove('in-game');
  },[session]);
  return <><div inert={meta?true:undefined}>{session?<ActiveRun session={session} onRestart={start} onMenu={menu} onOpen={openMeta}/>:<MainMenu progress={progress} onPlay={start} onOpen={openMeta} onSound={soundToggle}/>}</div><MetaPanels key={meta} screen={meta} store={store} progress={progress} onClose={()=>openMeta(null)} onSettings={settingsChanged}/>{store.unavailable&&<div className="storage-warning" role="status">Browser storage is unavailable. Progress will last for this visit only.</div>}</>;
}

export default function GameApp() {
  const [store,setStore]=useState<ProgressStore|null>(null);
  useEffect(()=>{setStore(new ProgressStore());},[]);
  if(!store)return <div inert aria-busy="true"><MainMenu progress={freshProgress()} onPlay={()=>{}} onOpen={()=>{}} onSound={()=>{}}/></div>;
  return <GameShell store={store}/>;
}
