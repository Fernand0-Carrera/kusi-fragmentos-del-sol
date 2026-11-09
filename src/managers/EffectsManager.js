import { CAPAS, FUENTE } from '../config/constants.js';

/**
 * Efectos visuales reutilizables de una escena: partículas y textos flotantes.
 * Se crea un solo emisor de partículas por escena y se reutiliza (explode),
 * en lugar de crear uno nuevo en cada evento.
 */
export default class EffectsManager {
  constructor(scene) {
    this.scene = scene;
    this.emisor = scene.add.particles(0, 0, 'particula', {
      speed: { min: 60, max: 200 },
      angle: { min: 0, max: 360 },
      lifespan: 420,
      scale: { start: 1, end: 0 },
      gravityY: 300,
      emitting: false
    }).setDepth(CAPAS.particulas);
  }

  chispas(x, y, color = 0xffffff, cantidad = 10) {
    this.emisor.setParticleTint(color);
    this.emisor.explode(cantidad, x, y);
  }

  textoFlotante(x, y, texto) {
    const t = this.scene.add.bitmapText(x, y, FUENTE, texto, 24).setOrigin(0.5).setDepth(CAPAS.frente).setTint(0xffe27a);
    this.scene.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 800, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }
}
