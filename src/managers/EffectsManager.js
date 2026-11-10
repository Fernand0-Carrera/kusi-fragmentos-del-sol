import { CAPAS, FUENTE } from '../config/constants.js';

const MAX_SILUETAS = 10;

/**
 * Efectos visuales reutilizables de una escena: partículas, polvo, estelas,
 * textos flotantes y la pausa breve al golpear ("hit stop").
 * Se crea un solo emisor por tipo de partícula y se reutiliza (explode), y las
 * siluetas de la estela salen de un pool: no se crean objetos nuevos en cada evento.
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

    // Polvo: sale hacia los lados y hacia arriba, sube un poco y se desvanece
    this.emisorPolvo = scene.add.particles(0, 0, 'particula', {
      speed: { min: 20, max: 80 },
      angle: { min: 200, max: 340 },
      lifespan: 380,
      scale: { start: 0.9, end: 0.2 },
      alpha: { start: 0.75, end: 0 },
      gravityY: -40,
      emitting: false
    }).setDepth(CAPAS.jugador - 1);

    this.siluetas = [];
    this.finPausa = null;
    scene.events.once('shutdown', () => this.terminarPausa());
  }

  chispas(x, y, color = 0xffffff, cantidad = 10) {
    this.emisor.setParticleTint(color);
    this.emisor.explode(cantidad, x, y);
  }

  /** Nubecitas de polvo en (x, y), normalmente los pies de un personaje. */
  polvo(x, y, cantidad = 6, color = 0xe8d9bd) {
    this.emisorPolvo.setParticleTint(color);
    this.emisorPolvo.explode(cantidad, x, y - 2);
  }

  /** Deja una silueta del sprite que se desvanece: varias seguidas forman la estela. */
  estela(sprite, color = 0xffffff) {
    let silueta = this.siluetas.find((s) => !s.visible);
    if (!silueta) {
      if (this.siluetas.length >= MAX_SILUETAS) return;
      silueta = this.scene.add.image(0, 0, sprite.texture.key).setVisible(false);
      this.siluetas.push(silueta);
    }
    silueta
      .setTexture(sprite.texture.key, sprite.frame.name)
      .setPosition(sprite.x, sprite.y)
      .setOrigin(sprite.originX, sprite.originY)
      .setScale(sprite.scaleX, sprite.scaleY)
      .setFlipX(sprite.flipX)
      .setDepth(CAPAS.jugador - 1)
      .setTint(color)
      .setAlpha(0.55)
      .setVisible(true);
    this.scene.tweens.add({
      targets: silueta, alpha: 0, duration: 220, ease: 'Quad.out',
      onComplete: () => silueta.setVisible(false)
    });
  }

  /**
   * Congela la física unos milisegundos para que el golpe "pese".
   * Si llega otro golpe durante la pausa, la pausa se alarga en vez de acumularse.
   */
  pausaBreve(milisegundos) {
    const mundo = this.scene.physics.world;
    if (this.finPausa) this.finPausa.remove(false);
    else mundo.pause();
    this.finPausa = this.scene.time.delayedCall(milisegundos, () => this.terminarPausa());
  }

  terminarPausa() {
    if (!this.finPausa) return;
    this.finPausa.remove(false);
    this.finPausa = null;
    this.scene.physics.world?.resume();
  }

  textoFlotante(x, y, texto) {
    const t = this.scene.add.bitmapText(x, y, FUENTE, texto, 24).setOrigin(0.5).setDepth(CAPAS.frente).setTint(0xffe27a);
    this.scene.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 800, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }
}
