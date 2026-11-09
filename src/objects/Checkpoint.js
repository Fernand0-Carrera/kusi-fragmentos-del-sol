import Phaser from 'phaser';
import { CAPAS } from '../config/constants.js';

/**
 * Apacheta: montículo de piedras que funciona como punto de control.
 * Al tocarla se enciende y Kusi reaparecerá aquí si cae al vacío.
 */
export default class Checkpoint extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'apacheta', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // cuerpo estático (no se mueve)
    this.activa = false;
    this.setDepth(CAPAS.objetos);
  }

  activar() {
    if (this.activa) return false;
    this.activa = true;
    this.setFrame(1);
    this.scene.tweens.add({ targets: this, scaleY: 1.15, duration: 120, yoyo: true });
    return true;
  }
}
