import Phaser from 'phaser';
import { ANCHO, ALTO, COLOR, ESCENAS, FUENTE } from '../config/constants.js';
import { MUSICA } from '../audio/audioKeys.js';
import { audio } from '../managers/AudioManager.js';
import { almacen } from '../managers/StorageManager.js';
import { sesion } from '../managers/GameSession.js';
import { estadoJuego, ESTADO } from '../managers/GameStateManager.js';
import ParallaxBackground from '../ui/ParallaxBackground.js';
import TextButton from '../ui/TextButton.js';
import MenuList from '../ui/MenuList.js';

/** Pantalla de Game Over: resumen, récord y opción de reintentar el nivel. */
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super(ESCENAS.DERROTA);
  }

  init(datos) {
    this.nivel = datos.nivel ?? 1;
    this.nuevoRecord = datos.nuevoRecord;
  }

  create() {
    new ParallaxBackground(this, 'crater');
    this.add.rectangle(0, 0, ANCHO, ALTO, COLOR.noche, 0.6).setOrigin(0);
    audio.reproducirMusica(MUSICA.DERROTA, { bucle: false });

    const neblino = this.add.sprite(ANCHO / 2, 110, 'neblino').setScale(3).play('neblino-andar');
    this.tweens.add({ targets: neblino, x: ANCHO / 2 + 30, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.bitmapText(ANCHO / 2, 185, FUENTE, 'La niebla alcanzó a Kusi', 24).setOrigin(0.5).setScale(1.5).setTint(COLOR.grana);
    this.add.bitmapText(ANCHO / 2, 240, FUENTE, `Puntos: ${sesion.puntos}     Récord: ${almacen.record}`, 24).setOrigin(0.5);
    if (this.nuevoRecord) {
      const aviso = this.add.bitmapText(ANCHO / 2, 272, FUENTE, '¡Nuevo récord!', 24).setOrigin(0.5).setTint(COLOR.oro);
      this.tweens.add({ targets: aviso, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    }

    const botones = [
      new TextButton(this, ANCHO / 2, 340, `Reintentar nivel ${this.nivel}`, () => this.reintentar()),
      new TextButton(this, ANCHO / 2, 404, 'Menú principal', () => {
        estadoJuego.cambiar(ESTADO.MENU);
        this.scene.start(ESCENAS.MENU);
      })
    ];
    new MenuList(this, botones);
  }

  reintentar() {
    sesion.reintentarNivel();
    estadoJuego.cambiar(ESTADO.JUGANDO);
    this.scene.start(ESCENAS.JUEGO, { nivel: this.nivel });
  }
}
