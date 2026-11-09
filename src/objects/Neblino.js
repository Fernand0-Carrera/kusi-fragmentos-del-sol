import Enemy from './Enemy.js';

/**
 * Neblino: criatura de niebla que patrulla el suelo. Da la vuelta al chocar
 * con una pared (u otro obstáculo) o al llegar al borde de una plataforma,
 * consultando la baldosa que tiene delante de sus pies (IA de patrulla).
 */
export default class Neblino extends Enemy {
  constructor(scene, x, y, capa, factorVelocidad = 1) {
    super(scene, x, y, 'neblino', 2);
    this.capa = capa;
    this.velocidad = 60 * factorVelocidad;
    this.direccion = -1;
    this.body.setSize(26, 24).setOffset(5, 8);
    this.play('neblino-andar');
  }

  update() {
    if (!this.vivo) return;
    const cuerpo = this.body;
    if (cuerpo.blocked.left || cuerpo.touching.left) this.direccion = 1;
    else if (cuerpo.blocked.right || cuerpo.touching.right) this.direccion = -1;
    else if (cuerpo.blocked.down) {
      // ¿Hay suelo delante? Si no, da la vuelta para no caer
      const xDelante = this.direccion > 0 ? cuerpo.right + 2 : cuerpo.left - 2;
      const baldosa = this.capa.getTileAtWorldXY(xDelante, cuerpo.bottom + 4);
      if (!baldosa || !baldosa.collides) this.direccion *= -1;
    }
    this.setVelocityX(this.velocidad * this.direccion);
    this.setFlipX(this.direccion > 0);
  }
}
