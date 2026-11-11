import { TILE, CAPAS } from '../config/constants.js';
import Collectible from '../objects/Collectible.js';
import Neblino from '../objects/Neblino.js';
import Murcielago from '../objects/Murcielago.js';
import Llama from '../objects/Llama.js';
import Atoq from '../objects/Atoq.js';
import Escupitajo from '../objects/Escupitajo.js';
import Checkpoint from '../objects/Checkpoint.js';
import Spring from '../objects/Spring.js';
import Spikes from '../objects/Spikes.js';
import MovingPlatform from '../objects/MovingPlatform.js';
import Goal from '../objects/Goal.js';

// Posición de cada tipo de baldosa dentro de un tema del tileset
const BALDOSA = { SUPERFICIE: 0, RELLENO: 1, PLATAFORMA: 2, BLOQUE: 3 };
const SOLIDOS = '#X';

/**
 * Lee las filas ASCII de un nivel y construye:
 *  - un Tilemap de Phaser con colisiones (sólidas y de un solo sentido)
 *  - todos los objetos del nivel, organizados en grupos
 * Devuelve un objeto con todo lo necesario para GameScene.
 */
export default class LevelBuilder {
  constructor(scene, datosNivel) {
    this.scene = scene;
    this.datos = datosNivel;
    this.filas = datosNivel.filas;
    this.alto = this.filas.length;
    this.ancho = this.filas[0].length;
  }

  caracter(x, y) {
    if (y < 0 || y >= this.alto || x < 0 || x >= this.ancho) return ' ';
    return this.filas[y][x];
  }

  construir() {
    const scene = this.scene;
    const resultado = {
      anchoPx: this.ancho * TILE,
      altoPx: this.alto * TILE,
      fragmentos: scene.add.group(),
      corazones: scene.add.group(),
      enemigos: scene.add.group({ runChildUpdate: true }),
      // Pool de escupitajos: se crea antes de leer el mapa porque las llamas lo necesitan
      escupitajos: scene.physics.add.group({ classType: Escupitajo, maxSize: 12, runChildUpdate: true }),
      puas: scene.add.group(),
      puyas: scene.add.group(),
      apachetas: scene.add.group(),
      losas: scene.add.group({ runChildUpdate: true }),
      inicio: { x: 64, y: 64 },
      puerta: null,
      posicionJefe: null,
      activadorArenaX: null,
      totalFragmentos: 0
    };

    // --- Mapa de baldosas
    const mapa = scene.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: this.ancho, height: this.alto });
    const tileset = mapa.addTilesetImage('tileset', 'tileset', TILE, TILE, 0, 0);
    const capa = mapa.createBlankLayer('suelo', tileset).setDepth(CAPAS.mapa);
    const base = this.datos.temaIndice * 4;
    const unSentido = [];

    for (let y = 0; y < this.alto; y++) {
      for (let x = 0; x < this.ancho; x++) {
        const c = this.caracter(x, y);
        if (c === '#') {
          // Si encima hay aire, se dibuja la baldosa con superficie (pasto, nieve o lava)
          const tipo = SOLIDOS.includes(this.caracter(x, y - 1)) ? BALDOSA.RELLENO : BALDOSA.SUPERFICIE;
          capa.putTileAt(base + tipo, x, y);
        } else if (c === 'X') {
          capa.putTileAt(base + BALDOSA.BLOQUE, x, y);
        } else if (c === '=') {
          unSentido.push(capa.putTileAt(base + BALDOSA.PLATAFORMA, x, y));
        } else {
          this.crearObjeto(c, x, y, capa, resultado);
        }
      }
    }

    capa.setCollisionBetween(base, base + 3);
    // Plataformas de un solo sentido: solo la cara superior colisiona
    unSentido.forEach((baldosa) => baldosa.setCollision(false, false, true, false));

    resultado.mapa = mapa;
    resultado.capa = capa;
    resultado.totalFragmentos = resultado.fragmentos.getLength();
    return resultado;
  }

  crearObjeto(c, x, y, capa, r) {
    const scene = this.scene;
    const centroX = x * TILE + TILE / 2;
    const centroY = y * TILE + TILE / 2;
    const piso = (y + 1) * TILE; // borde inferior de la celda
    const factor = this.datos.velocidadEnemigos ?? 1;

    switch (c) {
      case 'P': r.inicio = { x: centroX, y: piso - 24 }; break;
      case 'o': r.fragmentos.add(new Collectible(scene, centroX, centroY, 'fragmento')); break;
      case 'h': r.corazones.add(new Collectible(scene, centroX, centroY, 'corazon')); break;
      case 'e': r.enemigos.add(new Neblino(scene, centroX, piso - 16, capa, factor)); break;
      case 'b': r.enemigos.add(new Murcielago(scene, centroX, centroY, factor)); break;
      // Los cuadros miden 64x64 y 64x48 con origen al centro: se suben la mitad de su alto
      case 'l': r.enemigos.add(new Llama(scene, centroX, piso - 32, r.escupitajos, factor)); break;
      case 'z': r.enemigos.add(new Atoq(scene, centroX, piso - 24, capa, factor)); break;
      case '^': r.puas.add(new Spikes(scene, centroX, centroY)); break;
      case 's': r.puyas.add(new Spring(scene, centroX, piso - 16)); break;
      case 'c': r.apachetas.add(new Checkpoint(scene, centroX, piso - 26)); break;
      case 'm':
      case 'M': {
        const recorrido = (c === 'm' ? 4 : 6) * TILE;
        r.losas.add(new MovingPlatform(scene, x * TILE + 48, y * TILE + 12, recorrido));
        break;
      }
      case 'G': {
        const enArenaJefe = Boolean(this.datos.arena);
        r.puerta = new Goal(scene, x * TILE + TILE, piso - 48, !enArenaJefe);
        if (enArenaJefe) r.puerta.setVisible(false);
        break;
      }
      case 'U': r.posicionJefe = { x: centroX, y: centroY }; break;
      case 'A': r.activadorArenaX = x * TILE; break;
      default: break;
    }
  }

  /** Dibuja columnas de bloques sólidos (se usa para cerrar la arena del jefe). */
  static cerrarColumna(capa, columna, desdeFila, hastaFila, indiceBaldosa) {
    for (let y = desdeFila; y <= hastaFila; y++) {
      capa.putTileAt(indiceBaldosa, columna, y).setCollision(true);
    }
  }
}

export { BALDOSA };
export const esSolido = (c) => SOLIDOS.includes(c);
