import Phaser from 'phaser';
import { CAPAS } from '../config/constants.js';

/**
 * Objeto recolectable (fragmento de sol o corazón). Flota con una animación
 * suave y desaparece hacia arriba al ser recogido.
 */
export default class Collectible extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, tipo) {
    super(scene, x, y, tipo === 'fragmento' ? 'fragmento' : 'corazon', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.tipo = tipo;
    this.body.allowGravity = false;
    this.body.setCircle(10, 4, 4);
    this.setDepth(CAPAS.objetos);
    if (tipo === 'fragmento') this.play({ key: 'fragmento-girar', startFrame: Phaser.Math.Between(0, 5) });
    // Flotación: el desfase hace que no todos suban y bajen a la vez
    scene.tweens.add({ targets: this, y: y - 4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: (x % 7) * 90 });
  }

  recoger() {
    this.body.enable = false;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this, y: this.y - 26, alpha: 0, scale: 1.5, duration: 260,
      onComplete: () => this.destroy()
    });
  }
}
