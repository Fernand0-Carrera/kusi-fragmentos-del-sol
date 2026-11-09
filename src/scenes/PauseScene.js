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
    const botones = [
      new TextButton(this, ANCHO / 2, 210, 'Continuar', () => this.continuar()),
      new TextButton(this, ANCHO / 2, 274, 'Reiniciar nivel', () => this.reiniciar()),
      null,
      new TextButton(this, ANCHO / 2, 402, 'Salir al menú', () => this.salir())
    ];
    botones[2] = new TextButton(this, ANCHO / 2, 338, sonido(), () => { audio.alternarSilencio(); botones[2].setTexto(sonido()); });
    new MenuList(this, botones);

    this.add.bitmapText(ANCHO / 2, ALTO - 40, FUENTE, 'Moverse: flechas o A/D   Saltar: Espacio, W o Z   Pausa: P o Esc', 24)
      .setOrigin(0.5).setTint(0x8a84b0);
    this.input.keyboard.once('keydown-ESC', () => this.continuar());
    this.input.keyboard.once('keydown-P', () => this.continuar());
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
