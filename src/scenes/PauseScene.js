import Phaser from 'phaser';
import { ANCHO, ALTO, COLOR, ESCENAS, FUENTE } from '../config/constants.js';
import { audio } from '../managers/AudioManager.js';
import { sesion } from '../managers/GameSession.js';
import { estadoJuego, ESTADO } from '../managers/GameStateManager.js';
import TextButton from '../ui/TextButton.js';
import MenuList from '../ui/MenuList.js';

/**
 * Menú de pausa superpuesto. GameScene queda en pausa (física, tiempo y
 * animaciones congelados) mientras esta escena está activa.
 * "Cómo jugar" abre HelpScene encima y esta escena se duerme; al volver de la
 * ayuda se despierta y la partida sigue exactamente donde estaba.
 */
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super(ESCENAS.PAUSA);
  }

  init(datos) {
    this.nivel = datos.nivel;
  }

  create() {
    this.add.rectangle(0, 0, ANCHO, ALTO, COLOR.noche, 0.78).setOrigin(0).setInteractive(); // bloquea clics al HUD
    this.add.bitmapText(ANCHO / 2, 88, FUENTE, 'Pausa', 24).setOrigin(0.5).setScale(2).setTint(COLOR.oro);
    this.add.bitmapText(ANCHO / 2, 140, FUENTE, `Puntos: ${sesion.puntos}   Fragmentos: ${sesion.fragmentos} / ${sesion.fragmentosTotales}`, 24).setOrigin(0.5);

    const sonido = () => (audio.silenciado ? 'Sonido: apagado' : 'Sonido: encendido');
    const y = (i) => 196 + i * 56;
    const botones = [
      new TextButton(this, ANCHO / 2, y(0), 'Continuar', () => this.continuar()),
      new TextButton(this, ANCHO / 2, y(1), 'Reiniciar nivel', () => this.reiniciar()),
      new TextButton(this, ANCHO / 2, y(2), 'Cómo jugar', () => this.abrirAyuda()),
      null,
      new TextButton(this, ANCHO / 2, y(4), 'Salir al menú', () => this.salir())
    ];
    botones[3] = new TextButton(this, ANCHO / 2, y(3), sonido(), () => { audio.alternarSilencio(); botones[3].setTexto(sonido()); });
    new MenuList(this, botones);

    this.add.bitmapText(ANCHO / 2, ALTO - 60, FUENTE, 'Mover: flechas o A/D    Saltar: Espacio    Dash: Shift o X', 24)
      .setOrigin(0.5).setTint(0x8a84b0);

    // Esc o P continúan la partida. Se ignoran justo después de despertar (al volver de
    // "Cómo jugar" con Esc), para que esa misma pulsación no cierre también la pausa.
    this.ignorarTeclasHasta = 0;
    const alContinuar = () => { if (this.time.now >= this.ignorarTeclasHasta) this.continuar(); };
    this.input.keyboard.on('keydown-ESC', alContinuar);
    this.input.keyboard.on('keydown-P', alContinuar);
    const alDespertar = () => { this.ignorarTeclasHasta = this.time.now + 250; };
    this.events.on('wake', alDespertar);
    this.events.once('shutdown', () => this.events.off('wake', alDespertar));
  }

  /** Abre "Cómo jugar" encima de la partida pausada. */
  abrirAyuda() {
    // Primero se duerme la pausa: así HelpScene, al arrancar, ya la ve esperando
    this.scene.sleep();
    this.scene.launch(ESCENAS.AYUDA, { desdePausa: true });
    this.scene.bringToTop(ESCENAS.AYUDA);
  }

  continuar() {
    estadoJuego.cambiar(ESTADO.JUGANDO);
    this.scene.resume(ESCENAS.JUEGO);
    this.scene.stop();
  }

  reiniciar() {
    // Vuelve a los puntos y vidas con que se empezó el nivel
    sesion.puntos = sesion.puntosInicioNivel;
    sesion.vidas = sesion.vidasInicioNivel;
    estadoJuego.cambiar(ESTADO.JUGANDO);
    this.scene.stop(ESCENAS.HUD);
    this.scene.stop(ESCENAS.JUEGO);
    this.scene.start(ESCENAS.JUEGO, { nivel: this.nivel });
  }

  salir() {
    estadoJuego.cambiar(ESTADO.MENU);
    this.scene.stop(ESCENAS.HUD);
    this.scene.stop(ESCENAS.JUEGO);
    this.scene.start(ESCENAS.MENU);
  }
}
