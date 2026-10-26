import type Phaser from 'phaser';
import type { BossId, EnemyDef, EnemyId } from './types';

export interface Enemy {
  image: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image;
  inUse: boolean; alive: boolean; type: EnemyId | BossId; boss: boolean; def: EnemyDef;
  x: number; y: number; hp: number; maxHp: number; speed: number; damage: number; radius: number;
  cooldown: number; age: number; hurt: number; burn: number; burnTick: number; slow: number; stun: number;
  charm: number; charmTick: number; intangible: boolean; dash: number; vx: number; vy: number; telegraph: number;
  aiClock: number; pattern: number; phase: number; deathTime: number; scale: number; elite: boolean;
}
export interface Pickup {
  image: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image;
  active: boolean; x:number;y:number; kind:'xp'|'gold'|'potion'|'card'|'weapon';amount:number;age:number;
}
export interface Projectile { image:Phaser.GameObjects.Image;active:boolean;x:number;y:number;vx:number;vy:number;life:number;damage:number;radius:number }
export interface Zone {
  x:number;y:number;radius:number;warning:number;life:number;maxLife:number;tick:number;
  kind:'slam'|'root'|'rune'|'trap'|'fire'|'frost'|'phantom';damage:number;color:number;triggered:boolean;
}
export interface Landmark { image:Phaser.GameObjects.Image;glow:Phaser.GameObjects.Image;x:number;y:number;kind:'chest'|'altar'|'merchant';used:boolean;expires:number }
