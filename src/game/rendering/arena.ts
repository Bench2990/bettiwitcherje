import type Phaser from 'phaser';
import { BALANCE } from '../data/definitions';
import { seeded } from './textures';

export function createArena(scene: Phaser.Scene) {
  const size=BALANCE.arena,rand=seeded(77233);
  scene.add.tileSprite(size/2,size/2,size,size,'ground').setDepth(-100);
  const path=scene.add.graphics().setDepth(-90);
  // A meandering ruined king's road crosses the old forest.
  const road=(t:number)=>size/2+Math.sin(t*0.0035)*180;
  for(let y=0;y<size;y+=17){
    for(let j=-2;j<=2;j++){
      if(rand()<0.16)continue;
      const x=road(y)+j*22+(rand()-0.5)*12;
      path.fillStyle([0x354039,0x3a453b,0x2e3b32,0x414b3f][Math.floor(rand()*4)],0.65);
      path.fillRoundedRect(x,y+rand()*4,17+rand()*6,11+rand()*5,2);
      if(rand()<0.3){path.lineStyle(1,0x526047,0.25);path.lineBetween(x+3,y+3,x+16,y+5);}
    }
  }
  const obstacles:{x:number;y:number;r:number}[]=[];
  for(let i=0;i<280;i++){
    const x=70+rand()*(size-140),y=70+rand()*(size-140);
    if(Math.hypot(x-size/2,y-size/2)<175)continue;
    const p=rand(),key=p<0.43?'tree':p<0.62?'deadTree':p<0.82?'rock':p<0.91?'bones':p<0.97?'ruin':'camp';
    const scale=0.65+rand()*0.5;
    const img=scene.add.image(x,y,key).setOrigin(0.5,key==='tree'||key==='deadTree'?0.92:0.85).setScale(scale).setDepth(y);
    if(key==='tree')img.setAlpha(0.90).setTint(0xc0d0bc);
    if(key==='rock')obstacles.push({x,y,r:22*scale});
    if(key==='camp')scene.add.image(x,y-15,'glow').setTint(0xd99b5c).setScale(2.8).setAlpha(0.2).setBlendMode(1).setDepth(y-1);
  }
  // Starting clearing: a broken arch, a warm fire, and an inviting first cache.
  scene.add.image(size/2-170,size/2-80,'ruin').setOrigin(0.5,0.85).setDepth(size/2-80);
  scene.add.image(size/2+160,size/2+20,'camp').setOrigin(0.5,0.85).setDepth(size/2+20);
  scene.add.image(size/2+160,size/2,'glow').setScale(3).setTint(0xe1a466).setAlpha(0.18).setBlendMode(1).setDepth(-1);
  const boundary=scene.add.graphics().setDepth(2);
  boundary.lineStyle(5,0x819d79,0.15);boundary.strokeRoundedRect(30,30,size-60,size-60,30);
  return obstacles;
}
