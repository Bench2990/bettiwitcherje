import * as Phaser from 'phaser';

interface Particle { image: Phaser.GameObjects.Image; vx: number; vy: number; life: number; max: number; size: number }
interface Label { text: Phaser.GameObjects.Text; life: number; max: number; vy: number }
interface Arc { x: number; y: number; angle: number; radius: number; life: number; max: number; color: number; width: number }

export class Effects {
  private particles: Particle[] = [];
  private labels: Label[] = [];
  private arcs: Arc[] = [];
  private graphics: Phaser.GameObjects.Graphics;
  reduced = false;
  constructor(private scene: Phaser.Scene) { this.graphics = scene.add.graphics().setDepth(9000); }
  burst(x: number, y: number, color: number, count = 10, speed = 75) {
    const n = this.reduced ? Math.min(3, count) : count;
    for (let i = 0; i < n; i++) {
      let p = this.particles.find(v => v.life <= 0);
      if (!p) {
        if (this.particles.length >= (this.reduced ? 45 : 180)) break;
        p = { image: this.scene.add.image(0, 0, 'particle').setDepth(9100), vx: 0, vy: 0, life: 0, max: 0, size: 1 };
        this.particles.push(p);
      }
      const angle = Math.random()*Math.PI*2, velocity = speed*(0.3+Math.random()*0.7);
      p.image.setPosition(x,y).setTint(color).setVisible(true).setAlpha(1);
      p.vx=Math.cos(angle)*velocity; p.vy=Math.sin(angle)*velocity-15;
      p.life=p.max=0.3+Math.random()*0.45; p.size=0.4+Math.random()*0.65; p.image.setScale(p.size);
    }
  }
  text(x: number, y: number, value: string | number, color = '#e8e6cf', big = false) {
    if (this.reduced && Math.random() > 0.45 && !big) return;
    let l = this.labels.find(v => v.life <= 0);
    if (!l) {
      if(this.labels.length>=36) return;
      l={text:this.scene.add.text(0,0,'',{fontFamily:'Inter, sans-serif',fontSize:'13px',fontStyle:'bold',stroke:'#101813',strokeThickness:3}).setOrigin(0.5).setDepth(9500),life:0,max:0,vy:0};this.labels.push(l);
    }
    l.text.setPosition(x+(Math.random()-0.5)*14,y-28).setText(String(value)).setColor(color).setFontSize(big?19:13).setAlpha(1).setVisible(true);
    l.life=l.max=big?0.9:0.65;l.vy=big?-35:-27;
  }
  slash(x: number,y: number,angle:number,radius:number,color:number,width=1.9,life=0.2) { this.arcs.push({x,y,angle,radius,color,width,life,max:life}); }
  ring(x:number,y:number,radius:number,color:number,life=0.5) { this.arcs.push({x,y,angle:0,radius,color,width:Math.PI*2,life,max:life}); }
  lightning(points: {x:number;y:number}[]) {
    for(let i=0;i<points.length-1;i++) {
      const a=points[i],b=points[i+1];
      for(let j=0;j<6;j++) {
        const t=j/6, x=a.x+(b.x-a.x)*t+(Math.random()-0.5)*16, y=a.y+(b.y-a.y)*t+(Math.random()-0.5)*16;
        this.burst(x,y,0xc9d8ff,2,18);
      }
    }
  }
  update(dt:number) {
    this.graphics.clear();
    for(const p of this.particles) if(p.life>0){p.life-=dt;p.image.x+=p.vx*dt;p.image.y+=p.vy*dt;p.vy+=36*dt;p.image.setAlpha(Math.max(0,p.life/p.max));if(p.life<=0)p.image.setVisible(false);}
    for(const l of this.labels) if(l.life>0){l.life-=dt;l.text.y+=l.vy*dt;l.text.setAlpha(Math.min(1,Math.max(0,l.life/l.max*2)));if(l.life<=0)l.text.setVisible(false);}
    for(let i=this.arcs.length-1;i>=0;i--){
      const a=this.arcs[i];a.life-=dt;if(a.life<=0){this.arcs.splice(i,1);continue;}
      const t=1-a.life/a.max,r=a.radius*(0.65+t*0.35);
      this.graphics.lineStyle(a.width>6?2:5,a.color,(1-t)*0.75);
      this.graphics.beginPath();this.graphics.arc(a.x,a.y,r,a.angle-a.width/2,a.angle+a.width/2,false);this.graphics.strokePath();
      if(a.width<6){this.graphics.lineStyle(1,0xf3f2d8,(1-t)*0.9);this.graphics.beginPath();this.graphics.arc(a.x,a.y,r+3,a.angle-a.width/2+0.15,a.angle+a.width/2-0.1,false);this.graphics.strokePath();}
    }
  }
}
