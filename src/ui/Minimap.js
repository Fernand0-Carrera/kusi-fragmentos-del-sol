import { COLOR } from '../config/constants.js';

/**
 * Minimapa del nivel. El trazado se dibuja una sola vez en una textura
 * (generateTexture) y luego solo se mueven los puntos del jugador y del jefe,
 * lo que lo hace prácticamente gratis en cada fotograma.
 */
export default class Minimap {
  constructor(scene, x, y, filas, escala = 1.6) {
    this.scene = scene;
    this.escala = escala;
    this.anchoMapa = filas[0].length;
    const ancho = Math.ceil(this.anchoMapa * escala);
    const alto = Math.ceil(filas.length * escala);
    const clave = 'minimapa';

    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(COLOR.panel, 0.75).fillRect(0, 0, ancho + 4, alto + 4);
    filas.forEach((fila, fy) => {
      // Se agrupan baldosas sólidas contiguas en un solo rectángulo
      let inicio = -1;
      for (let fx = 0; fx <= fila.length; fx++) {
        const solido = fx < fila.length && (fila[fx] === '#' || fila[fx] === 'X');
        if (solido && inicio < 0) inicio = fx;
        if (!solido && inicio >= 0) {
          g.fillStyle(COLOR.niebla, 0.8).fillRect(2 + inicio * escala, 2 + fy * escala, (fx - inicio) * escala, escala);
          inicio = -1;
        }
        if (fila[fx] === '=') g.fillStyle(COLOR.oro, 0.7).fillRect(2 + fx * escala, 2 + fy * escala, escala, escala * 0.6);
        if (fila[fx] === 'G') g.fillStyle(COLOR.oroClaro, 1).fillRect(2 + fx * escala, 2 + (fy - 2) * escala, escala * 2, escala * 3);
        if (fila[fx] === 'c') g.fillStyle(COLOR.turquesa, 1).fillRect(2 + fx * escala, 2 + (fy - 1) * escala, escala, escala * 2);
      }
    });
    g.lineStyle(1, COLOR.oro, 0.8).strokeRect(0.5, 0.5, ancho + 3, alto + 3);
    if (scene.textures.exists(clave)) scene.textures.remove(clave);
    g.generateTexture(clave, ancho + 4, alto + 4);
    g.destroy();

    this.imagen = scene.add.image(x, y, clave).setOrigin(0.5, 0);
    this.origenX = x - (ancho + 4) / 2 + 2;
    this.origenY = y + 2;
    this.puntoJugador = scene.add.rectangle(0, 0, 4, 5, COLOR.grana).setOrigin(0.5, 1);
    this.puntoJefe = scene.add.rectangle(0, 0, 6, 6, 0x9fe3ff).setVisible(false);
  }

  /** Convierte coordenadas del mundo (px) a coordenadas del minimapa. */
  actualizar(jugador, jefe, tile) {
    if (jugador) this.puntoJugador.setPosition(this.origenX + (jugador.x / tile) * this.escala, this.origenY + (jugador.y / tile + 0.75) * this.escala);
    const jefeVisible = Boolean(jefe && jefe.active && jefe.visible);
    this.puntoJefe.setVisible(jefeVisible);
    if (jefeVisible) this.puntoJefe.setPosition(this.origenX + (jefe.x / tile) * this.escala, this.origenY + (jefe.y / tile) * this.escala);
  }
}
