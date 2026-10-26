import * as Phaser from 'phaser';
import { BALANCE, BOSSES, ENEMIES, weaponById } from '../data/definitions';
import type { Enemy, Landmark, Pickup, Projectile, Zone } from '../entities';
import type { BossId, EnemyId, SpellId } from '../types';
import type { Session } from '../Session';
import { Effects } from '../rendering/Effects';
import { createArena } from '../rendering/arena';
import { rollPotion, rollWeapon } from '../systems/LootSystem';

const TAU = Math.PI * 2;
const distance2 = (ax:number,ay:number,bx:number,by:number) => (ax-bx)**2+(ay-by)**2;
const angleDifference = (a:number,b:number) => Math.atan2(Math.sin(a-b),Math.cos(a-b));

export class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Image;
  private playerGlow!: Phaser.GameObjects.Image;
  private equippedBlade!: Phaser.GameObjects.Image;
  private companion!: Phaser.GameObjects.Image;
  private aura!: Phaser.GameObjects.Graphics;
  private zoneGraphics!: Phaser.GameObjects.Graphics;
  private enemyGraphics!: Phaser.GameObjects.Graphics;
  private vignette!: Phaser.GameObjects.Graphics;
  private effects!: Effects;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];
  private projectiles: Projectile[] = [];
  private zones: Zone[] = [];
  private landmarks: Landmark[] = [];
  private obstacles: {x:number;y:number;r:number}[] = [];
  private facing = Math.PI/2;
  private moveX=0; private moveY=0; private dodgeX=0; private dodgeY=1;
  private attackClock=0.3; private attackAnimation=0; private attacks=0;
  private spawnClock=0.6; private lootClock=38; private landmarkClock=95; private uiClock=0; private saveClock=0;
  private bossIndex=0; private endlessBossClock=90; private wolfClock=0; private deathClock=0;
  private frostTrailClock=0;
  private playerHurtClock=0;
  private deathStarted=0;
  private mist: Phaser.GameObjects.Image[] = [];
  private keyHandler?: (event: KeyboardEvent) => void;

  constructor(readonly session: Session) { super('Forest'); }
  private get m() { return this.session.model; }
  create() {
    this.obstacles=createArena(this);
    this.effects=new Effects(this);this.effects.reduced=this.session.progress.data.settings.reducedEffects;
    this.zoneGraphics=this.add.graphics().setDepth(-2);
    this.enemyGraphics=this.add.graphics().setDepth(8000);
    const center=BALANCE.arena/2;
    this.playerShadow=this.add.image(center,center,'shadow').setScale(0.65).setDepth(center-1);
    this.playerGlow=this.add.image(center,center-10,'glow').setTint(0x8ab9bd).setAlpha(0.13).setScale(2).setBlendMode(1).setDepth(-1);
    this.player=this.add.image(center,center,'hunter-idle-front-0').setOrigin(0.5,0.86).setDepth(center).setScale(1.05);
    this.equippedBlade=this.add.image(center,center,'blade-worn').setOrigin(0.5,0.78).setScale(0.85).setVisible(false);
    this.companion=this.add.image(center-45,center+15,'wolf').setOrigin(0.5,0.85).setScale(0.8).setAlpha(0.75).setVisible(false);
    this.aura=this.add.graphics().setDepth(8100);
    this.vignette=this.add.graphics().setScrollFactor(0).setDepth(9900);
    this.cameras.main.setBounds(0,0,BALANCE.arena,BALANCE.arena);
    this.cameras.main.startFollow(this.player,true,0.10,0.10,0,20);
    this.resize();this.scale.on('resize',this.resize,this);
    if(this.input.keyboard){
      this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,Q,E,R,F,ONE,TWO') as typeof this.keys;
      this.keyHandler=(event:KeyboardEvent)=>{
        if(this.session.blockedUI||event.defaultPrevented)return;
        if(event.code==='Escape'){
          if(this.session.modal?.type==='pause')this.session.close();else this.session.pause();
        }
      };
      this.input.keyboard.on('keydown',this.keyHandler);
    }
    for(let i=0;i<5;i++)this.mist.push(this.add.image(center+(i-2)*170,center-220+(i%2)*290,'glow').setScale(10,2).setTint(0x99b9b1).setAlpha(0.025).setBlendMode(1).setDepth(8500));
    this.addLandmark('chest',center+105,center-155);
    for(let i=0;i<3;i++)this.spawnEnemy('ghoul');
    this.session.ready=true;this.session.publish();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.scale.off('resize',this.resize,this);
      if(this.keyHandler)this.input.keyboard?.off('keydown',this.keyHandler);
      this.session.ready=false;
    });
  }
  private resize() {
    const {width,height}=this.scale;
    this.cameras.main.setZoom(width<600?1.25:height<520?1.05:1.4);
    if(this.vignette){
      this.vignette.clear();
      // Low-cost frame shading instead of expensive full-screen postprocessing.
      for(let i=0;i<6;i++){
        this.vignette.lineStyle(22,0x07110f,0.055);this.vignette.strokeRect(i*15,i*13,width-i*30,height-i*26);
      }
    }
  }
  update(_time:number,delta:number) {
    if(!this.player||this.session.paused)return;
    const dt=Math.min(delta/1000,0.045);
    this.effects.reduced=this.session.progress.data.settings.reducedEffects;
    if(this.m.dead){
      // The final cinematic is wall-clock based: even a throttled mobile renderer
      // must not strand a dead hunter in slow motion before the results screen.
      if(!this.deathStarted){this.deathStarted=performance.now();this.equippedBlade.setVisible(false);this.aura.clear();this.session.publish();}
      this.deathClock=(performance.now()-this.deathStarted)/1000;
      this.player.setTexture(`hunter-death-front-${Math.min(7,Math.floor(this.deathClock*10))}`).setAlpha(Math.max(0.4,1-this.deathClock*0.5));
      this.effects.update(dt);
      if(this.deathClock>0.8)this.session.die();return;
    }
    this.m.tick(dt);
    this.readInput();this.movePlayer(dt);
    this.handleIntents();
    if(this.session.paused)return;
    this.attackClock-=dt;this.attackAnimation=Math.max(0,this.attackAnimation-dt);this.playerHurtClock=Math.max(0,this.playerHurtClock-dt);
    if(this.attackClock<=0)this.swordAttack();
    this.updateEnemies(dt);
    if(this.m.dead){this.session.publish();return;}
    if(this.session.paused)return;
    this.updateProjectiles(dt);this.updateZones(dt);this.updatePickups(dt);
    if(this.m.dead||this.session.paused){this.session.publish();return;}
    this.updateLandmarks(dt);this.updateCompanion(dt);this.updateDirector(dt);
    this.drawPlayer();this.effects.update(dt);this.updateAtmosphere(dt);
    this.uiClock+=dt;this.saveClock+=dt;
    if(this.uiClock>=0.12){this.uiClock=0;this.session.publish();}
    if(this.saveClock>=5){this.saveClock=0;this.session.checkpoint();}
  }
  private readInput() {
    let x=this.session.input.x,y=this.session.input.y;
    if(this.keys){
      if(this.keys.A.isDown||this.keys.LEFT.isDown)x-=1;if(this.keys.D.isDown||this.keys.RIGHT.isDown)x+=1;
      if(this.keys.W.isDown||this.keys.UP.isDown)y-=1;if(this.keys.S.isDown||this.keys.DOWN.isDown)y+=1;
      if(Phaser.Input.Keyboard.JustDown(this.keys.SPACE))this.session.action({type:'dodge'});
      if(Phaser.Input.Keyboard.JustDown(this.keys.Q)||Phaser.Input.Keyboard.JustDown(this.keys.ONE))this.session.action({type:'spell',id:this.m.spells[0]});
      if(Phaser.Input.Keyboard.JustDown(this.keys.E)||Phaser.Input.Keyboard.JustDown(this.keys.TWO))this.session.action({type:'spell',id:this.m.spells[1]});
      if(Phaser.Input.Keyboard.JustDown(this.keys.R))this.session.action({type:'potion'});
      if(Phaser.Input.Keyboard.JustDown(this.keys.F))this.session.action({type:'bomb'});
    }
    const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
    this.moveX=x;this.moveY=y;
  }
  private movePlayer(dt:number) {
    let x=this.moveX,y=this.moveY,speed=this.m.stats.moveSpeed;
    if(this.m.dodgeRemaining>0){x=this.dodgeX;y=this.dodgeY;speed=BALANCE.dodgeSpeed;}
    else if(Math.abs(x)+Math.abs(y)>0.1)this.facing=Math.atan2(y,x);
    this.player.x=Phaser.Math.Clamp(this.player.x+x*speed*dt,45,BALANCE.arena-45);
    this.player.y=Phaser.Math.Clamp(this.player.y+y*speed*dt,60,BALANCE.arena-40);
    this.frostTrailClock-=dt;
    if(this.m.dodgeRemaining>0&&this.m.has('phantom')&&this.m.has('frozen')&&this.frostTrailClock<=0){
      this.frostTrailClock=0.07;this.addZone(this.player.x,this.player.y,42,0,2.5,'frost',10*this.m.stats.magic,0xaccddd);
    }
    for(const o of this.obstacles){
      const dx=this.player.x-o.x,dy=this.player.y-o.y,d=Math.hypot(dx,dy),r=o.r+10;
      if(d<r&&d>0.01){this.player.x=o.x+dx/d*r;this.player.y=o.y+dy/d*r;}
    }
  }
  private handleIntents() {
    const intents=this.session.intents.splice(0);
    for(const intent of intents){
      if(intent.type==='spell'&&this.m.cast(intent.id)){
        const target=this.nearestEnemy(350);if(target)this.facing=Math.atan2(target.y-this.player.y,target.x-this.player.x);
        this.performSpell(intent.id);this.session.audio.play('spell');
        if(this.m.has('echo')&&Math.random()<(this.m.has('relic')?0.45:0.25)){
          // Echoes resolve deterministically in the same simulation step; no stray timers after pausing.
          this.performSpell(intent.id,true);this.effects.text(this.player.x,this.player.y-25,'ECHO','#b9a9df',true);
        }
      }
      if(intent.type==='dodge'&&this.m.dodge()){
        const len=Math.hypot(this.moveX,this.moveY);
        this.dodgeX=len>0.1?this.moveX/len:Math.cos(this.facing);this.dodgeY=len>0.1?this.moveY/len:Math.sin(this.facing);
        this.session.audio.play('dodge');this.effects.burst(this.player.x,this.player.y-15,0xc6d8cf,9,40);
        if(this.m.has('phantom'))this.addZone(this.player.x,this.player.y,65,0,2,this.m.has('frozen')?'frost':'phantom',15*this.m.stats.magic,0xa7b4da);
      }
      if(intent.type==='potion'&&this.m.usePotion()){
        this.effects.burst(this.player.x,this.player.y-20,0xa6cf95,18,70);this.effects.text(this.player.x,this.player.y,this.m.potion==='healing'?'+40':'EMPOWERED','#a6cf95',true);this.session.audio.play('spell');
      }
      if(intent.type==='bomb'&&this.m.useBomb()){
        const x=this.player.x+Math.cos(this.facing)*100,y=this.player.y+Math.sin(this.facing)*100;
        if(this.m.bomb==='fire'){
          this.explosion(x,y,145,72*this.m.stats.magic,true);this.addZone(x,y,120,0,4,'fire',12*this.m.stats.magic,0xe3a16a);
        }else{
          this.effects.ring(x,y,160,0xaccddd);this.addZone(x,y,160,0,5,'frost',6*this.m.stats.magic,0xaccddd);
          for(const e of this.enemies)if(e.alive&&distance2(e.x,e.y,x,y)<160**2){e.slow=6;e.stun=1.8;this.hitEnemy(e,32*this.m.stats.magic,false,true);}
        }
        this.session.audio.play('spell');
      }
    }
  }
  private drawPlayer() {
    const moving=Math.hypot(this.moveX,this.moveY)>0.12;
    const state=this.m.dodgeRemaining>0?'dodge':this.playerHurtClock>0?'hurt':this.attackAnimation>0?'attack':moving?'walk':'idle';
    const frame=Math.floor(this.m.time*(state==='walk'?13:state==='dodge'?24:7))%8;
    this.player.setTexture(`hunter-${state}-${Math.sin(this.facing)<-0.5&&state!=='attack'?'back':'front'}-${frame}`);
    this.player.setFlipX(Math.cos(this.facing)<-0.15).setDepth(this.player.y);
    this.player.setAlpha(this.m.invulnerable>0?0.5+Math.sin(this.m.time*45)*0.25:1);
    this.player.setTint(this.m.buffs.berserker>0?0xffc2a1:0xffffff);
    const flip=this.player.flipX?-1:1;
    this.equippedBlade.setVisible(this.m.weapon!=='worn').setTexture(`blade-${this.m.weapon}`).setPosition(this.player.x+(this.attackAnimation>0?18:12)*flip,this.player.y-(this.attackAnimation>0?29:14)).setRotation(this.attackAnimation>0?this.facing+Math.PI/2:Math.PI-0.25*flip).setDepth(this.player.y+1).setAlpha(this.player.alpha);
    this.playerShadow.setPosition(this.player.x,this.player.y-1).setDepth(this.player.y-1);
    this.playerGlow.setPosition(this.player.x,this.player.y-10);
    this.aura.clear();
    if(this.m.shield){
      this.aura.lineStyle(2,0xe3cd8e,0.75+Math.sin(this.m.time*4)*0.15);this.aura.strokeEllipse(this.player.x,this.player.y-22,55,69);
      this.aura.lineStyle(1,0xf0dfaa,0.2);this.aura.strokeEllipse(this.player.x,this.player.y-22,63,75);
      for(let i=0;i<5;i++){const a=i*TAU/5+this.m.time;this.aura.fillStyle(0xe9d99d,0.6);this.aura.fillCircle(this.player.x+Math.cos(a)*28,this.player.y-22+Math.sin(a)*34,1.5);}
    }
  }
  private nearestEnemy(range:number,fromX=this.player.x,fromY=this.player.y,except?:Enemy) {
    let nearest:Enemy|undefined,best=range*range;
    for(const e of this.enemies){if(!e.alive||e.charm>0||e===except)continue;const d=distance2(fromX,fromY,e.x,e.y);if(d<best){best=d;nearest=e;}}
    return nearest;
  }
  private swordAttack() {
    const target=this.nearestEnemy(BALANCE.swordRange+35);
    if(!target)return;
    this.facing=Math.atan2(target.y-this.player.y,target.x-this.player.x);
    this.attackClock=this.m.stats.interval;this.attackAnimation=0.24;this.attacks++;
    const w=weaponById(this.m.weapon);
    this.effects.slash(this.player.x,this.player.y-15,this.facing,BALANCE.swordRange,w.color);
    this.session.audio.play('swing');
    const extra=this.m.rank('slash')+(this.m.weapon==='ancient'&&this.attacks%3===0?1:0);
    for(let slash=0;slash<=extra;slash++){
      const angle=this.facing+(slash===1?1.6:slash===2?-1.6:0);
      if(slash)this.effects.slash(this.player.x,this.player.y-15,angle,BALANCE.swordRange,w.color);
      for(const e of this.enemies){
        if(!e.alive||e.charm>0||distance2(this.player.x,this.player.y,e.x,e.y)>(BALANCE.swordRange+e.radius)**2)continue;
        const a=Math.atan2(e.y-this.player.y,e.x-this.player.x);
        if(Math.abs(angleDifference(a,angle))>BALANCE.swordArc/2)continue;
        const critical=Math.random()<this.m.stats.crit+(e.boss&&this.m.has('instinct')?0.2:0);
        const damage=this.m.stats.damage*(critical?this.m.stats.critDamage:1);
        if(this.hitEnemy(e,damage,critical,false)){
          if(this.m.has('flaming')||this.m.rank('burn')>0||this.m.weapon==='infernal')this.burnEnemy(e);
          this.m.heal(damage*(this.m.rank('lifesteal')*0.02+(this.m.weapon==='bloodfang'?0.02:0)));
          if(!e.boss){e.x+=Math.cos(angle)*12;e.y+=Math.sin(angle)*12;}
        }
      }
    }
    if((this.m.has('thunder')&&this.attacks%10===0)||(this.m.weapon==='stormbringer'&&Math.random()<0.25))this.chainLightning(target,3);
  }
  private hitEnemy(e:Enemy,damage:number,critical=false,magic=false) {
    if(!e.alive||(e.intangible&&!magic))return false;
    const actual=Math.min(e.hp,Math.max(0,damage));e.hp-=damage;e.hurt=0.12;
    if(critical&&this.m.has('frozen'))e.slow=3;
    this.m.totals.damage+=actual;
    this.effects.text(e.x,e.y-e.radius,Math.ceil(damage),critical?'#f2d38a':magic?'#b3cdd8':'#e0e3d3',critical);
    this.effects.burst(e.x,e.y-15,critical?0xf0d598:magic?0xb7c5e5:0xbba98c,critical?7:3,60);
    this.session.audio.play('hit');
    if(critical&&!this.effects.reduced)this.cameras.main.shake(45,0.0012);
    if(e.hp<=0)this.killEnemy(e);
    return true;
  }
  private burnEnemy(e:Enemy) { if(!e.alive)return;if(e.burn<=0)this.m.totals.burns++;e.burn=4+this.m.rank('burn');e.burnTick=Math.min(e.burnTick,0.3); }
  private chainLightning(first:Enemy,count:number) {
    const points=[{x:this.player.x,y:this.player.y-20}],visited=new Set<Enemy>();let target:Enemy|undefined=first;
    for(let i=0;i<count&&target;i++){
      visited.add(target);points.push({x:target.x,y:target.y-20});this.hitEnemy(target,30*this.m.stats.magic,false,true);
      const x=target.x,y=target.y;let best=170**2;target=undefined;
      for(const e of this.enemies){if(!e.alive||visited.has(e)||e.charm>0)continue;const d=distance2(x,y,e.x,e.y);if(d<best){target=e;best=d;}}
    }
    this.effects.lightning(points);this.session.audio.play('spell');
  }
  private killEnemy(e:Enemy) {
    if(!e.alive)return;
    e.alive=false;e.deathTime=e.boss?1.1:0.32;this.m.kill(e.boss);if(e.elite)this.m.totals.elites++;
    this.effects.burst(e.x,e.y-20,e.boss?0xe1ce98:e.charm>0?0x95c1ad:0x819d88,e.boss?38:9,e.boss?140:60);
    this.session.audio.play('kill');
    this.dropPickup('xp',e.x,e.y,e.boss?180:e.def.xp*(e.elite?3:1));
    this.dropPickup('gold',e.x+10,e.y+5,e.boss?100:e.def.gold*(e.elite?4:1));
    if(this.m.has('explosive')&&e.burn>0)this.explosion(e.x,e.y,85,28*this.m.stats.magic,this.m.has('flaming'));
    if(e.boss){
      this.session.boss=null;
      if(!this.effects.reduced)this.cameras.main.shake(300,0.005);
      this.session.toast('A legend falls',BOSSES.find(b=>b.id===e.type)!.name,'crown','legendary');
      this.session.offerCard();this.session.offerWeapon(rollWeapon(this.m.time,true));
      this.m.heal(25);
      if(e.type==='queen'&&!this.m.endless)this.session.victory();
    }else{
      const roll=Math.random();
      if(roll<(e.elite?0.13:0.007))this.dropPickup('card',e.x-8,e.y,1);
      else if(roll<(e.elite?0.24:0.012))this.dropPickup('weapon',e.x-8,e.y,1);
      else if(roll<(e.elite?0.42:0.052))this.dropPickup('potion',e.x-8,e.y,1);
    }
    if(this.m.combo===5||this.m.combo===15||this.m.combo===30||this.m.combo===50)this.effects.text(this.player.x,this.player.y-40,this.m.combo===50?'BERSERK':`${this.m.combo} KILL STREAK`,'#d9bf86',true);
  }
  private explosion(x:number,y:number,radius:number,damage:number,ignite=false) {
    this.effects.ring(x,y,radius,0xeab279,0.4);this.effects.burst(x,y,0xe5a366,24,120);
    // Mark the source dead before recursion; burning chains cannot reward the same death twice.
    for(const target of this.enemies)if(target.alive&&target.charm<=0&&distance2(x,y,target.x,target.y)<radius**2){if(ignite)this.burnEnemy(target);this.hitEnemy(target,damage,false,true);}
    if(!this.effects.reduced)this.cameras.main.shake(90,0.0025);
  }
  private hurtPlayer(damage:number,sourceX:number,sourceY:number) {
    if(this.session.paused)return;
    const result=this.m.hurt(damage);
    if(result==='ignored')return;
    if(result==='shield'){
      this.effects.ring(this.player.x,this.player.y-15,100,0xe7d393);this.session.audio.play('spell');
      for(const e of this.enemies)if(e.alive&&e.charm<=0&&distance2(this.player.x,this.player.y,e.x,e.y)<110**2){
        this.hitEnemy(e,15*this.m.stats.magic,false,true);e.stun=0.8;const a=Math.atan2(e.y-this.player.y,e.x-this.player.x);e.x+=Math.cos(a)*40;e.y+=Math.sin(a)*40;
      }return;
    }
    if(result==='revived'){
      this.effects.burst(this.player.x,this.player.y-20,0xd8d8b0,40,140);this.session.toast('Not yet, death','Second Wind restored your life.','heart','legendary');return;
    }
    this.effects.text(this.player.x,this.player.y,`−${Math.ceil(Math.max(1,damage-this.m.stats.armor))}`,'#e59d92',true);
    this.playerHurtClock=0.23;
    this.effects.burst(this.player.x,this.player.y-20,0xbe7771,10,75);this.session.audio.play('hurt');
    if(!this.effects.reduced)this.cameras.main.shake(100,0.003);
    const a=Math.atan2(this.player.y-sourceY,this.player.x-sourceX);this.player.x+=Math.cos(a)*9;this.player.y+=Math.sin(a)*9;
    if(result==='dead'){this.session.intents.length=0;this.session.input.x=0;this.session.input.y=0;}
  }
  private performSpell(id:SpellId,echo=false) {
    const x=this.player.x,y=this.player.y,magic=this.m.stats.magic,range=170+this.m.rank('magic')*12;
    switch(id){
      case 'flame':
        this.effects.slash(x,y-15,this.facing,range,0xeeb379,1.35,0.38);
        for(let i=0;i<7;i++){const a=this.facing+(Math.random()-0.5)*1.2;this.effects.burst(x+Math.cos(a)*range*0.6,y-15+Math.sin(a)*range*0.6,0xf1a366,5,70);}
        for(const e of this.enemies)if(e.alive&&e.charm<=0&&distance2(x,y,e.x,e.y)<(range+e.radius)**2&&Math.abs(angleDifference(Math.atan2(e.y-y,e.x-x),this.facing))<0.8){this.burnEnemy(e);this.hitEnemy(e,34*magic,false,true);}break;
      case 'force':
        this.effects.ring(x,y-10,145+magic*15,0x8bc4e0);
        for(const e of this.enemies)if(e.alive&&e.charm<=0&&distance2(x,y,e.x,e.y)<(145+magic*15)**2){
          const a=Math.atan2(e.y-y,e.x-x);e.x+=Math.cos(a)*(e.boss?25:95);e.y+=Math.sin(a)*(e.boss?25:95);e.stun=e.boss?0.35:1.6;e.dash=0;e.telegraph=0;this.hitEnemy(e,24*magic,false,true);
        }break;
      case 'shield':
        this.m.shield=true;this.effects.ring(x,y-20,45,0xe9d49b);if(echo)this.m.heal(8);break;
      case 'trap':
        this.addZone(x,y,100+this.m.rank('magic')*10,0,8+this.m.rank('magic'),'trap',10*magic,0xb7a0df);break;
      case 'charm': {
        let target:Enemy|undefined,best=300**2;
        for(const e of this.enemies)if(e.alive&&!e.boss&&e.charm<=0){const d=distance2(x,y,e.x,e.y);if(d<best){target=e;best=d;}}
        if(target){target.charm=12+this.m.rank('magic')*2;target.charmTick=0.1;target.intangible=false;this.effects.ring(target.x,target.y-20,35,0x9dd1a9);this.effects.text(target.x,target.y-20,'CHARMED','#a7d1a3',true);}
        else if(!echo){this.m.cooldowns.charm=2;this.session.toast('No mind to bind','Move closer to a non-boss enemy.','eye');}
      }break;
    }
  }
  private spawnPosition() {
    const view=this.cameras.main.worldView;
    for(let tries=0;tries<20;tries++){
      const angle=Math.random()*TAU;
      const x=Phaser.Math.Clamp(this.player.x+Math.cos(angle)*(view.width/2+95),55,BALANCE.arena-55);
      const y=Phaser.Math.Clamp(this.player.y+Math.sin(angle)*(view.height/2+110),65,BALANCE.arena-55);
      if(distance2(x,y,this.player.x,this.player.y)>230**2)return {x,y};
    }
    return {x:Phaser.Math.Clamp(this.player.x+(this.player.x<BALANCE.arena/2?400:-400),55,BALANCE.arena-55),y:this.player.y};
  }
  private spawnEnemy(type:EnemyId|BossId,boss=false,x?:number,y?:number) {
    if(!boss&&this.enemies.filter(e=>e.alive).length>=BALANCE.maxEnemies)return;
    let e=this.enemies.find(v=>!v.inUse);
    if(!e){
      if(this.enemies.length>125)return;
      e={image:this.add.image(0,0,`${type}-0`).setOrigin(0.5,0.85),shadow:this.add.image(0,0,'shadow'),inUse:false} as Enemy;
      this.enemies.push(e);
    }
    const def=ENEMIES.find(v=>v.id===type)??ENEMIES[0],bd=BOSSES.find(v=>v.id===type);
    const pos=x!==undefined&&y!==undefined?{x,y}:this.spawnPosition();
    const elite=!boss&&this.m.time>90&&Math.random()<0.11;
    const scaling=1+this.m.time/240;
    const hp=boss?bd!.hp*(this.m.endless?1+(this.m.time-600)/300:1):def.hp*scaling*(elite?2.2:1);
    Object.assign(e,{inUse:true,alive:true,type,boss,def,x:pos.x,y:pos.y,hp,maxHp:hp,speed:boss?bd!.speed:def.speed*(1+Math.min(this.m.time/1800,0.45)),damage:boss?bd!.damage:def.damage*(1+this.m.time/700),radius:boss?bd!.radius:def.radius*(elite?1.2:1),cooldown:1+Math.random(),age:Math.random()*3,hurt:0,burn:0,burnTick:0.4,slow:0,stun:0,charm:0,charmTick:0,intangible:false,dash:0,vx:0,vy:0,telegraph:0,aiClock:2.2,pattern:0,phase:1,deathTime:0,scale:boss?1.15:elite?1.25:type==='necrophage'?1.23:1,elite});
    e.image.setPosition(e.x,e.y).setTexture(`${type}-0`).setScale(e.scale).setAlpha(1).setVisible(true).setTint(0xffffff);
    e.shadow.setPosition(e.x,e.y).setScale(boss?1.6:e.scale*0.65).setAlpha(0.65).setVisible(true);
    if(boss){
      const b=bd!;this.session.boss={name:b.name,hp,maxHp:hp,phase:1};this.session.audio.play('boss');
      this.session.toast('An ancient evil awakens',b.name,'crown','legendary');this.effects.ring(e.x,e.y,130,b.color,1);
      this.session.hint=b.title;
    }
    return e;
  }
  private updateDirector(dt:number) {
    this.spawnClock-=dt;this.lootClock-=dt;this.landmarkClock-=dt;
    if(this.spawnClock<=0){
      this.spawnClock=Math.max(0.48,1.55-this.m.time*0.0017)*(this.session.boss?1.65:1);
      const count=Math.min(5,1+Math.floor(this.m.time/95));
      const unlocked=this.m.time<25?1:this.m.time<50?2:this.m.time<80?3:this.m.time<115?4:this.m.time<145?5:6;
      for(let i=0;i<count;i++)this.spawnEnemy(ENEMIES[Math.floor(Math.random()*unlocked)].id);
    }
    if(this.bossIndex<3&&this.m.time>=BOSSES[this.bossIndex].time&&!this.session.boss){this.spawnEnemy(BOSSES[this.bossIndex].id,true);this.bossIndex++;}
    if(this.m.endless&&!this.session.boss){this.endlessBossClock-=dt;if(this.endlessBossClock<=0){this.endlessBossClock=90;this.spawnEnemy(BOSSES[Math.floor(Math.random()*3)].id,true);}}
    if(this.lootClock<=0){this.lootClock=52+Math.random()*22;const a=Math.random()*TAU;this.addLandmark('chest',Phaser.Math.Clamp(this.player.x+Math.cos(a)*230,80,BALANCE.arena-80),Phaser.Math.Clamp(this.player.y+Math.sin(a)*230,80,BALANCE.arena-80));this.session.hint='A forgotten cache glimmers nearby.';}
    if(this.landmarkClock<=0){this.landmarkClock=125;const a=Math.random()*TAU;this.addLandmark(Math.random()<0.5?'altar':'merchant',Phaser.Math.Clamp(this.player.x+Math.cos(a)*210,80,BALANCE.arena-80),Phaser.Math.Clamp(this.player.y+Math.sin(a)*210,80,BALANCE.arena-80));}
  }
  private updateEnemies(dt:number) {
    this.enemyGraphics.clear();
    for(const e of this.enemies){
      if(!e.inUse)continue;
      if(!e.alive){e.deathTime-=dt;e.image.setAlpha(Math.max(0,e.deathTime/(e.boss?1.1:0.32))).setScale(e.scale*(0.75+e.deathTime*0.35));e.shadow.setAlpha(0);
        if(e.deathTime<=0){e.inUse=false;e.image.setVisible(false);e.shadow.setVisible(false);}continue;
      }
      e.age+=dt;e.cooldown-=dt;e.hurt=Math.max(0,e.hurt-dt);e.stun=Math.max(0,e.stun-dt);e.slow=Math.max(0,e.slow-dt);
      if(e.burn>0){e.burn-=dt;e.burnTick-=dt;if(e.burnTick<=0){e.burnTick=0.6;this.hitEnemy(e,(4+this.m.rank('burn')*2)*this.m.stats.magic,false,true);if(!e.alive)continue;}if(Math.random()<dt*7)this.effects.burst(e.x,e.y-25,0xe6a471,1,25);}
      e.intangible=e.type==='wraith'&&Math.sin(e.age*1.3)>0.78&&e.charm<=0;
      if(e.charm>0){
        e.charm-=dt;e.charmTick-=dt;
        const target=this.nearestEnemy(600,e.x,e.y,e);
        if(target){const a=Math.atan2(target.y-e.y,target.x-e.x),d=Math.hypot(target.x-e.x,target.y-e.y);if(d>30){e.x+=Math.cos(a)*e.speed*1.3*dt;e.y+=Math.sin(a)*e.speed*1.3*dt;}else if(e.charmTick<=0){e.charmTick=0.85;this.hitEnemy(target,e.damage*2*this.m.stats.magic,false,true);this.effects.slash(e.x,e.y-15,a,42,0x99cb9e,1.5);}}
      }else if(e.stun<=0){
        const dx=this.player.x-e.x,dy=this.player.y-e.y,d=Math.hypot(dx,dy)||1,a=Math.atan2(dy,dx);
        let speed=e.speed*this.m.enemySpeed*(e.slow>0?0.45:1),mx=dx/d,my=dy/d;
        if(e.boss){e.aiClock-=dt;e.phase=e.hp<e.maxHp*0.45?2:1;if(e.aiClock<=0){e.aiClock=e.phase===2?2.5:3.8;this.bossAttack(e);}if(d<60)speed=0;}
        else if(e.type==='cultist'){
          if(d<200){mx=-mx;my=-my;}else if(d<285){speed=0;}
          if(e.cooldown<=0&&d<430){e.cooldown=e.def.interval;this.shoot(e.x,e.y-18,a,145,e.damage,0xb898d6);this.effects.ring(e.x,e.y-18,25,0xae91cb,0.25);}
        }else if(e.type==='hound'){
          if(e.telegraph>0){e.telegraph-=dt;speed=0;this.enemyGraphics.lineStyle(8,0xca8072,0.20);this.enemyGraphics.lineBetween(e.x,e.y,e.x+e.vx*160,e.y+e.vy*160);if(e.telegraph<=0)e.dash=0.6;}
          else if(e.dash>0){e.dash-=dt;mx=e.vx;my=e.vy;speed=300;}
          else if(e.cooldown<=0&&d<300){e.cooldown=3.8;e.telegraph=0.75;e.vx=mx;e.vy=my;speed=0;}
        }else if(e.type==='wraith'){mx+=Math.sin(e.age*2.6)*0.42;my+=Math.cos(e.age*2.1)*0.42;}
        if(e.boss&&e.dash>0){e.dash-=dt;mx=e.vx;my=e.vy;speed=430;}
        e.x+=mx*speed*dt;e.y+=my*speed*dt;
        if(d<e.radius+15&&e.cooldown<=0&&e.type!=='cultist'&&e.telegraph<=0){e.cooldown=e.boss?1.4:e.def.interval;this.hurtPlayer(e.damage,e.x,e.y);if(e.type==='vampire')e.hp=Math.min(e.maxHp,e.hp+e.damage*2);}
        if(e.type==='hound'&&e.dash>0&&d<e.radius+18){this.hurtPlayer(e.damage*1.3,e.x,e.y);e.dash=0;}
      }
      // Cheap local repulsion keeps crowds readable without rigid-body physics.
      if(!e.boss&&e.dash<=0)for(const other of this.enemies){
        if(other===e||!other.alive)continue;const dx=e.x-other.x,dy=e.y-other.y,r=e.radius+other.radius-4,d2=dx*dx+dy*dy;
        if(d2<r*r&&d2>0.01){const d=Math.sqrt(d2),push=(r-d)*dt*2.8;e.x+=dx/d*push;e.y+=dy/d*push;}
      }
      e.x=Phaser.Math.Clamp(e.x,30,BALANCE.arena-30);e.y=Phaser.Math.Clamp(e.y,30,BALANCE.arena-30);
      e.image.setPosition(e.x,e.y+(e.type==='wraith'||e.type==='queen'?Math.sin(e.age*2)*4:0)).setDepth(e.y).setFlipX(this.player.x<e.x).setTexture(`${e.type}-${Math.floor(e.age*7)%4}`);
      e.shadow.setPosition(e.x,e.y-1).setDepth(e.y-1);
      e.image.setTint(e.hurt>0?0xffedcf:e.charm>0?0x99d6a2:e.slow>0?0xa6d4e4:e.elite?0xe4d29e:0xffffff).setAlpha(e.intangible?0.28:e.type==='queen'&&!e.boss?0.65:1);
      if(e.elite||e.hp<e.maxHp*0.9){
        const width=e.boss?64:25,y=e.y-e.image.displayHeight*0.83-5;
        this.enemyGraphics.fillStyle(0x0b1511,0.8);this.enemyGraphics.fillRect(e.x-width/2,y,width,3);
        this.enemyGraphics.fillStyle(e.charm>0?0x9bc79c:e.elite?0xccb27c:0xa16e62,0.85);this.enemyGraphics.fillRect(e.x-width/2,y,width*Math.max(0,e.hp/e.maxHp),3);
      }
      if(e.boss&&e.alive)this.session.boss={name:BOSSES.find(b=>b.id===e.type)!.name,hp:e.hp,maxHp:e.maxHp,phase:e.phase};
      // Recycle distant normal enemies instead of simulating abandoned corners of the arena.
      if(!e.boss&&distance2(e.x,e.y,this.player.x,this.player.y)>1150**2){const pos=this.spawnPosition();e.x=pos.x;e.y=pos.y;}
    }
  }
  private bossAttack(e:Enemy) {
    const x=this.player.x,y=this.player.y,a=Math.atan2(y-e.y,x-e.x),pattern=e.pattern++%4;
    if(e.type==='guardian'){
      if(pattern===0)this.addZone(x,y,100,1.1,0.25,'slam',e.damage,0xc99a74);
      if(pattern===1)for(let i=-2;i<=2;i++)this.addZone(x+i*68,y+Math.sin(i)*45,37,0.9+Math.abs(i)*0.12,0.3,'root',e.damage*0.85,0xb4b17d);
      if(pattern===2)for(let i=0;i<4+e.phase;i++){const angle=i*TAU/(4+e.phase);this.spawnEnemy('ghoul',false,Phaser.Math.Clamp(e.x+Math.cos(angle)*100,40,BALANCE.arena-40),Phaser.Math.Clamp(e.y+Math.sin(angle)*100,40,BALANCE.arena-40));}
      if(pattern===3){this.addZone(e.x,e.y,170,1.25,0.2,'slam',e.damage*1.2,0xd0aa7c);for(let i=0;i<6;i++)this.shoot(e.x,e.y,i*TAU/6,110,e.damage*0.65,0xb6b78a);}
    }else if(e.type==='vampire'){
      if(pattern===0||pattern===2){
        e.vx=Math.cos(a);e.vy=Math.sin(a);e.stun=0.8;
        this.addZone(x,y,65,0.8,0.2,'rune',e.damage,0xd48a91);
        // Telegraph along the dash path; dash begins only when the stun warning expires.
        e.dash=0.6;
      }else if(pattern===1){
        const angle=Math.random()*TAU;e.x=Phaser.Math.Clamp(x+Math.cos(angle)*210,65,BALANCE.arena-65);e.y=Phaser.Math.Clamp(y+Math.sin(angle)*210,65,BALANCE.arena-65);
        this.effects.burst(e.x,e.y-20,0xc47a90,22,90);this.addZone(e.x,e.y,90,1.1,0.3,'rune',e.damage,0xc88392);
      }else for(let i=0;i<5+e.phase*2;i++)this.shoot(e.x,e.y,a+(i-(4+e.phase*2)/2)*0.19,155,e.damage*0.6,0xd191a6,true);
    }else{
      if(pattern===0){for(let i=0;i<10+e.phase*2;i++)this.shoot(e.x,e.y,i*TAU/(10+e.phase*2)+e.age,125,e.damage*0.6,0xb7a2e7);}
      else if(pattern===1){for(let i=0;i<3+e.phase;i++){const angle=i*TAU/(3+e.phase);this.addZone(x+Math.cos(angle)*85,y+Math.sin(angle)*85,64,1.15,0.3,'rune',e.damage,0xb4a1dc);}}
      else if(pattern===2){
        this.effects.burst(e.x,e.y-30,0xbaa4e1,22,100);const angle=Math.random()*TAU;e.x=Phaser.Math.Clamp(x+Math.cos(angle)*240,70,BALANCE.arena-70);e.y=Phaser.Math.Clamp(y+Math.sin(angle)*240,70,BALANCE.arena-70);
        for(let i=0;i<3;i++){
          const clone=this.spawnEnemy('queen',false,e.x+(i-1)*70,e.y+55);
          if(clone){clone.scale=0.48;clone.radius=18;clone.speed=78;clone.image.setScale(clone.scale);}
        }
      }else{
        this.addZone(x,y,130,1.4,0.3,'rune',e.damage*1.25,0xc8b5ec);
        for(let i=-1;i<=1;i++)this.shoot(e.x,e.y,a+i*0.3,170,e.damage*0.6,0xb9a7de);
      }
    }
    this.effects.ring(e.x,e.y,60,BOSSES.find(b=>b.id===e.type)!.color,0.7);
  }
  private shoot(x:number,y:number,angle:number,speed:number,damage:number,color:number,bat=false) {
    let p=this.projectiles.find(v=>!v.active);
    if(!p){if(this.projectiles.length>=BALANCE.maxProjectiles)return;p={image:this.add.image(0,0,'glow').setDepth(7900).setBlendMode(1),active:false} as Projectile;this.projectiles.push(p);}
    Object.assign(p,{active:true,x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage,life:5,radius:7});p.image.setTexture(bat?'bat':'glow').setPosition(x,y).setTint(bat?0xffffff:color).setScale(bat?0.8:0.45).setRotation(bat?angle+Math.PI/2:0).setAlpha(0.9).setVisible(true);
  }
  private updateProjectiles(dt:number) {
    for(const p of this.projectiles)if(p.active){
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.image.setPosition(p.x,p.y);
      if(distance2(p.x,p.y,this.player.x,this.player.y-17)<(p.radius+13)**2){this.hurtPlayer(p.damage,p.x,p.y);p.life=0;this.effects.burst(p.x,p.y,0xbca5d0,5,40);}
      if(p.life<=0){p.active=false;p.image.setVisible(false);}
    }
  }
  private addZone(x:number,y:number,radius:number,warning:number,life:number,kind:Zone['kind'],damage:number,color:number) {
    if(this.zones.length>=35)return;
    this.zones.push({x,y,radius,warning,life,maxLife:life,tick:0,kind,damage,color,triggered:false});
  }
  private updateZones(dt:number) {
    this.zoneGraphics.clear();
    for(let i=this.zones.length-1;i>=0;i--){
      const z=this.zones[i];
      if(z.warning>0){
        z.warning-=dt;const pulse=0.12+Math.sin(this.m.time*13)*0.04;
        this.zoneGraphics.fillStyle(z.color,pulse);this.zoneGraphics.fillCircle(z.x,z.y,z.radius);
        this.zoneGraphics.lineStyle(2,z.color,0.7);this.zoneGraphics.strokeCircle(z.x,z.y,z.radius);
        this.zoneGraphics.lineStyle(1,z.color,0.35);this.zoneGraphics.strokeCircle(z.x,z.y,z.radius*(1-Math.min(1,z.warning/1.4)));continue;
      }
      z.life-=dt;z.tick-=dt;
      const hostile=z.kind==='slam'||z.kind==='root'||z.kind==='rune';
      if(hostile&&!z.triggered){
        z.triggered=true;this.effects.ring(z.x,z.y,z.radius,z.color,0.4);this.effects.burst(z.x,z.y,z.color,18,100);
        if(distance2(z.x,z.y,this.player.x,this.player.y)<(z.radius+7)**2)this.hurtPlayer(z.damage,z.x,z.y);
      }
      this.zoneGraphics.fillStyle(z.color,hostile?0.2:0.065);this.zoneGraphics.fillCircle(z.x,z.y,z.radius);
      this.zoneGraphics.lineStyle(1.5,z.color,0.45);this.zoneGraphics.strokeCircle(z.x,z.y,z.radius);
      if(z.kind==='trap'||z.kind==='phantom'){
        this.zoneGraphics.lineStyle(1,z.color,0.28);this.zoneGraphics.strokeCircle(z.x,z.y,z.radius*0.7);
        for(let n=0;n<6;n++){const a=n*TAU/6+this.m.time*0.15;this.zoneGraphics.lineBetween(z.x+Math.cos(a)*z.radius*0.6,z.y+Math.sin(a)*z.radius*0.6,z.x+Math.cos(a+0.6)*z.radius*0.9,z.y+Math.sin(a+0.6)*z.radius*0.9);}
      }
      if(!hostile&&z.tick<=0){
        z.tick=0.65;
        for(const e of this.enemies)if(e.alive&&e.charm<=0&&distance2(z.x,z.y,e.x,e.y)<(z.radius+e.radius)**2){
          if(z.kind==='trap'||z.kind==='frost')e.slow=1.2;
          if(z.kind==='fire')this.burnEnemy(e);
          this.hitEnemy(e,z.damage*(z.kind==='trap'&&(e.type==='wraith'||e.type==='queen')?2.7:1),false,true);
        }
      }
      if(z.life<=0)this.zones.splice(i,1);
    }
  }
  private dropPickup(kind:Pickup['kind'],x:number,y:number,amount:number) {
    let p=this.pickups.find(v=>!v.active);
    if(!p){
      if(this.pickups.length>=BALANCE.maxPickups){
        const merge=this.pickups.find(v=>v.active&&v.kind===kind);
        if(merge){merge.amount+=amount;return;}
        if(kind==='xp')this.session.gainXp(amount);else if(kind==='gold')this.m.addGold(amount);return;
      }
      p={image:this.add.image(0,0,'xp').setDepth(3),glow:this.add.image(0,0,'glow').setDepth(2).setBlendMode(1),active:false} as Pickup;this.pickups.push(p);
    }
    const key=kind==='card'?'lootCard':kind==='weapon'?'lootSword':kind==='potion'?'potion':kind;
    const color=kind==='xp'?0x8fcbb9:kind==='gold'?0xd3b77b:kind==='card'?0xbea4df:kind==='weapon'?0xdac58e:0xb9b08a;
    Object.assign(p,{active:true,x,y,kind,amount,age:0});p.image.setTexture(key).setPosition(x,y).setScale(kind==='xp'?0.65:0.8).setAlpha(1).setVisible(true);p.glow.setPosition(x,y).setTint(color).setScale(kind==='xp'?0.6:0.85).setAlpha(0.27).setVisible(true);
  }
  private updatePickups(dt:number) {
    for(const p of this.pickups)if(p.active){
      p.age+=dt;const dx=this.player.x-p.x,dy=this.player.y-9-p.y,d=Math.hypot(dx,dy);
      if(d<this.m.stats.pickup||(p.age>35&&(p.kind==='xp'||p.kind==='gold'))){const speed=Math.max(150,420-d);p.x+=dx/Math.max(d,1)*speed*dt;p.y+=dy/Math.max(d,1)*speed*dt;}
      p.image.setPosition(p.x,p.y+Math.sin(p.age*3)*2);p.glow.setPosition(p.x,p.y);
      if(d<18){
        p.active=false;p.image.setVisible(false);p.glow.setVisible(false);
        switch(p.kind){
          case 'xp':this.session.gainXp(p.amount);break;
          case 'gold':this.m.addGold(p.amount);break;
          case 'card':this.session.offerCard();break;
          case 'weapon':this.session.offerWeapon(rollWeapon(this.m.time));break;
          case 'potion':this.grantConsumable();break;
        }
        this.effects.burst(this.player.x,this.player.y-12,p.kind==='gold'?0xd9bd7e:0x9ac4b5,3,30);this.session.audio.play('pickup');
        if(this.session.paused)break;
      }
    }
  }
  private grantConsumable() {
    if(Math.random()<0.25){
      const id=Math.random()<0.5?'fire':'frost';this.m.bombs[id]=Math.min(5,this.m.bombs[id]+1);this.session.toast('Supplies recovered',`${id==='fire'?'Fire':'Frost'} bomb +1`,'bomb');
      if(this.m.bombs[this.m.bomb]===0)this.m.bomb=id;
    }else{
      const id=rollPotion();if(this.m.potions[id]<this.m.potionCapacity)this.m.potions[id]++;
      else this.m.addGold(5);
      if(this.m.potions[this.m.potion]===0)this.m.potion=id;
      this.session.toast('Supplies recovered',`${id[0].toUpperCase()+id.slice(1)} potion +1`,'potion');
    }
  }
  private addLandmark(kind:Landmark['kind'],x:number,y:number) {
    let l=this.landmarks.find(v=>v.used);
    if(!l){if(this.landmarks.length>=10)return;l={image:this.add.image(0,0,kind).setOrigin(0.5,0.85),glow:this.add.image(0,0,'glow').setBlendMode(1),used:true} as Landmark;this.landmarks.push(l);}
    Object.assign(l,{x,y,kind,used:false,expires:kind==='merchant'?this.m.time+50:this.m.time+150});
    l.image.setTexture(kind).setPosition(x,y).setVisible(true).setDepth(y).setAlpha(1);
    l.glow.setPosition(x,y-15).setScale(2.1).setTint(kind==='chest'?0xd8b77a:kind==='altar'?0xb59bd7:0x9cc6a8).setAlpha(0.3).setDepth(y-1).setVisible(true);
  }
  private updateLandmarks(_dt:number) {
    for(const l of this.landmarks)if(!l.used){
      l.glow.setAlpha(0.19+Math.sin(this.m.time*2)*0.08);
      if(this.m.time>l.expires){l.used=true;l.image.setVisible(false);l.glow.setVisible(false);continue;}
      if(distance2(l.x,l.y,this.player.x,this.player.y)<45**2){
        l.used=true;l.image.setAlpha(0.4);l.glow.setVisible(false);
        if(l.kind==='chest'){
          this.m.totals.chests++;this.m.addGold(18+Math.floor(this.m.time/12));this.effects.burst(l.x,l.y-15,0xe2c78b,22,90);
          this.session.toast('Forgotten treasure','Gold and something worth keeping.','chest','rare');
          if(this.m.totals.chests===1||Math.random()<0.52)this.session.offerWeapon(rollWeapon(this.m.time));else this.session.offerCard();
          this.grantConsumable();
        }else this.session.show({type:'encounter',encounter:l.kind});
        this.session.hint=l.kind==='chest'?'Silver finds a way. Keep hunting.':'Some bargains follow you home.';
        if(this.session.paused)break;
      }
    }
  }
  private updateCompanion(dt:number) {
    const has=this.m.has('wolf');this.companion.setVisible(has);if(!has)return;
    this.wolfClock-=dt;
    const target=this.nearestEnemy(240);
    const tx=target?target.x-25:this.player.x-40,ty=target?target.y:this.player.y+20;
    this.companion.x+=(tx-this.companion.x)*Math.min(1,dt*5);this.companion.y+=(ty-this.companion.y)*Math.min(1,dt*5);
    this.companion.setFlipX(tx<this.companion.x).setDepth(this.companion.y).setAlpha(0.6+Math.sin(this.m.time*3)*0.1);
    if(target&&this.wolfClock<=0&&distance2(this.companion.x,this.companion.y,target.x,target.y)<80**2){
      this.wolfClock=1.2;const crit=this.m.has('instinct')&&Math.random()<0.25;
      this.hitEnemy(target,this.m.stats.damage*0.85*(crit?1.8:1),crit,true);this.effects.slash(target.x,target.y-20,0,30,0xa2cdc7,1.6);
    }
  }
  private updateAtmosphere(dt:number) {
    if(this.effects.reduced)return;
    for(let i=0;i<this.mist.length;i++){
      const m=this.mist[i];m.x+=dt*(4+i);if(m.x>this.player.x+600)m.x=this.player.x-600;
      m.y=this.player.y+(i-2)*135+Math.sin(this.m.time*0.08+i)*50;
    }
    if(Math.random()<dt*6)this.effects.burst(this.player.x+(Math.random()-0.5)*650,this.player.y+(Math.random()-0.5)*600,Math.random()<0.2?0xc6bc7d:0x92ad99,1,7);
  }
}
