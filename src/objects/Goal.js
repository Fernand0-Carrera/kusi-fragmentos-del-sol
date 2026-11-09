import Phaser from 'phaser';
import { CAPAS } from '../config/constants.js';

/**
 * Puerta del Sol: meta de cada nivel. En el nivel del jefe empieza apagada
 * y se enciende cuando Uku es derrotado.
 */
export default class Goal extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, activa = true) {
    super(scene, x, y, 'puerta', activa ? 1 : 0);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.body.setSize(28, 80).setOffset(20, 16);
    this.activa = activa;
    this.setDepth(CAPAS.objetos - 1);
    if (activa) this.agregarBrillo();
  }

  activar() {
    this.activa = true;
    this.setFrame(1);
    this.agregarBrillo();
    this.scene.tweens.add({ targets: this, scale: { from: 0.6, to: 1 }, duration: 500, ease: 'Back.out' });
  }

  /** Efecto de shader (glow) disponible solo con el renderizador WebGL. */
  agregarBrillo() {
    if (this.sinEfectos) return;
    if (this.scene.game.renderer.type === Phaser.WEBGL && this.preFX) {
      this.brillo = this.brillo || this.preFX.addGlow(0xffe27a, 2, 0, false, 0.1, 12);
      this.scene.tweens.add({ targets: this.brillo, outerStrength: 6, duration: 900, yoyo: true, repeat: -1 });
    }
  }

  quitarBrillo() {
    this.sinEfectos = true;
    this.preFX?.clear();
    this.brillo = null;
  }
}
