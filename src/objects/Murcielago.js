import Enemy from './Enemy.js';

/**
 * Murciélago de escarcha: vuela sin gravedad, patrulla en horizontal y
 * ondula en vertical siguiendo una función seno (la velocidad vertical es
 * la derivada de esa curva, así el movimiento es suave y físico).
 */
export default class Murcielago extends Enemy {
  constructor(scene, x, y, factorVelocidad = 1) {
    super(scene, x, y, 'murcielago', 2);
    this.body.allowGravity = false;
    this.body.setSize(26, 14).setOffset(7, 7);
    this.origenX = x;
    this.rango = 96;
    this.velocidad = 70 * factorVelocidad;
    this.direccion = 1;
    this.fase = Math.random() * Math.PI * 2;
    this.play('murcielago-volar');
  }

  update(time, delta) {
    if (!this.vivo) return;
    this.fase += delta / 1000;
    if (this.x > this.origenX + this.rango) this.direccion = -1;
    else if (this.x < this.origenX - this.rango) this.direccion = 1;
    const amplitud = 28;
    const frecuencia = 2.4;
    this.setVelocity(this.velocidad * this.direccion, Math.cos(this.fase * frecuencia) * amplitud * frecuencia);
    this.setFlipX(this.direccion < 0);
  }
}
