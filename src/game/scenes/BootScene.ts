import * as Phaser from 'phaser';
import { generateTextures } from '../rendering/textures';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() { generateTextures(this); this.scene.start('Forest'); }
}
