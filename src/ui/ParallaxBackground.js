import { ANCHO, ALTO, CAPAS } from '../config/constants.js';

/**
 * Fondo con paralaje de tres capas (cielo, montañas lejanas, colinas cercanas)
 * y una capa de niebla. Las capas son TileSprite fijos a la cámara: en vez de
 * mover imágenes enormes, solo se desplaza la textura, lo que es muy barato.
 */
export default class ParallaxBackground {
  constructor(scene, tema, { niebla = true } = {}) {
    // fondos.json indica dónde va cada capa recortada (ver tools/generar_imagenes.py)
    const posiciones = scene.cache.json.get('fondos') ?? {};
    this.capas = [0, 1, 2].map((i) => {
      const clave = `fondo_${tema}_${i}`;
      const { y = 0, alto = ALTO } = posiciones[clave] ?? {};
      return scene.add.tileSprite(0, y, ANCHO, alto, clave).setOrigin(0).setScrollFactor(0).setDepth(CAPAS.fondo + i);
    });
    this.velocidades = [0.05, 0.2, 0.45];
    this.niebla = niebla
      ? scene.add.tileSprite(0, ALTO - 220, ANCHO, 200, 'niebla').setOrigin(0).setScrollFactor(0).setDepth(CAPAS.niebla).setAlpha(0.9)
      : null;
    this.deriva = 0;
  }

  /** Calidad reducida: se quita la niebla (capa semitransparente que se pinta encima). */
  setLigero() {
    this.niebla?.setVisible(false);
  }

  /** desplazamiento: posición horizontal de la cámara; dt en segundos */
  actualizar(desplazamiento, dt = 0) {
    this.deriva += dt * 12;
    this.capas.forEach((capa, i) => { capa.tilePositionX = desplazamiento * this.velocidades[i]; });
    if (this.niebla) this.niebla.tilePositionX = desplazamiento * 0.6 + this.deriva;
  }
}
