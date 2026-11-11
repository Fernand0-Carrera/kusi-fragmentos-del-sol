import Phaser from 'phaser';
import { CAPAS } from '../config/constants.js';

const DURACION_MAXIMA = 3;   // segundos: si no choca con nada, vuelve al pool

/**
 * Escupitajo de escarcha lanzado por la Llama hechizada.
 * Igual que IceShard, se usa con un "pool": se reactivan los que ya existen
 * en vez de crear y destruir objetos en cada disparo.
 *
 * El grupo debe crearse con runChildUpdate: true para que corra update().
 */
export default class Escupitajo extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'escupitajo');
    this.setDepth(CAPAS.enemigos);
    this.vida = 0;
  }

  lanzar(x, y, direccion, velocidad) {
    this.enableBody(true, x, y, true, true);
    this.body.setSize(14, 10).setOffset(1, 3);
    // La gravedad del mundo es 1300: con -1050 cae suave, en una curva fácil de leer
    this.body.setGravityY(-1050);
    this.setVelocity(direccion * velocidad, -70);
    this.setFlipX(direccion > 0);           // la estela queda siempre detrás
    this.vida = 0;
  }

  update(time, delta) {
    if (!this.active) return;
    this.vida += delta / 1000;
    if (this.vida >= DURACION_MAXIMA) this.romper();
  }

  romper() {
    if (!this.active) return;
    this.scene.events.emit('escupitajo:roto', this.x, this.y);
    this.disableBody(true, true);
  }
}
