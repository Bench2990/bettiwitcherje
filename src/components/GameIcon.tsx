import { ArrowDown, ArrowLeft, ArrowRight, Award, Backpack, BookOpen, Check, ChevronRight, CircleHelp, Clock3, Coins, Crown, Droplets, Eye, Flame, Footprints, Gem, Heart, Hexagon, Infinity, Maximize, Moon, Move, Pause, Play, RotateCcw, Settings2, Shield, Skull, Snowflake, Sparkles, Sword, Swords, Target, Trash2, Trophy, Volume2, VolumeX, Wind, X, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  sword:Sword,swords:Swords,shield:Shield,flame:Flame,wind:Wind,heart:Heart,drop:Droplets,coins:Coins,gem:Gem,
  snow:Snowflake,bolt:Zap,sparkles:Sparkles,crown:Crown,eye:Eye,rune:Hexagon,boot:Footprints,potion:Droplets,
  bomb:Target,chest:Backpack,cards:BookOpen,clock:Clock3,award:Award,trophy:Trophy,skull:Skull,moon:Moon,
  pause:Pause,play:Play,settings:Settings2,sound:Volume2,mute:VolumeX,back:ArrowLeft,next:ArrowRight,
  chevron:ChevronRight,close:X,check:Check,restart:RotateCcw,trash:Trash2,help:CircleHelp,move:Move,infinity:Infinity,maximize:Maximize,down:ArrowDown,
};
export function WolfMark({size=32,className=''}:{size?:number;className?:string}) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true"><path d="m9 9 15 9 8-8 8 8 15-9-4 27-10 15-9 7-9-7L13 36Z" stroke="currentColor" strokeWidth="1.5"/><path d="m15 21 13 7-7 4 7 5 4 14 4-14 7-5-7-4 13-7-8 22-9 8-9-8Z" fill="currentColor"/><path d="m18 29 9 4-7 1m26-5-9 4 7 1" stroke="#111d16" strokeWidth="1.5"/></svg>;
}
export default function GameIcon({name,size=20,className=''}:{name:string;size?:number;className?:string}) {
  if(name==='wolf')return <WolfMark size={size} className={className}/>;
  const Icon=icons[name]??Sparkles;return <Icon size={size} strokeWidth={1.5} className={className} aria-hidden="true"/>;
}
