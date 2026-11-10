import Phaser from 'phaser';
import { ANCHO, ALTO, COLOR, ESCENAS, EVENTOS, FUENTE, JUGADOR, TILE } from '../config/constants.js';
import { ICONO } from '../assets/assetManifest.js';
import EventBus from '../managers/EventBus.js';
import { audio } from '../managers/AudioManager.js';
import { sesion } from '../managers/GameSession.js';
import Minimap from '../ui/Minimap.js';
import BossBar from '../ui/BossBar.js';
import TouchControls from '../ui/TouchControls.js';

/**
 * HUD: vidas, puntos, fragmentos, minimapa, barra del jefe, botones de
 * pausa / sonido / pantalla completa, mensajes y controles táctiles.
 * Se ejecuta en paralelo a GameScene y se entera de los cambios por el EventBus,
 * así la lógica del juego no depende de cómo se dibuja la interfaz.
 */
export default class UIScene extends Phaser.Scene {
  constructor() {
    super(ESCENAS.HUD);
  }

  init(datos) {
    this.datosNivel = datos.nivel;
  }

  create() {
    // --- Panel superior izquierdo: vidas, puntos y fragmentos
    this.add.rectangle(10, 10, 300, 92, COLOR.panel, 0.7).setOrigin(0).setStrokeStyle(2, 0x4a4070);
    this.corazones = Array.from({ length: JUGADOR.vidasMaximas }, (_, i) => this.add.image(34 + i * 30, 32, 'corazon', 0));
    this.textoPuntos = this.add.bitmapText(22, 50, FUENTE, '', 24).setTint(COLOR.oro);
    this.textoFragmentos = this.add.bitmapText(22, 74, FUENTE, '', 24);
    this.textoNivel = this.add.bitmapText(ANCHO / 2, ALTO - 20, FUENTE, `${this.datosNivel.id}. ${this.datosNivel.nombre}`, 24)
      .setOrigin(0.5).setAlpha(0.75);

    // --- Botones arriba a la derecha (grandes para el dedo)
    this.crearBotonIcono(ANCHO - 34, 34, ICONO.PAUSA, 'Pausa', () => EventBus.emit(EVENTOS.PAUSA_SOLICITADA));
    this.botonSonido = this.crearBotonIcono(ANCHO - 94, 34, audio.silenciado ? ICONO.SILENCIO : ICONO.SONIDO, 'Sonido', () => audio.alternarSilencio());
    this.crearBotonIcono(ANCHO - 154, 34, ICONO.PANTALLA, 'Pantalla completa', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen(); else this.scale.startFullscreen();
    });

    // --- Minimapa (bonus) y barra del jefe
    this.minimapa = new Minimap(this, ANCHO / 2 - 40, 10, this.datosNivel.filas, 1.6);
    this.barraJefe = new BossBar(this, ANCHO / 2, 88);

    // --- Mensajes centrales
    this.mensaje = this.add.bitmapText(ANCHO / 2, 150, FUENTE, '', 24).setOrigin(0.5).setAlpha(0).setTint(COLOR.oroClaro);

    // --- Controles táctiles: visibles en dispositivos táctiles (o con ?tactil en la URL)
    const tactil = this.sys.game.device.input.touch || new URLSearchParams(location.search).has('tactil');
    this.controles = tactil ? new TouchControls(this) : null;

    // --- Suscripción a eventos del juego
    const oyentes = {
      [EVENTOS.SESION_CAMBIO]: () => this.actualizarSesion(),
      [EVENTOS.AUDIO_CAMBIO]: (mute) => this.botonSonido.icono.setFrame(mute ? ICONO.SILENCIO : ICONO.SONIDO),
      [EVENTOS.MENSAJE]: (texto, duracion) => this.mostrarMensaje(texto, duracion),
      [EVENTOS.JEFE_APARECE]: () => this.barraJefe.setVisible(true),
      [EVENTOS.JEFE_VIDA]: (vida, max, fase) => this.barraJefe.actualizar(vida, max, fase),
      'nivel:completado': (resumen) => this.mostrarResumen(resumen)
    };
    Object.entries(oyentes).forEach(([evento, fn]) => EventBus.on(evento, fn));
    this.events.once('shutdown', () => Object.entries(oyentes).forEach(([evento, fn]) => EventBus.off(evento, fn)));

    this.juego = this.scene.get(ESCENAS.JUEGO);
    this.actualizarSesion();
  }

  crearBotonIcono(x, y, cuadro, nombre, accion) {
    const fondo = this.add.circle(x, y, 24, COLOR.panel, 0.75).setStrokeStyle(2, 0x4a4070);
    const icono = this.add.image(x, y, 'iconos', cuadro).setScale(0.75);
    fondo.setInteractive({ useHandCursor: true });
    fondo.on('pointerover', () => fondo.setStrokeStyle(2, COLOR.oro));
    fondo.on('pointerout', () => fondo.setStrokeStyle(2, 0x4a4070));
    fondo.on('pointerup', accion);
    fondo.setData('nombre', nombre);
    return { fondo, icono };
  }

  actualizarSesion() {
    this.corazones.forEach((c, i) => {
      c.setVisible(i < Math.max(sesion.vidas, JUGADOR.vidasIniciales));
      c.setFrame(i < sesion.vidas ? 0 : 1);
    });
    this.textoPuntos.setText(`Puntos ${String(sesion.puntos).padStart(6, '0')}`);
    this.textoFragmentos.setText(`☀ ${sesion.fragmentos} / ${sesion.fragmentosTotales}`);
  }

  mostrarMensaje(texto, duracion = 2200) {
    this.tweens.killTweensOf(this.mensaje);
    this.mensaje.setText(texto).setAlpha(0).setY(160);
    this.tweens.add({ targets: this.mensaje, alpha: 1, y: 150, duration: 250 });
    this.tweens.add({ targets: this.mensaje, alpha: 0, delay: duracion, duration: 400 });
  }

  mostrarResumen({ fragmentos, total, segundos, bonoTiempo, bonoVidas, puntos }) {
    this.controles?.setVisible(false);
    const panel = this.add.container(ANCHO / 2, ALTO / 2);
    const fondo = this.add.rectangle(0, 0, 520, 250, COLOR.panel, 0.94).setStrokeStyle(3, COLOR.oro);
    const lineas = [
      ['¡Camino completado!', COLOR.oro],
      [`Fragmentos: ${fragmentos} de ${total}`, COLOR.lana],
      [`Tiempo: ${segundos} s   Bono: +${bonoTiempo}`, COLOR.lana],
      [`Vidas restantes: +${bonoVidas}`, COLOR.lana],
      [`Puntos: ${puntos}`, COLOR.oroClaro]
    ];
    panel.add(fondo);
    lineas.forEach(([t, color], i) => panel.add(this.add.bitmapText(0, -90 + i * 44, FUENTE, t, 24).setOrigin(0.5).setTint(color)));
    panel.setScale(0.7).setAlpha(0);
    this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 350, ease: 'Back.out' });
  }

  update() {
    const juego = this.juego;
    if (!juego?.jugador) return;
    this.minimapa.actualizar(juego.jugador, juego.jefe, TILE);
  }
}
