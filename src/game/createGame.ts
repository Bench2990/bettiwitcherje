import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainScene } from './scenes/MainScene';
import type { Session } from './Session';

export function createGame(parent: HTMLElement,session: Session) {
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, width:parent.clientWidth,height:parent.clientHeight,
    backgroundColor:'#14231e',pixelArt:true,antialias:false,
    scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
    render:{roundPixels:true,powerPreference:'high-performance'},
    fps:{target:60,forceSetTimeOut:false,smoothStep:true},
    audio:{noAudio:true},input:{activePointers:4,touch:{capture:true}},
    scene:[new BootScene(),new MainScene(session)],
    banner:false,
  });
  if(process.env.NODE_ENV!=='production') {
    const target=window as unknown as {__WHITE_WOLF_GAME__?:Phaser.Game};
    target.__WHITE_WOLF_GAME__=game;
    game.events.once(Phaser.Core.Events.DESTROY,()=>{if(target.__WHITE_WOLF_GAME__===game)delete target.__WHITE_WOLF_GAME__;});
  }
  return game;
}
