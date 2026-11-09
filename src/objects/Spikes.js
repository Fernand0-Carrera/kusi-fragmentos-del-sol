import Phaser from 'phaser';
import { CAPAS } from '../config/constants.js';

/** Púas de hielo: dañan al tocarlas. El cuerpo cubre solo las puntas inferiores. */
export default class Spikes extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'puas');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.body.setSize(26, 16).setOffset(3, 16);
    this.setDepth(CAPAS.objetos);
  }
}
