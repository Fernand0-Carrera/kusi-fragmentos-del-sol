import Phaser from 'phaser';
import { CAPAS } from '../config/constants.js';

/**
 * Esquirla de hielo lanzada por Uku. Se usa con un "pool" de objetos:
 * en vez de crear y destruir esquirlas, se reactivan las que ya existen,
 * lo que evita tirones del recolector de basura (optimización).
 */
export default class IceShard extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'esquirla');
    this.setDepth(CAPAS.enemigos);
  }

  lanzar(x, y, velocidadX = 0) {
    this.enableBody(true, x, y, true, true);
    this.body.setSize(10, 24).setOffset(5, 4);
    this.body.setGravityY(-650); // cae más lento que Kusi para poder esquivarla
    this.setVelocity(velocidadX, 40);
  }

  romper() {
    if (!this.active) return;
    this.scene.events.emit('esquirla:rota', this.x, this.y);
    this.disableBody(true, true);
  }
}
