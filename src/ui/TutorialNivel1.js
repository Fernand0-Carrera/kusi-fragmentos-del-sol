import { CAPAS, COLOR, FUENTE, TILE } from '../config/constants.js';
import { SFX } from '../audio/audioKeys.js';
import { audio } from '../managers/AudioManager.js';
import { almacen } from '../managers/StorageManager.js';
import { sesion } from '../managers/GameSession.js';
import { crearTextoConTeclas } from './TextoConTeclas.js';

const SUELO = 14 * TILE;          // fila del suelo del Nivel 1 (en píxeles)
const ALTO_CARTEL = SUELO - 190;  // altura del centro de los carteles: encima de Kusi y de los fragmentos bajos

/**
 * Carteles del tutorial. Las posiciones están en columnas de baldosas del
 * Nivel 1 (ver data/levels.js) y se colocan desde aquí, sin tocar el mapa.
 *   columna:     dónde se clava el poste del cartel
 *   desde/hasta: tramo en el que se muestra (si Kusi pasa de "hasta", se da por visto)
 *   teclado / tactil: líneas de texto; {Tecla} se dibuja como una tecla
 *   hecho:       condición que completa el cartel (lo que el jugador debe hacer)
 */
const CARTELES = [
  {
    columna: 5, desde: 0, hasta: 6,
    teclado: ['Muévete con {izq} {der} o {A} {D}'],
    tactil: ['Muévete con los botones', 'de abajo a la izquierda'],
    hecho: (t) => Math.abs(t.jugador.x - t.inicioX) > 3 * TILE
  },
  {
    columna: 9, desde: 7, hasta: 12,
    teclado: ['Salta con {Espacio} {W} o {arriba}', 'Mantén pulsado para saltar más alto'],
    tactil: ['Salta con el botón de la derecha', 'Mantén pulsado para saltar más alto'],
    hecho: (t) => t.jugador.fsm.es('saltando')
  },
  {
    columna: 13, desde: 13, hasta: 16,
    teclado: ['Salta para recoger los fragmentos', 'del sol: cada uno vale 10 puntos'],
    hecho: () => sesion.fragmentos > 0
  },
  {
    columna: 18, desde: 17, hasta: 23,
    teclado: ['Cae encima del Neblino para vencerlo', 'Si te toca de lado, pierdes una vida'],
    hecho: (t) => !t.primerEnemigo || !t.primerEnemigo.vivo
  },
  {
    columna: 24, desde: 24, hasta: 29,
    teclado: ['Pulsa {Shift} o {X} para hacer un dash', 'En el suelo o en el aire (uno por salto)'],
    tactil: ['Toca el botón de dash para impulsarte', 'En el suelo o en el aire (uno por salto)'],
    hecho: (t) => t.jugador.fsm.es('dash')
  },
  {
    columna: 31, desde: 30, hasta: 38,
    teclado: ['Las plataformas se atraviesan', 'desde abajo: salta y sube'],
    hecho: (t) => t.jugador.body.blocked.down && t.jugador.body.bottom <= 11 * TILE + 2
  },
  {
    columna: 48, desde: 46, hasta: 52,
    teclado: ['Pisa la flor de puya', 'para saltar muy alto'],
    hecho: (t) => t.jugador.body.velocity.y < -800
  },
  {
    columna: 55, desde: 54, hasta: 60,
    teclado: ['Toca la apacheta para guardar tu avance:', 'si caes, volverás aquí'],
    hecho: () => sesion.puntoControl !== null
  }
];

/**
 * Tutorial interactivo del Nivel 1. Cada cartel aparece cuando Kusi se acerca
 * y se completa cuando el jugador hace lo que pide (moverse, saltar, dash...).
 * No pausa el juego. Al terminar se guarda en StorageManager y no vuelve a salir.
 */
export default class TutorialNivel1 {
  constructor(scene, jugador, enemigos, { tactil = false } = {}) {
    this.scene = scene;
    this.jugador = jugador;
    this.inicioX = jugador.x;
    this.terminado = false;
    this.actual = null;
    this.panelesEnPantalla = 0; // los carteles salen de uno en uno: el siguiente espera a que se vaya el anterior
    // El Neblino del primer cartel de pisotón es el enemigo más cercano a la columna 21
    this.primerEnemigo = enemigos.getChildren()
      .filter((e) => e.vivo !== undefined)
      .sort((a, b) => Math.abs(a.x - 21 * TILE) - Math.abs(b.x - 21 * TILE))[0];

    this.carteles = CARTELES.map((def) => ({
      ...def,
      lineas: (tactil && def.tactil) ? def.tactil : def.teclado,
      x: def.columna * TILE + TILE / 2,
      visto: false
    }));
  }

  /** Poste de madera clavado en el suelo con un signo "?". */
  crearPoste(x) {
    const poste = this.scene.add.container(x, SUELO).setDepth(CAPAS.objetos - 1);
    const g = this.scene.add.graphics();
    g.fillStyle(0x6b4423, 1);
    g.fillRect(-3, -34, 6, 34);
    g.fillRoundedRect(-17, -54, 34, 26, 4);
    g.fillStyle(0xc28b52, 1);
    g.fillRoundedRect(-15, -52, 30, 22, 3);
    const signo = this.scene.add.bitmapText(0, -41, FUENTE, '?', 24).setOrigin(0.5).setTint(0x3b2412);
    poste.add([g, signo]);
    poste.setAlpha(0);
    this.scene.tweens.add({ targets: poste, alpha: 1, duration: 250 });
    this.scene.tweens.add({ targets: signo, scale: 1.2, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return poste;
  }

  /** Panel con el texto del cartel, con una punta que señala al poste. */
  crearPanel(cartel) {
    const lineas = cartel.lineas.map((l) => crearTextoConTeclas(this.scene, l, { tamano: 22 }));
    const ancho = Math.max(...lineas.map((l) => l.ancho)) + 36;
    // El panel no se sale por el borde izquierdo del mundo; la punta sigue señalando al poste
    const x = Math.max(cartel.x, ancho / 2 + 10);
    const punta = cartel.x - x;
    const panel = this.scene.add.container(x, ALTO_CARTEL).setDepth(CAPAS.frente);
    const alto = lineas.length * 32 + 22;
    const fondo = this.scene.add.graphics();
    panel.add(fondo);
    lineas.forEach((l, i) => {
      l.x = -l.ancho / 2;
      l.y = -alto / 2 + 27 + i * 32;
      panel.add(l);
    });
    panel.dibujarFondo = (borde) => {
      fondo.clear();
      fondo.fillStyle(COLOR.panel, 0.92);
      fondo.fillRoundedRect(-ancho / 2, -alto / 2, ancho, alto, 8);
      fondo.fillTriangle(punta - 10, alto / 2, punta + 10, alto / 2, punta, alto / 2 + 12);
      fondo.lineStyle(3, borde, 1);
      fondo.strokeRoundedRect(-ancho / 2, -alto / 2, ancho, alto, 8);
    };
    panel.dibujarFondo(COLOR.oro);
    panel.alto = alto;
    this.panelesEnPantalla += 1;
    panel.setScale(0);
    this.scene.tweens.add({ targets: panel, scale: 1, duration: 260, ease: 'Back.out' });
    panel.flotar = this.scene.tweens.add({ targets: panel, y: ALTO_CARTEL - 5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return panel;
  }

  /** Llamar cada fotograma desde GameScene.update. */
  actualizar() {
    if (this.terminado) return;
    const columna = Math.floor(this.jugador.x / TILE);

    // Si Kusi ya pasó de largo un cartel, se da por visto
    this.carteles.forEach((c) => { if (!c.visto && columna > c.hasta) this.cerrar(c, false); });

    // El cartel que se muestra se completa cuando el jugador hace lo que pide
    if (this.actual && this.actual.hecho(this)) this.cerrar(this.actual, true);

    const siguiente = this.carteles.find((c) => !c.visto && columna >= c.desde && columna <= c.hasta) ?? null;
    if (siguiente !== this.actual) {
      // Kusi salió del tramo del cartel actual sin completarlo (por ejemplo, retrocedió): se guarda
      if (this.actual) this.ocultarPanel(this.actual);
      this.actual = null;
      if (siguiente && siguiente.hecho(this)) {
        // Lo que pide este cartel ya lo hizo antes: no hace falta mostrarlo
        siguiente.visto = true;
      } else if (siguiente && this.panelesEnPantalla === 0) {
        // Solo aparece cuando el cartel anterior terminó de irse, para que nunca se encimen
        this.actual = siguiente;
        siguiente.poste = this.crearPoste(siguiente.x);
        siguiente.panel = this.crearPanel(siguiente);
      }
    }

    if (this.panelesEnPantalla === 0 && this.carteles.every((c) => c.visto)) this.terminar();
  }

  /** Completa un cartel: si el jugador lo hizo bien, se celebra con un "¡Bien!". */
  cerrar(cartel, logrado) {
    cartel.visto = true;
    if (this.actual === cartel) this.actual = null;
    const { panel } = cartel;
    if (logrado && panel) {
      audio.efecto(SFX.CLIC, { detune: 500 });
      panel.dibujarFondo(COLOR.turquesa);
      const bien = this.scene.add.bitmapText(0, -panel.alto / 2 - 16, FUENTE, '¡Bien!', 24).setOrigin(0.5).setTint(COLOR.oroClaro);
      panel.add(bien);
      this.scene.time.delayedCall(550, () => this.ocultarPanel(cartel));
    } else {
      this.ocultarPanel(cartel);
    }
  }

  /** Quita el panel y su poste con una animación corta. */
  ocultarPanel(cartel) {
    const { panel, poste } = cartel;
    if (poste) {
      this.scene.tweens.add({ targets: poste, alpha: 0, y: poste.y + 8, duration: 300, onComplete: () => poste.destroy() });
      cartel.poste = null;
    }
    if (!panel || panel.cerrando) return;
    panel.cerrando = true;
    panel.flotar?.stop();
    this.scene.tweens.add({
      targets: panel, scale: 0, alpha: 0, duration: 200, ease: 'Back.in',
      onComplete: () => {
        panel.destroy();
        this.panelesEnPantalla -= 1;
      }
    });
    cartel.panel = null;
  }

  terminar() {
    this.terminado = true;
    almacen.marcarTutorialVisto();
    this.scene.mostrarMensaje('¡Tutorial completado! Busca la Puerta del Sol', 2800);
  }
}
