'use client';

import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import type { Session } from '@/game/Session';
import { WolfMark } from './GameIcon';

export default function GameCanvas({session}:{session:Session}) {
  const container=useRef<HTMLDivElement>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    let disposed=false;let game:Phaser.Game|undefined;
    import('@/game/createGame').then(({createGame})=>{
      if(!disposed&&container.current)game=createGame(container.current,session);
    }).catch(()=>{if(!disposed)setError('The forest could not awaken. Please refresh to try again.');});
    const pause=()=>session.pause();
    const visibility=()=>{if(document.hidden)pause();};
    window.addEventListener('blur',pause);document.addEventListener('visibilitychange',visibility);
    const prevent=(event:TouchEvent)=>{if(event.cancelable)event.preventDefault();};
    const element=container.current;element?.addEventListener('touchmove',prevent,{passive:false});
    const watchdog=window.setTimeout(()=>{if(!disposed&&!session.ready)setError('The forest could not awaken. Please refresh to try again.');},15000);
    return ()=>{
      disposed=true;window.clearTimeout(watchdog);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',visibility);element?.removeEventListener('touchmove',prevent);
      game?.destroy(true);session.ready=false;session.input.x=0;session.input.y=0;session.intents.length=0;
    };
  },[session]);
  return <div ref={container} className="game-canvas" aria-label="The Blackwood battlefield">{error&&<div className="canvas-error"><WolfMark size={50}/><p>{error}</p><button onClick={()=>window.location.reload()}>Try again</button></div>}</div>;
}
