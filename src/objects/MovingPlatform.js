import Phaser from 'phaser';
import { CAPAS } from '../config/constants.js';

/**
 * Losa móvil: plataforma inmóvil ante choques (immovable) que se desplaza
 * de ida y vuelta con velocidad constante. Al moverse con velocidad (y no
 * cambiando su posición a mano), Arcade Physics arrastra a quien está encima
 * gracias a la fricción del cuerpo.
 */
export default class MovingPlatform extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, recorridoPx, velocidad = 70) {
    super(scene, x, y, 'losa');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.allowGravity = false;
    this.body.setImmovable(true);
    this.body.friction.x = 1;
    // Solo choca por arriba: se puede saltar a través desde abajo
    this.body.checkCollision.down = false;
    this.body.checkCollision.left = false;
    this.body.checkCollision.right = false;
    this.inicioX = x;
    this.finX = x + recorridoPx;
    this.velocidad = velocidad;
    this.setVelocityX(velocidad);
    this.setDepth(CAPAS.objetos);
  }

  update() {
    if (this.x >= this.finX && this.body.velocity.x > 0) this.setVelocityX(-this.velocidad);
    else if (this.x <= this.inicioX && this.body.velocity.x < 0) this.setVelocityX(this.velocidad);
  }
}
