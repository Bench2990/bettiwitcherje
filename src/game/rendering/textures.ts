import type Phaser from 'phaser';
import { WEAPONS } from '../data/definitions';

type Ctx = CanvasRenderingContext2D;
function polygon(c: Ctx, color: string, points: number[][]) {
  c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
}
function rect(c: Ctx, color: string, x: number, y: number, w: number, h: number) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); }
function ellipse(c: Ctx, color: string, x: number, y: number, rx: number, ry: number) { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
function texture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void) {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const c = canvas.getContext('2d')!; c.imageSmoothingEnabled = false; draw(c); scene.textures.addCanvas(key, canvas);
}
export function seeded(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function hunter(c: Ctx, frame: number, state: string, back: boolean) {
  const stride = state === 'walk' ? Math.sin(frame / 8 * Math.PI * 2) * 4 : 0;
  if(state==='hurt')c.translate((frame%3)-1,-1);
  if (state === 'death') { c.translate(24, 48); c.rotate(Math.min(1.5, frame * 0.3)); c.translate(-24, -48); }
  if (state === 'dodge') { c.translate(24, 38); c.rotate((frame - 1) * 0.42); c.translate(-24, -38); }
  const bob = state === 'walk' ? Math.abs(stride) * 0.3 : 0;
  c.translate(0, -bob);
  // Crossed scabbards, with a silver and a blackened steel hilt.
  polygon(c, '#151d20', [[9, 15], [12, 12], [35, 45], [33, 48]]);
  polygon(c, '#565d5c', [[34, 12], [37, 14], [16, 47], [13, 45]]);
  rect(c, '#a3aaa2', 8, 13, 7, 2); rect(c, '#b8b9a5', 33, 13, 7, 2);
  rect(c, '#555349', 10, 7, 3, 7); rect(c, '#d0cdb4', 34, 7, 3, 7);
  // Articulated legs and worn leather boots.
  polygon(c, '#222b2a', [[15, 37], [24, 37], [23, 48 + stride], [19, 54 + stride], [13, 53 + stride]]);
  polygon(c, '#303938', [[24, 37], [33, 37], [34, 49 - stride], [31, 55 - stride], [25, 53 - stride]]);
  rect(c, '#101918', 12, 51 + stride, 10, 7); rect(c, '#101918', 25, 52 - stride, 11, 6);
  rect(c, '#68706b', 14, 51 + stride, 7, 2); rect(c, '#5b655f', 27, 52 - stride, 7, 2);
  // Fitted studded armor, layered shoulder plates, belts and wolf medallion.
  polygon(c, '#172323', [[14, 20], [33, 20], [36, 32], [32, 42], [15, 42], [12, 30]]);
  polygon(c, '#34413e', [[15, 21], [23, 24], [23, 36], [15, 34]]);
  polygon(c, '#2a3634', [[25, 24], [33, 21], [33, 34], [25, 37]]);
  rect(c, '#101c1c', 12, 24, 6, 9); rect(c, '#4b5750', 11, 22, 8, 4);
  rect(c, '#111d1c', 31, 24, 6, 9); rect(c, '#60695d', 30, 22, 8, 4);
  for (let i = 0; i < 3; i++) { rect(c, '#828c7d', 15 + i * 7, 25, 1, 1); rect(c, '#6e7768', 16 + i * 7, 34, 1, 1); }
  polygon(c, '#71634b', [[14, 36], [34, 39], [33, 42], [14, 39]]); rect(c, '#c1ad7e', 23, 38, 4, 3);
  polygon(c, '#706450', [[17, 21], [19, 21], [32, 39], [30, 40]]);
  if (!back) { rect(c, '#b6b8a2', 22, 24, 4, 3); rect(c, '#e0dcc0', 23, 25, 2, 3); }
  // Bracers and hands.
  rect(c, '#3c4540', 10, 29, 6, 9); rect(c, '#c0aa92', 10, 37, 5, 4);
  const attack = state === 'attack';
  if (attack) {
    polygon(c, '#414d46', [[32, 26], [38, 23], [43, 28], [38, 33], [32, 32]]);
    rect(c, '#c6b39c', 39, 25, 5, 5);
    c.save();c.translate(42,27);c.rotate((frame-3.5)*0.15);c.translate(-42,-27);
    polygon(c, '#e9ede3', [[42, 26], [44, 25], [47, 3], [45, 4]]); rect(c, '#c0a970', 39, 25, 8, 2);c.restore();
  } else {
    rect(c, '#3e4943', 32, 29, 6, 10); rect(c, '#c0aa92', 33, 38, 5, 4);
    polygon(c, '#8eaaa7', [[36, 41], [38, 41], [43, 59], [41, 57]]); rect(c, '#b3a476', 33, 42, 8, 2);
    polygon(c, '#e3ede4', [[37, 43], [38, 43], [43, 59]]);
  }
  // Face, stubble, eye scar and unmistakable silver-white hair.
  rect(c, '#a99580', 19, 12, 12, 10); rect(c, '#d1c0a6', 18, 10, 14, 9);
  rect(c, '#e0d2b7', 19, 12, 10, 5);
  if (!back) {
    rect(c, '#6e6a5b', 19, 19, 11, 3); rect(c, '#baab94', 21, 18, 7, 3);
    rect(c, '#3d3f32', 19, 15, 4, 2); rect(c, '#3d3f32', 26, 15, 4, 2);
    rect(c, '#edbf55', 20, 15, 2, 1); rect(c, '#edbf55', 27, 15, 2, 1);
    rect(c, '#9b7667', 28, 12, 1, 7); rect(c, '#77614f', 24, 20, 4, 1);
  }
  polygon(c, '#a5b1ad', [[16, 10], [17, 5], [23, 3], [30, 5], [33, 10], [32, 14], [28, 8], [19, 10], [18, 18], [15, 17]]);
  polygon(c, '#d8ddd2', [[17, 8], [20, 4], [28, 4], [32, 8], [25, 7], [20, 9], [18, 14], [16, 13]]);
  rect(c, '#eff0dd', 20, 4, 8, 2); rect(c, '#bdc9c1', 15, 13, 3, 10);
  polygon(c, '#cbd4ca', [[29, 7], [33, 10], [34, 21], [38, 28], [32, 26], [29, 17]]);
  rect(c, '#747b70', 31, 17, 3, 2); rect(c, '#e1e5d5', 32, 20, 2, 6);
  if (back) { polygon(c, '#c9d1c7', [[17, 8], [30, 7], [33, 15], [29, 23], [21, 19], [17, 21]]); rect(c, '#7a857b', 25, 19, 5, 2); }
}

function enemy(c: Ctx, type: string, frame: number) {
  const s = Math.sin(frame * Math.PI / 2) * 3;
  if (type === 'hound') {
    polygon(c, '#252b2a', [[5, 31], [10, 25], [15, 22], [35, 24], [43, 32], [35, 42], [12, 40]]);
    polygon(c, '#6c7569', [[8, 29], [14, 24], [31, 25], [37, 32], [30, 36], [10, 35]]);
    polygon(c, '#414b44', [[9, 33], [14, 34], [13, 46+s], [7, 47+s]]); polygon(c, '#3d4740', [[29, 33], [34, 35], [38, 47-s], [32, 47-s]]);
    polygon(c, '#788375', [[32, 23], [42, 24], [46, 33], [39, 37], [31, 30]]);
    polygon(c, '#333e39', [[32, 24], [33, 15], [39, 24], [42, 18], [45, 29]]);
    rect(c, '#e5ba70', 39, 27, 3, 2); rect(c, '#e5d7bb', 42, 33, 3, 2);
    polygon(c, '#596357', [[9, 27], [1, 19], [4, 33], [11, 35]]); return;
  }
  if (type === 'wraith') {
    polygon(c, '#3a404f', [[18, 11], [30, 11], [36, 27], [39, 50], [32, 45], [27, 56], [22, 48], [16, 54], [10, 47], [13, 27]]);
    polygon(c, '#7a8b9e', [[19, 13], [29, 13], [33, 33], [29, 47], [24, 42], [19, 49], [15, 40]]);
    polygon(c, '#b3bec4', [[21, 13], [27, 13], [30, 21], [27, 29], [20, 24]]);
    rect(c, '#bee0e0', 21, 18, 2, 2); rect(c, '#bee0e0', 27, 18, 2, 2);
    polygon(c, '#8e9aaa', [[16, 22], [10, 26+s], [4, 37+s], [10, 35], [17, 29]]);
    polygon(c, '#8e9aaa', [[32, 22], [39, 26-s], [45, 37-s], [38, 35], [31, 29]]); return;
  }
  if (type === 'cultist') {
    polygon(c, '#29212f', [[17, 15], [31, 15], [34, 29], [40, 53], [9, 53], [13, 29]]);
    polygon(c, '#5e465f', [[20, 20], [28, 20], [29, 39], [34, 51], [17, 50], [20, 35]]);
    polygon(c, '#776077', [[15, 17], [18, 7], [25, 3], [32, 11], [34, 20], [28, 24], [20, 23]]);
    polygon(c, '#1b1e24', [[20, 12], [28, 12], [30, 19], [24, 23], [19, 18]]);
    rect(c, '#db9bb8', 21, 16, 2, 1); rect(c, '#db9bb8', 26, 16, 2, 1);
    rect(c, '#6e5c47', 39, 14, 3, 39); polygon(c, '#c1a0ce', [[40, 5], [45, 12], [40, 19], [35, 12]]);
    rect(c, '#c6ac8c', 35, 29+s, 6, 4); rect(c, '#ae9167', 17, 35, 16, 2); return;
  }
  const brute = type === 'necrophage';
  const skin = type === 'drowner' ? '#719b9c' : brute ? '#92927a' : '#859580';
  const shade = type === 'drowner' ? '#3c606b' : brute ? '#5d6150' : '#4b6554';
  const wide = brute ? 5 : 0;
  polygon(c, '#333d35', [[15-wide, 34], [23, 34], [22, 47+s], [18, 54+s], [11-wide, 53+s]]);
  polygon(c, '#38473b', [[25, 34], [33+wide, 34], [37+wide, 52-s], [29, 55-s], [26, 46-s]]);
  polygon(c, shade, [[13-wide, 20], [31+wide, 17], [37+wide, 37], [31+wide, 44], [13-wide, 40], [10-wide, 28]]);
  polygon(c, skin, [[15-wide, 19], [29+wide, 18], [33+wide, 31], [27, 35], [15-wide, 30]]);
  polygon(c, shade, [[12-wide, 22], [6, 28+s], [4, 42+s], [9, 44+s], [16, 30]]);
  polygon(c, skin, [[33+wide, 23], [40, 29-s], [44, 42-s], [38, 45-s], [31, 31]]);
  rect(c, '#b9b697', 3, 41+s, 6, 3); rect(c, '#c5c3a5', 39, 42-s, 6, 3);
  polygon(c, shade, [[20, 8], [31, 9], [35, 18], [30, 26], [19, 23], [17, 15]]);
  polygon(c, skin, [[21, 7], [30, 8], [33, 17], [26, 22], [19, 18]]);
  rect(c, '#e0cd8b', 21, 14, 3, 2); rect(c, '#e0cd8b', 29, 14, 3, 2); rect(c, '#343d36', 24, 19, 6, 2);
  rect(c, '#8c7961', 14-wide, 37, 19+wide*2, 4);
  if (brute) { rect(c, '#a2997d', 11, 25, 4, 5); polygon(c, '#b4ac8a', [[19, 5], [17, 0], [24, 6], [30, 7], [37, 3], [34, 12]]); rect(c, '#8d6359', 25, 29, 7, 2); }
  if (type === 'drowner') { polygon(c, '#53717a', [[19, 10], [12, 7], [18, 19], [13, 20], [20, 23]]); polygon(c, '#53898c', [[30, 8], [35, 2], [36, 13], [40, 12], [33, 23]]); rect(c, '#a1beb1', 20, 28, 8, 2); }
}

function boss(c: Ctx, id: string, frame: number) {
  const bob = Math.sin(frame * Math.PI / 2) * 2;
  c.translate(0, bob);
  if (id === 'guardian') {
    polygon(c, '#283a2e', [[42, 67], [61, 67], [59, 116], [43, 133], [21, 130], [33, 117]]);
    polygon(c, '#344636', [[68, 67], [88, 69], [94, 114], [114, 128], [86, 132], [70, 116]]);
    polygon(c, '#46513b', [[36, 32], [84, 27], [102, 65], [89, 93], [46, 96], [25, 65]]);
    polygon(c, '#687052', [[42, 33], [67, 31], [59, 76], [40, 83], [29, 59]]);
    polygon(c, '#6b7555', [[76, 36], [88, 42], [94, 67], [80, 83], [71, 72]]);
    polygon(c, '#4c6041', [[33, 38], [16, 38], [5, 77], [11, 99], [22, 91], [21, 65], [40, 56]]);
    polygon(c, '#596a45', [[90, 38], [110, 39], [124, 77], [115, 101], [104, 93], [105, 68], [88, 59]]);
    polygon(c, '#65714c', [[46, 30], [40, 11], [24, 5], [31, 19], [22, 26], [40, 26], [46, 44]]);
    polygon(c, '#758059', [[76, 32], [83, 13], [99, 3], [94, 20], [108, 24], [86, 29], [83, 42]]);
    polygon(c, '#889166', [[51, 22], [74, 21], [85, 43], [73, 57], [52, 57], [41, 40]]);
    polygon(c, '#283b2e', [[45, 37], [61, 41], [55, 46], [47, 44]]); polygon(c, '#283b2e', [[65, 41], [82, 36], [78, 45], [69, 46]]);
    rect(c, '#e4d48d', 49, 40, 8, 3); rect(c, '#e4d48d', 70, 40, 8, 3);
    polygon(c, '#20362b', [[56, 49], [71, 49], [65, 57], [60, 56]]);
    for (let i = 0; i < 6; i++) rect(c, '#8b8b5b', 43+i*7, 64+(i%2)*5, 3, 17);
    rect(c, '#b0b77c', 60, 62, 8, 7);
  } else {
    const queen = id === 'queen';
    const color = queen ? '#84789d' : '#733b49', light = queen ? '#c8bdd5' : '#d3bab0';
    polygon(c, queen ? '#39394f' : '#321e2a', [[40, 37], [84, 37], [106, 117], [84, 109], [73, 135], [58, 121], [35, 134], [18, 121]]);
    polygon(c, color, [[49, 38], [75, 38], [84, 100], [71, 116], [61, 105], [47, 121], [38, 110]]);
    polygon(c, queen ? '#6b6589' : '#9d4c5e', [[40, 41], [25, 54], [11, 82], [25, 82], [44, 60]]);
    polygon(c, queen ? '#6b6589' : '#9d4c5e', [[84, 41], [104, 51], [120, 82], [104, 82], [82, 60]]);
    polygon(c, light, [[50, 18], [74, 18], [79, 32], [69, 49], [56, 48], [45, 33]]);
    polygon(c, '#1c2530', [[45, 24], [50, 11], [74, 11], [80, 27], [72, 22], [64, 18], [53, 23], [50, 32]]);
    rect(c, queen ? '#a4e2d6' : '#f58989', 51, 29, 7, 3); rect(c, queen ? '#a4e2d6' : '#f58989', 67, 29, 7, 3);
    rect(c, '#725163', 59, 40, 9, 2);
    if (queen) { polygon(c, '#d2bc8e', [[46, 17], [44, 3], [53, 10], [61, 0], [70, 10], [80, 3], [77, 17]]); rect(c, '#dbd0ec', 48, 16, 29, 3); rect(c, '#b5a8c7', 43, 24, 5, 37); rect(c, '#c9bdcf', 77, 24, 5, 36); }
    else { polygon(c, '#752b40', [[43, 38], [27, 26], [35, 52], [55, 59], [66, 46], [81, 59], [94, 25], [79, 38]]); rect(c, '#dfd2b6', 55, 37, 2, 5); rect(c, '#dfd2b6', 69, 37, 2, 5); }
    rect(c, '#d0bd8c', 49, 73, 29, 4); rect(c, '#dbcb9b', 59, 54, 9, 10);
    rect(c, light, 16, 78, 10, 7); rect(c, light, 104, 78, 10, 7);
  }
}

export function generateTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('hunter-idle-front-0')) return;
  for (const state of ['idle', 'walk', 'attack', 'dodge', 'hurt', 'death']) {
    for (const back of [false, true]) for (let frame = 0; frame < 8; frame++) {
      texture(scene, `hunter-${state}-${back ? 'back' : 'front'}-${frame}`, 48, 64, c => hunter(c, frame, state, back));
    }
  }
  for (const type of ['ghoul', 'drowner', 'wraith', 'necrophage', 'hound', 'cultist']) {
    for (let frame = 0; frame < 4; frame++) texture(scene, `${type}-${frame}`, 48, 64, c => enemy(c, type, frame));
  }
  for (const id of ['guardian', 'vampire', 'queen']) for (let frame = 0; frame < 4; frame++) texture(scene, `${id}-${frame}`, 128, 144, c => boss(c, id, frame));
  for(const weapon of WEAPONS)texture(scene,`blade-${weapon.id}`,20,48,c=>{
    const color=`#${weapon.color.toString(16).padStart(6,'0')}`;
    const wide=weapon.id==='ancient'||weapon.id==='infernal';
    polygon(c,color,[[10,1],[wide?15:12,8],[12,34],[8,34],[wide?5:8,8]]);
    polygon(c,'#e6ead0',[[10,2],[11,11],[10,33],[8,33],[8,9]]);
    rect(c,weapon.id==='bloodfang'?'#9a5260':'#b6a272',3,33,14,3);rect(c,'#495144',8,36,4,8);rect(c,color,7,44,6,3);
    if(weapon.id==='stormbringer')polygon(c,'#919fe0',[[12,5],[16,15],[12,18],[15,27],[10,21],[13,17],[10,12]]);
    if(weapon.id==='infernal')polygon(c,'#dfa273',[[13,9],[17,15],[13,18],[15,25],[11,30],[12,17]]);
    if(weapon.id==='ancient'){rect(c,'#d5bb7f',8,12,4,1);rect(c,'#d5bb7f',9,10,1,7);rect(c,'#e7cb82',1,32,3,7);rect(c,'#e7cb82',16,32,3,7);}
  });
  texture(scene, 'wolf', 64, 48, c => {
    polygon(c, '#53858a', [[10, 19], [27, 15], [45, 18], [50, 29], [28, 32], [10, 28], [1, 14]]);
    polygon(c, '#afcfd0', [[12, 17], [30, 13], [45, 17], [47, 25], [30, 27], [13, 24]]);
    polygon(c, '#c5ded6', [[43, 16], [45, 4], [51, 12], [55, 6], [59, 19], [64, 23], [54, 29], [45, 25]]);
    polygon(c, '#8eb8b8', [[15, 25], [21, 25], [17, 42], [11, 42]]); polygon(c, '#8eb8b8', [[39, 25], [45, 25], [50, 41], [43, 42]]);
    rect(c, '#f2dda1', 54, 17, 3, 2);
  });
  const random = seeded(721);
  texture(scene, 'ground', 256, 256, c => {
    rect(c, '#17251f', 0, 0, 256, 256);
    for (let i = 0; i < 2300; i++) {
      const color = ['#1d2b23', '#1e2d25', '#13211d', '#243128', '#1a2823', '#273329'][Math.floor(random()*6)];
      rect(c, color, random()*256, random()*256, 1+Math.floor(random()*5), 1+Math.floor(random()*3));
    }
    for (let i = 0; i < 80; i++) { const x=random()*256,y=random()*256; rect(c,'#354132',x,y,1,3); rect(c,'#2a392c',x+2,y+2,1,3); }
  });
  texture(scene, 'tree', 144, 196, c => {
    polygon(c, '#0b1614', [[67, 109], [88, 103], [91, 166], [112, 188], [86, 182], [77, 174], [59, 187], [34, 189], [60, 163]]);
    polygon(c, '#2e3a2c', [[68, 99], [79, 101], [77, 168], [66, 175]]);
    polygon(c, '#18291f', [[68, 1], [94, 43], [84, 38], [115, 82], [103, 76], [140, 132], [96, 131], [80, 143], [39, 139], [3, 128], [39, 85], [27, 90], [51, 49], [41, 53]]);
    polygon(c, '#223529', [[69, 5], [78, 45], [58, 53], [50, 51]]);
    polygon(c, '#2b3e2c', [[51, 55], [71, 46], [65, 71], [36, 88]]);
    polygon(c, '#243a2a', [[66, 72], [95, 65], [114, 91], [85, 87]]);
    polygon(c, '#2a3c2d', [[40, 95], [65, 89], [53, 117], [12, 127]]);
    polygon(c, '#314331', [[62, 95], [85, 94], [77, 127], [52, 139]]);
    polygon(c, '#1b2f23', [[82, 99], [107, 98], [137, 131], [88, 134]]);
    for (let i=0;i<100;i++) { const x=35+random()*65,y=50+random()*78; rect(c,random()>.5?'#354634':'#17291f',x,y,3,2); }
  });
  texture(scene, 'deadTree', 128, 172, c => {
    polygon(c,'#202c26',[[57,72],[70,65],[73,146],[98,166],[74,162],[63,154],[43,166],[27,166],[52,145]]);
    polygon(c,'#364136',[[61,74],[67,68],[65,151],[57,155]]);
    polygon(c,'#2a372e',[[60,103],[33,73],[20,28],[29,43],[40,66],[53,69],[49,35],[31,17],[48,26],[59,47],[65,13],[77,1],[70,30],[73,62],[94,43],[111,13],[105,49],[78,80],[74,109]]);
    polygon(c,'#2b372e',[[40,71],[11,65],[1,47],[19,57],[38,60]]); rect(c,'#465044',61,56,3,36);
  });
  texture(scene, 'rock', 72, 56, c => {
    polygon(c,'#15201c',[[8,46],[3,32],[16,15],[40,7],[62,23],[69,43],[47,53],[21,52]]);
    polygon(c,'#424b41',[[7,31],[18,16],[39,10],[56,22],[46,36],[19,39]]);
    polygon(c,'#303d34',[[20,40],[47,36],[59,24],[65,41],[45,49],[23,48]]);
    polygon(c,'#57604e',[[17,17],[38,11],[49,20],[25,25]]); rect(c,'#506144',10,33,13,4); rect(c,'#586747',19,37,8,3);
  });
  texture(scene, 'ruin', 112, 112, c => {
    polygon(c,'#1c2922',[[8,89],[14,30],[31,22],[40,37],[39,90],[83,91],[80,48],[96,36],[104,88],[97,103],[18,103]]);
    for(let y=30;y<92;y+=13) { rect(c,'#4a5348',15+(y%2)*3,y,23,11); rect(c,'#3d493f',83,y+10,16,11); }
    for(let x=18;x<96;x+=20) rect(c,'#515a4c',x,91,18,9);
    polygon(c,'#647053',[[14,29],[27,21],[38,29],[36,34],[16,36]]);
    rect(c,'#2c4a36',17,61,8,18); rect(c,'#38533b',20,76,9,11); rect(c,'#859575',23,40,7,3);
  });
  texture(scene, 'bones', 48, 36, c => {
    rect(c,'#6e7460',10,20,24,3); rect(c,'#8e8f74',11,18,2,8); rect(c,'#8e8f74',32,18,2,8);
    polygon(c,'#8e9077',[[18,9],[29,8],[33,15],[29,23],[19,22],[15,16]]); rect(c,'#323c32',19,13,4,4); rect(c,'#323c32',26,13,4,4); rect(c,'#b0ad8a',20,9,8,2);
  });
  texture(scene,'chest',48,48,c=>{
    rect(c,'#17241c',4,18,40,25); rect(c,'#644e31',6,17,36,22); rect(c,'#957849',6,18,36,9);
    rect(c,'#b1a16a',10,17,4,23); rect(c,'#b1a16a',34,17,4,23); rect(c,'#ccb47b',5,26,38,3);
    rect(c,'#363a2b',20,25,9,11); rect(c,'#d9be7a',22,26,5,7); rect(c,'#4b412b',24,29,1,3);
    polygon(c,'#8c7042',[[6,17],[12,10],[36,10],[42,17]]); rect(c,'#c0a76b',11,10,4,8); rect(c,'#c0a76b',32,10,4,8);
  });
  texture(scene,'altar',80,96,c=>{
    polygon(c,'#38433b',[[10,78],[18,65],[61,65],[72,78],[66,88],[15,88]]);
    rect(c,'#495448',25,34,29,40); polygon(c,'#66705a',[[13,35],[26,24],[56,24],[67,35],[60,43],[18,43]]);
    polygon(c,'#a28fb0',[[40,3],[49,15],[40,29],[31,15]]); rect(c,'#c7b9d0',39,6,2,15);
    rect(c,'#af9cbc',35,49,10,2); rect(c,'#af9cbc',39,45,2,17);
  });
  texture(scene,'merchant',64,80,c=>{
    polygon(c,'#35473f',[[20,30],[42,30],[51,69],[14,69]]); polygon(c,'#6d7760',[[25,28],[39,28],[42,66],[23,66]]);
    polygon(c,'#657161',[[16,27],[21,8],[35,3],[45,12],[49,27],[36,36],[24,34]]); rect(c,'#242e29',25,18,15,13);
    rect(c,'#cebd8e',28,23,3,2); rect(c,'#cebd8e',36,23,3,2); rect(c,'#b3a078',24,43,19,4);
    rect(c,'#5b4c33',44,42,15,24); rect(c,'#ad9b68',47,44,9,4); rect(c,'#252f28',19,67,10,9); rect(c,'#252f28',35,67,10,9);
  });
  texture(scene,'camp',64,56,c=>{
    for(let i=0;i<8;i++){const a=i*Math.PI/4; ellipse(c,'#53604c',32+Math.cos(a)*21,35+Math.sin(a)*12,6,4);}
    polygon(c,'#755138',[[18,33],[44,41],[47,36],[21,28]]); polygon(c,'#755138',[[20,41],[46,30],[43,26],[17,37]]);
    polygon(c,'#ba6f3f',[[23,35],[24,22],[31,26],[35,10],[43,30],[38,40]]); polygon(c,'#e8b76c',[[27,34],[33,21],[38,34],[33,38]]);
  });
  texture(scene,'xp',16,20,c=>{polygon(c,'#316e6e',[[8,1],[14,8],[10,18],[5,18],[1,8]]);polygon(c,'#8ec5b7',[[8,1],[9,10],[5,17],[2,8]]);polygon(c,'#d0e8c4',[[8,2],[11,8],[8,10],[5,8]]);});
  texture(scene,'gold',16,16,c=>{ellipse(c,'#8b713d',8,9,6,6);ellipse(c,'#d2b36b',8,7,6,6);rect(c,'#f3db93',6,3,3,7);rect(c,'#9d7e41',9,5,2,6);});
  texture(scene,'potion',20,28,c=>{rect(c,'#8d8059',7,2,7,4);rect(c,'#a0b1a0',6,6,9,7);polygon(c,'#77958a',[[6,12],[14,12],[18,19],[15,26],[5,26],[2,20]]);polygon(c,'#ba6e68',[[5,17],[15,17],[16,22],[13,25],[6,25],[3,21]]);rect(c,'#d0ddd1',5,14,2,6);});
  texture(scene,'lootCard',26,34,c=>{rect(c,'#b39a65',1,1,24,32);rect(c,'#243a32',3,3,20,28);polygon(c,'#c7b07a',[[13,7],[21,16],[13,27],[5,16]]);polygon(c,'#47675a',[[13,11],[17,17],[13,23],[9,17]]);});
  texture(scene,'lootSword',28,38,c=>{polygon(c,'#d6dccb',[[19,2],[23,1],[21,23],[16,23]]);rect(c,'#c9ac6e',10,23,16,3);rect(c,'#7e6b4f',16,26,5,9);rect(c,'#d2b47b',15,34,7,3);});
  texture(scene,'shadow',64,28,c=>{ellipse(c,'#07110eaa',32,14,29,10);});
  texture(scene,'glow',64,64,c=>{const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#ffffff90');g.addColorStop(0.4,'#ffffff30');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,64,64);});
  texture(scene,'particle',4,4,c=>rect(c,'#ffffff',0,0,4,4));
  texture(scene,'bat',32,22,c=>{
    polygon(c,'#ad7d94',[[15,9],[7,2],[1,0],[4,13],[9,11],[11,17],[15,14],[19,17],[23,11],[29,14],[31,1],[25,3],[18,9]]);
    polygon(c,'#5d425b',[[12,9],[14,5],[16,8],[18,5],[20,10],[18,17],[15,20],[12,15]]);
    rect(c,'#e8b3ab',13,10,2,1);rect(c,'#e8b3ab',17,10,2,1);
  });
}
