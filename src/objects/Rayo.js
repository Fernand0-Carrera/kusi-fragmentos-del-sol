import Phaser from 'phaser';
import { CAPAS } from '../config/constants.js';

const obtenerTextura = (scene) => {
  if (!scene.textures.exists('rayo')) {
        scene.textures.generate('rayo', {
          data: [
            '......111..',
            '.....111....',
            '....111.....',
            '...111......',
            '..111.......',
            '111111111..',
            '....111.....',
            '...111......',
            '..111.......',
            '.111........',
            '111111111..',
            '......111...',
            '.....111....',
            '....111.....',
            '...111......'
      ],
      pixelWidth: 4,
          palette: { '1': '#ffe34d' }
    });
  }
  return 'rayo';
};

/** Proyectil de rayo reutilizable mediante un pool de física. */
export default class Rayo extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, obtenerTextura(scene));
    this.setDepth(CAPAS.enemigos);
    this.setOrigin(0.5, 0);
    this.setVisible(false);
  }

  avisar(x, suelo) {
    this.x = x;
    this.y = suelo - 300;
    this.suelo = suelo;
    this.setVisible(false);
    this.body.enable = false;
      this.sombra = this.scene.add.ellipse(x, suelo - 5, 46, 10, 0xffc928, 0.75)
        .setDepth(CAPAS.enemigos - 1).setStrokeStyle(2, 0xfff36b, 0.9);
    this.pulsoSombra = this.scene.tweens.add({
      targets: this.sombra, alpha: 0.2, scaleX: 0.7, duration: 180, yoyo: true, repeat: -1
    });
  }

  lanzar(velocidadY = 730) {
    this.enableBody(true, this.x, this.suelo - 300, true, true);
      this.body.setSize(20, 56).setOffset(2, 0);
    this.body.setAllowGravity(false);
    this.setVelocity(0, velocidadY);
    this.quitarAviso();
  }

  terminar() {
    if (!this.active) return;
    this.quitarAviso();
    this.disableBody(true, true);
  }

  quitarAviso() {
    this.pulsoSombra?.stop();
    this.sombra?.destroy();
    this.pulsoSombra = null;
    this.sombra = null;
  }
}