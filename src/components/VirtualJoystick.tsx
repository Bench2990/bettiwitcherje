'use client';

import { useEffect, useRef } from 'react';
import type { Session } from '@/game/Session';

export default function VirtualJoystick({session,floating}:{session:Session;floating:boolean}) {
  const area=useRef<HTMLDivElement>(null),base=useRef<HTMLDivElement>(null),knob=useRef<HTMLDivElement>(null);
  const pointer=useRef<number|null>(null),origin=useRef({x:0,y:0});
  const reset=()=>{pointer.current=null;session.input.x=0;session.input.y=0;if(knob.current)knob.current.style.transform='translate(0px, 0px)';if(base.current){base.current.style.left='';base.current.style.top='';base.current.classList.remove('engaged');}};
  useEffect(()=>()=>{session.input.x=0;session.input.y=0;},[session]);
  const move=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(pointer.current!==event.pointerId)return;
    const dx=event.clientX-origin.current.x,dy=event.clientY-origin.current.y,length=Math.hypot(dx,dy),radius=39;
    const power=Math.min(1,Math.max(0,(length-5)/(radius-5))),x=length>0?dx/length:0,y=length>0?dy/length:0;
    session.input.x=x*power;session.input.y=y*power;
    if(knob.current)knob.current.style.transform=`translate(${x*Math.min(radius,length)}px, ${y*Math.min(radius,length)}px)`;
  };
  return <div className="joystick-area" ref={area} role="group" aria-label="Movement joystick" onPointerDown={event=>{
    if(pointer.current!==null||session.paused||event.button>0)return;
    event.preventDefault();pointer.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);
    if(floating&&area.current&&base.current){const rect=area.current.getBoundingClientRect();base.current.style.left=`${Math.max(54,Math.min(rect.width-54,event.clientX-rect.left))}px`;base.current.style.top=`${Math.max(54,Math.min(rect.height-54,event.clientY-rect.top))}px`;}
    const rect=base.current!.getBoundingClientRect();origin.current={x:rect.left+rect.width/2,y:rect.top+rect.height/2};base.current?.classList.add('engaged');move(event);
  }} onPointerMove={move} onPointerUp={event=>{if(pointer.current===event.pointerId)reset();}} onPointerCancel={reset} onLostPointerCapture={reset}>
    <div className="joystick-base" ref={base}><span className="joystick-axis horizontal"/><span className="joystick-axis vertical"/><span className="joystick-direction north">⌃</span><span className="joystick-direction south">⌄</span><div className="joystick-knob" ref={knob}><i/></div></div><span className="joystick-label">MOVE <kbd>W A S D</kbd></span>
  </div>;
}
