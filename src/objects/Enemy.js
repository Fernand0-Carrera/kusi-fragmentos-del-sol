import Phaser from 'phaser';
import { CAPAS } from '../config/constants.js';

/**
 * Clase base de los enemigos comunes. Las subclases solo definen su
 * movimiento en update(); morir() y el estado "vivo" son compartidos.
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textura, cuadroDerrota) {
    super(scene, x, y, textura, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.vivo = true;
    this.cuadroDerrota = cuadroDerrota;
    this.setDepth(CAPAS.enemigos);
  }

  morir() {
    if (!this.vivo) return;
    this.vivo = false;
    this.body.enable = false;
    this.anims.stop();
    this.setFrame(this.cuadroDerrota);
    this.scene.tweens.add({
      targets: this, alpha: 0, y: this.y + 6, duration: 450, delay: 150,
      onComplete: () => this.destroy()
    });
  }
}
