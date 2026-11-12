import Phaser from 'phaser';
import { ANCHO, ALTO, COLOR, ESCENAS, FUENTE } from '../config/constants.js';
import { ICONO } from '../assets/assetManifest.js';
import { almacen } from '../managers/StorageManager.js';
import ParallaxBackground from '../ui/ParallaxBackground.js';
import TextButton from '../ui/TextButton.js';
import MenuList from '../ui/MenuList.js';
import { crearTextoConTeclas } from '../ui/TextoConTeclas.js';
import Rayo from '../objects/Rayo.js';

const PAGINAS = ['Controles', 'Objetos', 'Enemigos', 'Jefe Uku'];
const COLORES_FASE = [0x9fe3ff, 0xffc857, 0xff6b62]; // mismos tintes que usa Uku en cada fase

/**
 * "Cómo jugar" en varias páginas: controles, objetos, enemigos y jefe.
 * Cada página muestra los sprites del juego con sus animaciones reales
 * (las mismas claves de objects/animations.js), en pequeñas escenas que se repiten.
 * Navegación: ← → o A / D cambian de página, 1-4 van directo, Esc vuelve.
 * Se abre desde el menú principal o desde la pausa ({ desdePausa: true }); en ese
 * caso "Volver" regresa a la pausa y la partida sigue donde estaba.
 */
export default class HelpScene extends Phaser.Scene {
  constructor() {
    super(ESCENAS.AYUDA);
  }

  init(datos) {
    // Phaser recuerda los datos del último arranque si no se pasan nuevos: por eso
    // además se comprueba que de verdad haya una pausa dormida esperando
    this.desdePausa = Boolean(datos?.desdePausa) && this.scene.isSleeping(ESCENAS.PAUSA);
  }

  create() {
    new ParallaxBackground(this, 'hielo', { niebla: false });
    this.add.rectangle(ANCHO / 2, 245, ANCHO - 40, 450, COLOR.panel, 0.9).setStrokeStyle(2, COLOR.oro);
    this.add.bitmapText(ANCHO / 2, 46, FUENTE, 'Cómo jugar', 24).setOrigin(0.5).setScale(1.4).setTint(COLOR.oro);

    this.paginas = [
      this.crearPaginaControles(),
      this.crearPaginaObjetos(),
      this.crearPaginaEnemigos(),
      this.crearPaginaJefe()
    ];
    this.crearPestanas();
    this.crearBotones();
    this.configurarTeclado();
    this.indice = -1;
    this.saliendo = false; // Phaser reutiliza la instancia de la escena
    this.irAPagina(0);
  }

  // ---------------------------------------------------------------- navegación

  crearPestanas() {
    const ancho = 190;
    const separacion = 12;
    const inicio = ANCHO / 2 - ((PAGINAS.length - 1) * (ancho + separacion)) / 2;
    this.pestanas = PAGINAS.map((titulo, i) => {
      const x = inicio + i * (ancho + separacion);
      const fondo = this.add.graphics({ x, y: 92 });
      const texto = this.add.bitmapText(x, 92, FUENTE, `${i + 1}. ${titulo}`, 22).setOrigin(0.5);
      const zona = this.add.zone(x, 92, ancho, 36).setInteractive({ useHandCursor: true });
      zona.on('pointerup', () => this.irAPagina(i));
      return { fondo, texto, ancho };
    });
  }

  dibujarPestanas() {
    this.pestanas.forEach(({ fondo, texto, ancho }, i) => {
      const activa = i === this.indice;
      fondo.clear();
      fondo.fillStyle(activa ? COLOR.oro : 0x2a2152, 1);
      fondo.fillRoundedRect(-ancho / 2, -18, ancho, 36, 6);
      if (!activa) {
        fondo.lineStyle(2, 0x4a4070, 1);
        fondo.strokeRoundedRect(-ancho / 2, -18, ancho, 36, 6);
      }
      texto.setTint(activa ? COLOR.panel : COLOR.lana);
    });
  }

  crearBotones() {
    const y = ALTO - 34;
    // Anchos medidos para que quepa el texto más largo de cada botón ("Volver a la pausa")
    const anterior = new TextButton(this, 127, y, '< Anterior', () => this.cambiarPagina(-1), { ancho: 166, alto: 46 });
    this.botonTutorial = new TextButton(this, 342, y, this.textoTutorial(), () => this.repetirTutorial(), { ancho: 240, alto: 46 });
    const volver = new TextButton(this, 607, y, this.desdePausa ? 'Volver a la pausa' : 'Volver al menú', () => this.volver(), { ancho: 266, alto: 46 });
    const siguiente = new TextButton(this, 834, y, 'Siguiente >', () => this.cambiarPagina(1), { ancho: 164, alto: 46 });
    this.menu = new MenuList(this, [anterior, this.botonTutorial, volver, siguiente]);
    this.menu.enfocar(3);
  }

  textoTutorial() {
    return almacen.tutorialVisto ? 'Repetir tutorial' : 'Tutorial activado';
  }

  /** Vuelve a activar los carteles del Nivel 1 (útil para mostrar el juego a alguien nuevo). */
  repetirTutorial() {
    almacen.marcarTutorialVisto(false);
    this.botonTutorial.setTexto(this.textoTutorial());
  }

  configurarTeclado() {
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.alPresionar = (evento) => {
      const c = evento.keyCode;
      if (c === K.LEFT || c === K.A) this.cambiarPagina(-1);
      else if (c === K.RIGHT || c === K.D) this.cambiarPagina(1);
      else if (c >= K.ONE && c <= K.FOUR) this.irAPagina(c - K.ONE);
      else if (c === K.ESC) this.volver();
    };
    this.input.keyboard.on('keydown', this.alPresionar);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this.alPresionar));
  }

  /** Vuelve a la pausa (si se abrió desde una partida) o al menú principal. */
  volver() {
    if (this.saliendo) return;
    this.saliendo = true;
    if (this.desdePausa) {
      this.scene.wake(ESCENAS.PAUSA);
      this.scene.stop();
    } else {
      this.scene.start(ESCENAS.MENU);
    }
  }

  cambiarPagina(paso) {
    this.irAPagina((this.indice + paso + PAGINAS.length) % PAGINAS.length);
  }

  irAPagina(indice) {
    if (indice === this.indice) return;
    this.indice = indice;
    this.paginas.forEach((p, i) => p.setVisible(i === indice));
    const pagina = this.paginas[indice];
    pagina.setAlpha(0).setX(12);
    this.tweens.add({ targets: pagina, alpha: 1, x: 0, duration: 180, ease: 'Sine.out' });
    this.dibujarPestanas();
  }

  // ---------------------------------------------------------------- utilidades de dibujo

  /** Texto con el estilo de la ayuda; devuelve el BitmapText. */
  texto(pagina, x, y, contenido, { tamano = 18, color = COLOR.lana, origenX = 0 } = {}) {
    const t = this.add.bitmapText(x, y, FUENTE, contenido, tamano).setOrigin(origenX, 0.5).setTint(color);
    pagina.add(t);
    return t;
  }

  /** Recuadro oscuro para enmarcar una demostración. */
  marco(pagina, x, y, ancho, alto) {
    const g = this.add.graphics();
    g.fillStyle(0x0b0818, 0.85);
    g.fillRoundedRect(x, y, ancho, alto, 8);
    g.lineStyle(2, 0x4a4070, 1);
    g.strokeRoundedRect(x, y, ancho, alto, 8);
    pagina.add(g);
    return g;
  }

  /** Repite una secuencia de pasos [duraciónMs, función] sin fin. */
  repetir(pasos) {
    let i = 0;
    const siguiente = () => {
      const [duracion, accion] = pasos[i];
      accion?.();
      i = (i + 1) % pasos.length;
      this.time.delayedCall(duracion, siguiente);
    };
    siguiente();
  }

  // ---------------------------------------------------------------- página 1: controles

  crearPaginaControles() {
    const p = this.add.container(0, 0);
    const filas = [
      ['{izq} {der} {A} {D}', 'Moverse'],
      ['{Espacio} {W} {Z} {arriba}', 'Saltar'],
      ['{Shift} {X}', 'Dash: impulso rápido'],
      ['{P} {Esc}', 'Pausa'],
      ['{M}', 'Silenciar']
    ];
    this.resaltado = this.add.rectangle(46, 0, 540, 38, COLOR.oro, 0.18).setOrigin(0, 0.5).setStrokeStyle(2, COLOR.oro, 0.8);
    p.add(this.resaltado);
    this.filasControles = filas.map(([teclas, accion], i) => {
      const y = 144 + i * 42;
      const linea = crearTextoConTeclas(this, teclas, { tamano: 20 });
      linea.setPosition(60, y);
      p.add(linea);
      this.texto(p, 320, y, accion, { tamano: 20 });
      return y;
    });
    this.texto(p, 60, 358, 'Mantén saltar: más alto · Dash: 1 por salto', { color: COLOR.niebla });

    // Pantalla táctil: los mismos iconos que usan los botones del HUD
    this.texto(p, 60, 394, 'Pantalla táctil:', { color: COLOR.turquesa, tamano: 20 });
    const iconos = [[[ICONO.IZQUIERDA, ICONO.DERECHA], 'Moverse'], [[ICONO.SALTAR], 'Saltar'], [[ICONO.DASH], 'Dash'], [[ICONO.PAUSA], 'Pausa']];
    let x = 82;
    iconos.forEach(([cuadros, nombre]) => {
      cuadros.forEach((cuadro) => {
        const fondo = this.add.circle(x, 432, 19, 0x2a2152).setStrokeStyle(2, 0x4a4070);
        p.add([fondo, this.add.image(x, 432, 'iconos', cuadro).setScale(0.62)]);
        x += 44;
      });
      const t = this.texto(p, x - 18, 432, nombre);
      x += t.width + 40;
    });

    // Demostración: Kusi repite moverse, saltar y dash, y se resalta la fila de cada acción
    const caja = { x: 620, y: 124, ancho: 290, alto: 250 };
    this.marco(p, caja.x, caja.y, caja.ancho, caja.alto);
    const suelo = caja.y + caja.alto - 34;
    const piso = this.add.graphics();
    piso.fillStyle(0x5a3b28, 1).fillRect(caja.x + 2, suelo, caja.ancho - 4, 32);
    piso.fillStyle(0x4caf50, 1).fillRect(caja.x + 2, suelo, caja.ancho - 4, 6);
    p.add(piso);
    const etiqueta = this.texto(p, caja.x + caja.ancho / 2, caja.y + 22, '', { color: COLOR.oroClaro, origenX: 0.5 });
    const kusi = this.add.sprite(caja.x + 50, suelo, 'kusi').setOrigin(0.5, 1).setScale(1.7);
    p.add(kusi);
    const izquierda = caja.x + 50;
    const derecha = caja.x + caja.ancho - 50;

    const resaltar = (fila, nombre) => {
      this.resaltado.y = this.filasControles[fila];
      etiqueta.setText(nombre);
    };
    const estela = () => {
      // Siluetas que se desvanecen detrás de Kusi, como en el juego
      for (let k = 1; k <= 3; k++) {
        this.time.delayedCall(k * 40, () => {
          const sombra = this.add.sprite(kusi.x, kusi.y, 'kusi', kusi.frame.name).setOrigin(0.5, 1)
            .setScale(1.7).setFlipX(kusi.flipX).setTintFill(COLOR.turquesa).setAlpha(0.55);
          p.addAt(sombra, p.getIndex(kusi));
          this.tweens.add({ targets: sombra, alpha: 0, duration: 260, onComplete: () => sombra.destroy() });
        });
      }
    };
    const saltar = (alto = 90) => {
      kusi.play('kusi-saltar');
      this.tweens.add({
        targets: kusi, y: suelo - alto, duration: 340, ease: 'Quad.out',
        onComplete: () => {
          kusi.play('kusi-caer');
          this.tweens.add({ targets: kusi, y: suelo, duration: 320, ease: 'Quad.in', onComplete: () => kusi.play('kusi-quieto') });
        }
      });
    };

    this.repetir([
      [1300, () => {
        resaltar(0, 'Moverse');
        kusi.setFlipX(false).play('kusi-correr');
        this.tweens.add({ targets: kusi, x: derecha, duration: 1200, onComplete: () => kusi.play('kusi-quieto') });
      }],
      [1300, () => {
        kusi.setFlipX(true).play('kusi-correr');
        this.tweens.add({ targets: kusi, x: izquierda, duration: 1200, onComplete: () => kusi.play('kusi-quieto') });
      }],
      [800, () => { resaltar(1, 'Saltar'); kusi.setFlipX(false); saltar(50); }],
      [900, () => saltar(95)],
      [700, () => {
        // Dash en el suelo: el mismo impulso, sin saltar
        resaltar(2, 'Dash en el suelo');
        kusi.play('kusi-correr');
        estela();
        this.tweens.add({ targets: kusi, x: izquierda + 110, duration: 160, onComplete: () => kusi.play('kusi-quieto') });
      }],
      [600, () => { kusi.setFlipX(true).play('kusi-correr'); this.tweens.add({ targets: kusi, x: izquierda, duration: 500, onComplete: () => kusi.setFlipX(false).play('kusi-quieto') }); }],
      [700, () => { etiqueta.setText('Dash en el aire'); saltar(60); }],
      [300, () => {
        this.tweens.killTweensOf(kusi);
        kusi.play('kusi-saltar');
        estela();
        this.tweens.add({
          targets: kusi, x: derecha, duration: 160,
          onComplete: () => {
            kusi.play('kusi-caer');
            this.tweens.add({ targets: kusi, y: suelo, duration: 300, ease: 'Quad.in', onComplete: () => kusi.play('kusi-quieto') });
          }
        });
      }],
      [900, null],
      [600, () => { kusi.setFlipX(true).play('kusi-correr'); this.tweens.add({ targets: kusi, x: izquierda, duration: 550 }); }]
    ]);
    return p;
  }

  // ---------------------------------------------------------------- página 2: objetos

  crearPaginaObjetos() {
    const p = this.add.container(0, 0);
    const objetos = [
      ['Fragmento del sol', '+10 puntos. ¡Recógelos!', (x, y) => this.add.sprite(x, y, 'fragmento').play('fragmento-girar').setScale(1.3)],
      ['Corazón', 'Una vida más (máximo 5)', (x, y) => {
        const s = this.add.image(x, y, 'corazon', 0).setScale(1.3);
        this.tweens.add({ targets: s, scale: 1.55, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        return s;
      }],
      ['Apacheta', 'Si caes, reapareces aquí', (x, y) => {
        const s = this.add.sprite(x, y - 4, 'apacheta', 0);
        this.repetir([[1400, () => s.setFrame(0)], [1400, () => s.setFrame(1)]]);
        return s;
      }],
      ['Flor de puya', 'Al pisarla saltas muy alto', (x, y) => {
        const s = this.add.sprite(x, y + 4, 'puya', 0).setScale(1.2);
        this.repetir([[1300, () => s.play('puya-rebote')]]);
        return s;
      }],
      ['Losa móvil', 'Te lleva de lado a lado', (x, y) => {
        const s = this.add.image(x - 8, y + 6, 'losa').setScale(0.5);
        this.tweens.add({ targets: s, x: x + 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        return s;
      }],
      ['Púas de hielo', 'Tocarlas quita una vida', (x, y) => this.add.image(x, y + 2, 'puas').setScale(1.2)],
      ['Pozo', 'Si caes, pierdes una vida', (x, y) => {
        const g = this.add.graphics({ x, y });
        g.fillStyle(0x5a3b28, 1).fillRect(-30, 4, 20, 22).fillRect(10, 4, 20, 22);
        g.fillStyle(0x4caf50, 1).fillRect(-30, 4, 20, 5).fillRect(10, 4, 20, 5);
        g.fillStyle(COLOR.grana, 1).fillTriangle(-6, 0, 6, 0, 0, 12);
        return g;
      }],
      ['Puerta del Sol', 'La meta de cada nivel', (x, y) => {
        const s = this.add.sprite(x, y - 2, 'puerta', 0).setScale(0.55);
        this.repetir([[1500, () => s.setFrame(0)], [1500, () => s.setFrame(1)]]);
        return s;
      }]
    ];
    objetos.forEach(([nombre, descripcion, crear], i) => {
      const x = 60 + (i % 2) * 440;
      const y = 152 + Math.floor(i / 2) * 76;
      this.marco(p, x, y - 32, 68, 64);
      p.add(crear(x + 34, y));
      this.texto(p, x + 84, y - 12, nombre, { tamano: 20, color: COLOR.oro });
      this.texto(p, x + 84, y + 14, descripcion);
    });
    return p;
  }

  // ---------------------------------------------------------------- página 3: enemigos

  crearPaginaEnemigos() {
    const p = this.add.container(0, 0);
    const tarjeta = (i, nombre, lineas, tamanoNombre = 20) => {
      const x = 40 + (i % 2) * 445;
      const y = 122 + Math.floor(i / 2) * 170;
      this.marco(p, x, y, 435, 158);
      this.texto(p, x + 152, y + 24, nombre, { tamano: tamanoNombre, color: COLOR.oro });
      lineas.forEach((l, k) => this.texto(p, x + 152, y + 54 + k * 24, l));
      // Escenario de la demostración: suelo pequeño a la izquierda de la tarjeta
      const piso = this.add.graphics();
      piso.fillStyle(0x2a2152, 1).fillRect(x + 10, y + 124, 140, 4);
      p.add(piso);
      return { x: x + 78, suelo: y + 124, y };
    };

    // Neblino: patrulla y da la vuelta
    const t1 = tarjeta(0, 'Neblino', ['Patrulla el suelo y da', 'la vuelta en los bordes.', 'Salta encima de él.']);
    const neblino = this.add.sprite(t1.x - 35, t1.suelo, 'neblino').setOrigin(0.5, 1).setScale(1.6).play('neblino-andar');
    this.tweens.add({ targets: neblino, x: t1.x + 35, duration: 1400, yoyo: true, repeat: -1, onYoyo: () => neblino.setFlipX(true), onRepeat: () => neblino.setFlipX(false) });
    p.add(neblino);

    // Murciélago de escarcha: vuela en ondas
    const t2 = tarjeta(1, 'Murciélago de escarcha', ['Vuela sin detenerse.', 'Písalo desde arriba', 'o pasa por debajo.'], 18);
    const murcielago = this.add.sprite(t2.x, t2.y + 60, 'murcielago').setScale(1.6).play('murcielago-volar');
    this.tweens.add({ targets: murcielago, y: t2.y + 84, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: murcielago, x: { from: t2.x - 40, to: t2.x + 40 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    p.add(murcielago);

    // Llama hechizada: quieta -> infla las mejillas -> escupe
    const t3 = tarjeta(2, 'Llama hechizada', ['Escupe escarcha si estás', 'a su altura. Cuando infla', 'las mejillas, ¡salta!', 'Písala para liberarla.']);
    const llama = this.add.sprite(t3.x + 22, t3.suelo, 'llama').setOrigin(0.5, 1).setScale(1.1);
    p.add(llama);
    this.repetir([
      [1400, () => llama.play('llama-quieta')],
      [550, () => llama.play('llama-inflar')],
      [900, () => {
        llama.play('llama-escupir');
        const escupitajo = this.add.image(llama.x - 30, t3.suelo - 42, 'escupitajo').setScale(1.2);
        p.add(escupitajo);
        this.tweens.add({ targets: escupitajo, x: t3.x - 64, alpha: 0.3, duration: 650, onComplete: () => escupitajo.destroy() });
      }]
    ]);

    // Atoq de niebla: patrulla -> alerta (!) -> embiste -> cansado
    const t4 = tarjeta(3, 'Atoq de niebla', ['Si te ve, muestra un !', 'y embiste. Al terminar', 'queda cansado: ¡písalo!']);
    const atoq = this.add.sprite(t4.x + 20, t4.suelo, 'atoq').setOrigin(0.5, 1);
    const alerta = this.texto(p, 0, 0, '!', { tamano: 24, color: COLOR.grana, origenX: 0.5 }).setVisible(false);
    p.add(atoq);
    p.bringToTop(alerta);
    this.repetir([
      [1500, () => {
        atoq.play('atoq-andar').setFlipX(false);
        this.tweens.add({ targets: atoq, x: t4.x + 32, duration: 700, yoyo: true });
      }],
      [450, () => {
        atoq.play('atoq-alerta');
        alerta.setPosition(atoq.x, t4.suelo - 58).setVisible(true);
      }],
      [600, () => {
        alerta.setVisible(false);
        atoq.play('atoq-correr').setFlipX(true);
        this.tweens.add({ targets: atoq, x: t4.x - 32, duration: 450, ease: 'Quad.in' });
      }],
      [1200, () => atoq.play('atoq-cansado')],
      [700, () => {
        atoq.play('atoq-andar');
        this.tweens.add({ targets: atoq, x: t4.x + 20, duration: 650 });
      }]
    ]);
    return p;
  }

  // ---------------------------------------------------------------- página 4: jefe

  crearPaginaJefe() {
    const p = this.add.container(0, 0);
    const caja = { x: 40, y: 122, ancho: 400, alto: 328 };
    this.marco(p, caja.x, caja.y, caja.ancho, caja.alto);
    const suelo = caja.y + caja.alto - 30;
    const piso = this.add.graphics();
    piso.fillStyle(0x3a1f2a, 1).fillRect(caja.x + 2, suelo, caja.ancho - 4, 28);
    piso.fillStyle(0xff6b3d, 0.7).fillRect(caja.x + 2, suelo, caja.ancho - 4, 4);
    p.add(piso);

    const centroX = caja.x + caja.ancho / 2;
    const vuelo = caja.y + 100;
    const uku = this.add.sprite(centroX, vuelo, 'uku').setScale(1.3);
    const etiquetaFase = this.texto(p, caja.x + 16, caja.y + 22, '', { tamano: 20 });
    p.add(uku);
    new Rayo(this, 0, 0).destroy(); // crea la textura del rayo si aún no existe

    let fase = 0;
    const flotar = this.tweens.add({ targets: uku, y: vuelo + 10, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const ponerFase = () => {
      uku.setTint(COLORES_FASE[fase]);
      etiquetaFase.setText(`Fase ${fase + 1} de 3`).setTint(COLORES_FASE[fase]);
    };
    const esquirla = (x) => {
      const e = this.add.image(x, uku.y + 30, 'esquirla');
      p.add(e);
      this.tweens.add({ targets: e, y: suelo - 12, duration: 650, ease: 'Quad.in', onComplete: () => e.destroy() });
    };
    const rayo = (x) => {
      const sombra = this.add.ellipse(x, suelo - 3, 46, 10, 0xffc928, 0.75).setStrokeStyle(2, 0xfff36b, 0.9);
      p.add(sombra);
      this.tweens.add({ targets: sombra, alpha: 0.2, scaleX: 0.7, duration: 180, yoyo: true, repeat: 2 });
      this.time.delayedCall(800, () => {
        sombra.destroy();
        const r = this.add.image(x, caja.y + 10, 'rayo').setOrigin(0.5, 0);
        p.add(r);
        this.tweens.add({ targets: r, y: suelo - 60, duration: 220, onComplete: () => this.tweens.add({ targets: r, alpha: 0, duration: 200, onComplete: () => r.destroy() }) });
      });
    };

    ponerFase();
    this.repetir([
      [900, () => { flotar.resume(); uku.play('uku-flotar'); esquirla(centroX - 40); esquirla(centroX + 40); }],
      [1300, () => { if (fase === 2) rayo(centroX + 120); }], // los rayos solo llegan en la fase 3
      [700, () => {
        // Aviso: ojos rojos y temblor antes de la picada
        flotar.pause();
        uku.anims.stop();
        uku.setFrame(2);
        this.tweens.add({ targets: uku, x: centroX + 4, duration: 50, yoyo: true, repeat: 6 });
      }],
      [300, () => this.tweens.add({ targets: uku, y: suelo - 58, duration: 280, ease: 'Quad.in' })],
      [1200, () => {
        uku.setFrame(3);
        this.cameras.main.shake(180, 0.004);
      }],
      [700, () => {
        // Kusi le cae encima: destello blanco y cambio de fase
        uku.setTintFill(0xffffff);
        const golpe = this.texto(p, uku.x, uku.y - 70, '¡Golpe!', { tamano: 22, color: COLOR.oroClaro, origenX: 0.5 });
        this.tweens.add({ targets: golpe, y: golpe.y - 20, alpha: 0, duration: 650, onComplete: () => golpe.destroy() });
        this.time.delayedCall(150, () => { fase = (fase + 1) % 3; ponerFase(); });
      }],
      [700, () => this.tweens.add({ targets: uku, x: centroX, y: vuelo, duration: 650, ease: 'Sine.out' })]
    ]);

    // Explicación a la derecha
    const x = 470;
    this.texto(p, x, 140, 'Uku, Señor de la Niebla', { tamano: 20, color: COLOR.oro });
    const lineas = [
      ['· Lanza esquirlas de hielo desde el aire.'],
      ['· Si sus ojos se ponen rojos, se lanza', '  en picada contra el suelo.'],
      ['· Al chocar queda aturdido: ¡salta encima!', '  Necesitas 6 golpes para vencerlo.'],
      ['· En la fase 3, una sombra amarilla avisa', '  que va a caer un rayo. ¡Apártate!'],
      ['· En cada fase es más rápido, lanza más', '  hielo y se recupera antes.']
    ];
    let y = 174;
    lineas.forEach((grupo) => {
      grupo.forEach((l) => { this.texto(p, x, y, l); y += 24; });
      y += 8;
    });
    // Colores de cada fase, los mismos que toma Uku en la pelea
    COLORES_FASE.forEach((color, i) => {
      const cx = x + 8 + i * 130;
      p.add(this.add.rectangle(cx, 446, 14, 14, color));
      this.texto(p, cx + 14, 446, `Fase ${i + 1}`, { color });
    });
    return p;
  }
}
