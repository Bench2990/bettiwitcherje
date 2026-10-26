import { expect, test, type Page } from '@playwright/test';

async function start(page:Page) {
  await page.goto('/');await page.getByRole('button',{name:/BEGIN THE HUNT/}).click();
  await expect(page.locator('canvas')).toHaveCount(1);await expect(page.getByRole('button',{name:'Pause game'})).toBeVisible();
  await page.waitForFunction(()=>!!(window as any).__WHITE_WOLF__?.session?.ready);
}

test('cinematic menu, progression, collection, and settings work',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('WHITE');
  await page.screenshot({path:`test-results/menu-${test.info().project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'The armory',exact:false}).click();await expect(page.getByRole('heading',{name:'A stronger hunter. A darker night.'})).toBeVisible();
  await page.getByRole('button',{name:'Back to the hunt'}).click();await page.getByRole('button',{name:/Card collection/i}).click();await expect(page.locator('.collection-card')).toHaveCount(15);
  await page.getByRole('button',{name:'legendary',exact:true}).click();await expect(page.locator('.collection-card')).toHaveCount(3);
  await page.getByRole('button',{name:'Back to the hunt'}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();
  const effects=page.getByRole('switch',{name:'Reduced effects'});await effects.click();await expect(effects).toHaveAttribute('aria-checked','true');await page.reload();
  await page.getByRole('button',{name:'Settings',exact:true}).click();await expect(page.getByRole('switch',{name:'Reduced effects'})).toHaveAttribute('aria-checked','true');expect(errors).toEqual([]);
});

test('battlefield renders, movement and pause work, decisions apply, death and restart clean up',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
  await page.screenshot({path:`test-results/battle-${info.project.name}.png`});
  if(info.project.name!=='chromium'){
    const area=page.getByRole('group',{name:'Movement joystick'});const rect=await area.boundingBox();if(!rect)throw Error('No joystick');
    await page.mouse.move(rect.x+80,rect.y+90);await page.mouse.down();await page.mouse.move(rect.x+115,rect.y+90);await page.waitForTimeout(400);
    expect(await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.input.x)).toBeGreaterThan(0.5);await page.mouse.up();
    expect(await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.input.x)).toBe(0);
  }else{await page.keyboard.down('d');await page.waitForTimeout(400);await page.keyboard.up('d');}
  await page.getByRole('button',{name:'Shield',exact:true}).dispatchEvent('pointerdown',{button:0});
  await page.waitForTimeout(200);expect(await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.model.shield)).toBe(true);
  await page.getByRole('button',{name:'Pause game'}).click();const before=await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.model.time);await page.waitForTimeout(500);const after=await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.model.time);expect(after).toBe(before);
  await expect(page.getByRole('heading',{name:'The night can wait.'})).toBeVisible();await page.getByRole('button',{name:/Resume the hunt/}).click();
  await page.evaluate(()=>{const s=(window as any).__WHITE_WOLF__.session;s.gainXp(s.model.nextXp);});
  await expect(page.locator('.upgrade-card')).toHaveCount(3);await page.locator('.upgrade-card').first().click();
  expect(await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.model.level)).toBe(2);
  await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.offerCard('wolf'));await page.getByRole('button',{name:'Bind this arcana'}).click();
  expect(await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.model.cards)).toContain('wolf');
  await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.offerWeapon('ancient'));await page.getByRole('button',{name:'Equip Ancient Silver Blade'}).click();
  expect(await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.model.weapon)).toBe('ancient');
  await page.evaluate(()=>{const s=(window as any).__WHITE_WOLF__.session;s.model.invulnerable=0;s.model.shield=false;s.model.hurt(9999);});
  await expect(page.getByRole('heading',{name:'Even wolves fall.'})).toBeVisible();await page.getByRole('button',{name:'Hunt again'}).click();
  await page.waitForFunction(()=>!!(window as any).__WHITE_WOLF__?.session?.ready);await page.waitForTimeout(500);await expect(page.locator('canvas')).toHaveCount(1);
  expect(await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.model.level)).toBe(1);expect(errors).toEqual([]);
});

test('nested settings remain paused and ending a hunt banks rewards once',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
  await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.model.addGold(100));
  await page.getByRole('button',{name:'Pause game'}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();
  const time=await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.model.time);
  await page.getByRole('switch',{name:'Floating joystick'}).click();await page.keyboard.press('Escape');
  await expect(page.getByRole('heading',{name:'The night can wait.'})).toBeVisible();
  expect(await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.model.time)).toBe(time);
  await page.getByRole('button',{name:'End hunt',exact:true}).click();await expect(page.getByRole('heading',{name:'Leave the Blackwood?'})).toBeVisible();
  await page.getByRole('button',{name:'Save & return to menu'}).click();await expect(page.getByRole('button',{name:/BEGIN THE HUNT/})).toBeVisible();await expect(page.locator('canvas')).toHaveCount(0);
  const gold=await page.evaluate(()=>(window as any).__WHITE_WOLF__.store.data.gold);expect(gold).toBeGreaterThanOrEqual(100);
  await page.reload();await page.waitForFunction(()=>!!(window as any).__WHITE_WOLF__);
  expect(await page.evaluate(()=>(window as any).__WHITE_WOLF__.store.data.gold)).toBe(gold);expect(errors).toEqual([]);
});

test('real combat, magic, card synergies and all three bosses resolve end to end',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
  const combat=await page.evaluate(()=>{
    const s=(window as any).__WHITE_WOLF__.session,m=s.model,scene=(window as any).__WHITE_WOLF_GAME__.scene.getScene('Forest');
    m.invulnerable=999;scene.spawnClock=999;scene.lootClock=999;scene.landmarkClock=999;
    const x=scene.player.x,y=scene.player.y;
    const e=scene.spawnEnemy('necrophage',false,x+45,y);const hp=e.hp;scene.attackClock=0;scene.swordAttack();const swordWorked=e.hp<hp;
    m.cards=['flaming','explosive','phantom','frozen','wolf'];m.recalculate();
    const a=scene.spawnEnemy('ghoul',false,x+100,y),b=scene.spawnEnemy('necrophage',false,x+125,y);const bhp=b.hp;
    scene.burnEnemy(a);scene.hitEnemy(a,999,false,true);const chain=b.hp<bhp&&b.burn>0;
    m.learned=['flame','shield','force','trap','charm'];
    const wraith=scene.spawnEnemy('wraith',false,x+20,y+20);wraith.intangible=true;const whp=wraith.hp;scene.hitEnemy(wraith,3,false,false);const intangible=wraith.hp===whp;scene.hitEnemy(wraith,3,false,true);const magical=wraith.hp<whp;
    scene.performSpell('force');const force=e.stun>0;
    scene.performSpell('trap');const trap=scene.zones.some((z:any)=>z.kind==='trap');
    scene.performSpell('charm');const charm=scene.enemies.some((v:any)=>v.charm>0);
    m.cards=['phantom','frozen'];s.intents.push({type:'dodge'});m.cooldowns.dodge=0;scene.handleIntents();const frostTrail=scene.zones.some((z:any)=>z.kind==='frost');
    scene.performSpell('flame');const flame=scene.enemies.some((v:any)=>v.burn>0);
    return {swordWorked,chain,intangible,magical,force,trap,charm,frostTrail,flame};
  });
  expect(combat).toEqual({swordWorked:true,chain:true,intangible:true,magical:true,force:true,trap:true,charm:true,frostTrail:true,flame:true});
  for(const [index,time,name] of [[0,180,'Ancient Forest Guardian'],[1,360,'Crimson Vampire'],[2,600,'Wraith Queen']] as const){
    const result=await page.evaluate(({index,time})=>{
      const s=(window as any).__WHITE_WOLF__.session,m=s.model,scene=(window as any).__WHITE_WOLF_GAME__.scene.getScene('Forest');
      while(s.modal)s.close();m.time=time;scene.bossIndex=index;scene.updateDirector(0.01);
      const boss=scene.enemies.find((e:any)=>e.alive&&e.boss);if(!boss)return {spawned:false};
      const title=s.boss.name;for(let i=0;i<4;i++)scene.bossAttack(boss);const mechanics=scene.zones.length>0||scene.projectiles.some((p:any)=>p.active);
      scene.hitEnemy(boss,999999,true,true);scene.killEnemy(boss);const bosses=m.totals.bosses;
      let victory=false;while(s.modal){if(s.modal.type==='victory'){victory=true;break;}s.close();}
      return {spawned:true,title,mechanics,bosses,victory};
    },{index,time});
    expect(result.spawned).toBe(true);expect(result.title).toBe(name);expect(result.mechanics).toBe(true);expect(result.bosses).toBe(index+1);
    if(index===2){expect(result.victory).toBe(true);await expect(page.getByRole('heading',{name:'Dawn belongs to you.'})).toBeVisible();await page.getByRole('button',{name:'Continue into endless'}).click();expect(await page.evaluate(()=>(window as any).__WHITE_WOLF__.session.model.endless)).toBe(true);}
  }
  expect(errors).toEqual([]);
});
