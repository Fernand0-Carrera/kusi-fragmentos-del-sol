import Phaser from 'phaser';
import { CAPAS } from '../config/constants.js';

/** Flor de puya: resorte que lanza a Kusi muy alto al caer sobre ella. */
export default class Spring extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'puya', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.body.setSize(28, 14).setOffset(4, 18);
    this.setDepth(CAPAS.objetos);
  }

  activar() {
    this.play('puya-rebote');
  }
}
