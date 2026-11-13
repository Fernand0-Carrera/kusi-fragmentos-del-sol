import Phaser from 'phaser';
import { ANCHO, ALTO, COLOR, ESCENAS, FUENTE } from '../config/constants.js';
import { NIVELES } from '../data/levels.js';
import { MUSICA, SFX } from '../audio/audioKeys.js';
import { audio } from '../managers/AudioManager.js';
import { almacen } from '../managers/StorageManager.js';
import { sesion } from '../managers/GameSession.js';
import { estadoJuego, ESTADO } from '../managers/GameStateManager.js';
import ParallaxBackground from '../ui/ParallaxBackground.js';
import TextButton from '../ui/TextButton.js';

const ANCHO_TARJETA = 260;
const ALTO_TARJETA = 330;
const ESCALA_VISTA = 0.25; // la vista previa es el fondo del nivel a un cuarto de tamaño (240 x 135)

/**
 * Selector de niveles. Muestra una tarjeta por nivel con una vista previa
 * de su fondo; solo se pueden elegir los niveles ya alcanzados
 * (StorageManager.nivelAlcanzado). Elegir un nivel empieza una partida
 * nueva desde ese nivel, sin tocar la partida guardada de "Continuar".
 * Cada tarjeta muestra además el mejor resultado de ese nivel (puntos,
 * fragmentos y tiempo), guardado por StorageManager al completarlo.
 * Navegación: flechas o A/D/W/S, Enter o Espacio, Esc para volver.
 */
export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super(ESCENAS.SELECTOR);
  }

  create() {
    if (!estadoJuego.es(ESTADO.MENU)) estadoJuego.cambiar(ESTADO.MENU);
    // Phaser reutiliza la misma instancia de la escena: se reinicia el estado en cada visita
    this.saliendo = false;
    this.ultimaTarjetaEnfocada = undefined;
    this.fondo = new ParallaxBackground(this, 'valle');
    this.desplazamiento = 0;
    audio.reproducirMusica(MUSICA.MENU);

    this.add.rectangle(ANCHO / 2, ALTO / 2 - 6, ANCHO - 60, ALTO - 96, COLOR.panel, 0.85).setStrokeStyle(2, COLOR.oro);
    this.add.bitmapText(ANCHO / 2, 56, FUENTE, 'Elegir nivel', 24).setOrigin(0.5).setScale(1.5).setTint(COLOR.oro);

    const alcanzado = Math.min(almacen.nivelAlcanzado, NIVELES.length);
    const separacion = ANCHO_TARJETA + 30;
    const inicioX = ANCHO / 2 - ((NIVELES.length - 1) * separacion) / 2;
    this.tarjetas = NIVELES.map((nivel, i) =>
      this.crearTarjeta(inicioX + i * separacion, 252, nivel, nivel.id <= alcanzado));

    this.volver = new TextButton(this, ANCHO / 2, ALTO - 74, 'Volver al menú', () => this.irAlMenu(), { ancho: 300, alto: 46 });
    this.volver.on('enfocar', () => this.enfocar(this.tarjetas.length));
    this.elementos = [...this.tarjetas, this.volver];

    this.aviso = this.add.bitmapText(ANCHO / 2, ALTO - 26, FUENTE, 'Completa un nivel para desbloquear el siguiente', 24)
      .setOrigin(0.5).setTint(COLOR.lana);

    // Empieza enfocado el último nivel desbloqueado
    this.enfocar(alcanzado - 1);
    this.configurarTeclado();
  }

  /** Tarjeta de un nivel: vista previa, número, nombre y candado si está bloqueado. */
  crearTarjeta(x, y, nivel, desbloqueado) {
    const tarjeta = this.add.container(x, y);
    tarjeta.nivel = nivel;
    tarjeta.desbloqueado = desbloqueado;

    tarjeta.marco = this.add.graphics();
    tarjeta.add(tarjeta.marco);

    // Vista previa: las tres capas del fondo del nivel, reducidas
    const vista = this.add.container(-120, -ALTO_TARJETA / 2 + 14);
    const posiciones = this.cache.json.get('fondos') ?? {};
    [0, 1, 2].forEach((i) => {
      const clave = `fondo_${nivel.tema}_${i}`;
      const { y: capaY = 0 } = posiciones[clave] ?? {};
      const capa = this.add.image(0, capaY * ESCALA_VISTA, clave).setOrigin(0).setScale(ESCALA_VISTA);
      if (!desbloqueado) capa.setTint(0x3a3456);
      vista.add(capa);
    });
    tarjeta.add(vista);

    const numero = this.add.bitmapText(0, 2, FUENTE, `Nivel ${nivel.id}`, 24).setOrigin(0.5)
      .setTint(desbloqueado ? COLOR.oro : 0x6a6290);
    const nombre = this.add.bitmapText(0, 20, FUENTE, desbloqueado ? nivel.nombre : '???', 24).setOrigin(0.5, 0)
      .setMaxWidth(ANCHO_TARJETA - 20).setCenterAlign().setTint(desbloqueado ? COLOR.lana : 0x6a6290);
    tarjeta.add([numero, nombre]);
    if (desbloqueado) this.agregarResultado(tarjeta, almacen.resultadoNivel(nivel.id));

    if (!desbloqueado) tarjeta.add(this.dibujarCandado(0, -ALTO_TARJETA / 2 + 14 + 67));

    tarjeta.setSize(ANCHO_TARJETA, ALTO_TARJETA);
    tarjeta.setInteractive({ useHandCursor: desbloqueado });
    tarjeta.on('pointerover', () => this.enfocar(this.tarjetas.indexOf(tarjeta)));
    tarjeta.on('pointerup', () => this.elegir(tarjeta));
    return tarjeta;
  }

  /**
   * Franja inferior de la tarjeta con el mejor resultado del nivel:
   * puntos, fragmentos (en dorado si se recogieron todos) y tiempo.
   */
  agregarResultado(tarjeta, resultado) {
    const base = ALTO_TARJETA / 2 - 58;
    const linea = this.add.graphics();
    linea.lineStyle(1, 0x4a4070, 1).lineBetween(-ANCHO_TARJETA / 2 + 16, base - 4, ANCHO_TARJETA / 2 - 16, base - 4);
    tarjeta.add(linea);
    if (!resultado) {
      tarjeta.add(this.add.bitmapText(0, base + 22, FUENTE, 'Aún sin completar', 20).setOrigin(0.5).setTint(0x8a84b0));
      return;
    }
    const { puntos, fragmentos, total, segundos } = resultado;
    tarjeta.add(this.add.bitmapText(0, base + 12, FUENTE, `Mejor: ${puntos} pts`, 20).setOrigin(0.5).setTint(COLOR.oroClaro));

    const completo = fragmentos >= total;
    const tiempo = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
    const texto = this.add.bitmapText(0, base + 36, FUENTE, `${fragmentos}/${total}   Tiempo ${tiempo}`, 18)
      .setOrigin(0, 0.5).setTint(completo ? COLOR.oro : COLOR.lana);
    const icono = this.add.sprite(0, base + 36, 'fragmento').setScale(0.6);
    if (completo) icono.play('fragmento-girar'); // todos los fragmentos: el icono gira
    // Icono + texto centrados juntos
    const anchoTotal = icono.displayWidth + 6 + texto.width;
    icono.x = -anchoTotal / 2 + icono.displayWidth / 2;
    texto.x = icono.x + icono.displayWidth / 2 + 6;
    tarjeta.add([icono, texto]);
  }

  /** Candado dibujado con Graphics (no necesita sprite propio). */
  dibujarCandado(x, y) {
    const g = this.add.graphics({ x, y });
    g.lineStyle(6, COLOR.lana, 1);
    g.beginPath();
    g.arc(0, -8, 13, Math.PI, 0);
    g.strokePath();
    g.lineBetween(-13, -8, -13, 2);
    g.lineBetween(13, -8, 13, 2);
    g.fillStyle(COLOR.oro, 1);
    g.fillRoundedRect(-20, 0, 40, 30, 4);
    g.fillStyle(COLOR.panel, 1);
    g.fillCircle(0, 12, 5);
    g.fillRect(-2, 12, 4, 10);
    return g;
  }

  dibujarTarjeta(tarjeta, enfocada) {
    const g = tarjeta.marco;
    const borde = tarjeta.desbloqueado ? (enfocada ? COLOR.oro : 0x4a4070) : (enfocada ? COLOR.grana : 0x3a3456);
    g.clear();
    g.fillStyle(enfocada ? 0x2a2152 : COLOR.panel, 0.95);
    g.fillRoundedRect(-ANCHO_TARJETA / 2, -ALTO_TARJETA / 2, ANCHO_TARJETA, ALTO_TARJETA, 8);
    g.lineStyle(enfocada ? 4 : 2, borde, 1);
    g.strokeRoundedRect(-ANCHO_TARJETA / 2, -ALTO_TARJETA / 2, ANCHO_TARJETA, ALTO_TARJETA, 8);
    tarjeta.setScale(enfocada && tarjeta.desbloqueado ? 1.04 : 1);
  }

  enfocar(indice) {
    this.indice = Phaser.Math.Clamp(indice, 0, this.elementos.length - 1);
    this.tarjetas.forEach((t, i) => this.dibujarTarjeta(t, i === this.indice));
    this.volver.setEnfocado(this.indice === this.tarjetas.length);
  }

  configurarTeclado() {
    const K = Phaser.Input.Keyboard.KeyCodes;
    const ultimaTarjeta = this.tarjetas.length - 1;
    this.alPresionar = (evento) => {
      const c = evento.keyCode;
      const enVolver = this.indice === this.tarjetas.length;
      if (c === K.LEFT || c === K.A) {
        if (!enVolver) this.enfocar(Math.max(0, this.indice - 1));
      } else if (c === K.RIGHT || c === K.D) {
        if (!enVolver) this.enfocar(Math.min(ultimaTarjeta, this.indice + 1));
      } else if (c === K.DOWN || c === K.S) {
        if (!enVolver) { this.ultimaTarjetaEnfocada = this.indice; this.enfocar(this.tarjetas.length); }
      } else if (c === K.UP || c === K.W) {
        if (enVolver) this.enfocar(this.ultimaTarjetaEnfocada ?? 0);
      } else if (c === K.ENTER || c === K.SPACE) {
        if (enVolver) this.volver.pulsar();
        else this.elegir(this.tarjetas[this.indice]);
      } else if (c === K.ESC) {
        this.irAlMenu();
      }
    };
    this.input.keyboard.on('keydown', this.alPresionar);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this.alPresionar));
  }

  elegir(tarjeta) {
    if (this.saliendo) return;
    if (!tarjeta.desbloqueado) {
      // Nivel bloqueado: sacudida y aviso en rojo
      audio.efecto(SFX.CLIC);
      this.tweens.add({ targets: tarjeta, x: tarjeta.x + 6, duration: 50, yoyo: true, repeat: 3 });
      this.aviso.setTint(COLOR.grana);
      this.time.delayedCall(900, () => this.aviso.setTint(COLOR.lana));
      return;
    }
    audio.efecto(SFX.CLIC);
    this.saliendo = true;
    const numero = tarjeta.nivel.id;
    sesion.nueva(numero);
    this.cameras.main.fadeOut(300, 27, 22, 56);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (numero === 1) {
        // El nivel 1 conserva la introducción de la historia, como "Nueva partida"
        estadoJuego.cambiar(ESTADO.HISTORIA);
        this.scene.start(ESCENAS.HISTORIA, { id: 'intro', siguiente: { escena: ESCENAS.JUEGO, datos: { nivel: 1 } } });
      } else {
        estadoJuego.cambiar(ESTADO.JUGANDO);
        this.scene.start(ESCENAS.JUEGO, { nivel: numero });
      }
    });
  }

  irAlMenu() {
    if (this.saliendo) return;
    this.saliendo = true;
    this.scene.start(ESCENAS.MENU);
  }

  update(_t, delta) {
    this.desplazamiento += delta * 0.06;
    this.fondo.actualizar(this.desplazamiento, delta / 1000);
  }
}
