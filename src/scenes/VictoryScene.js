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

/** Pantalla final de victoria tras derrotar a Uku y ver el epílogo. */
export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super(ESCENAS.VICTORIA);
  }

  create() {
    if (!estadoJuego.es(ESTADO.VICTORIA)) estadoJuego.cambiar(ESTADO.VICTORIA);
    const fondo = new ParallaxBackground(this, 'valle', { niebla: false });
    this.fondo = fondo;
    this.desplazamiento = 0;
    const nuevoRecord = almacen.actualizarRecord(sesion.puntos);
    almacen.borrarPartida();
    audio.reproducirMusica(MUSICA.VICTORIA, { bucle: false });
    this.time.delayedCall(4500, () => audio.reproducirMusica(MUSICA.MENU));

    // El sol reconstruido gira detrás del título
    const sol = this.add.sprite(ANCHO / 2, 120, 'fragmento').setScale(6).play('fragmento-girar');
    this.tweens.add({ targets: sol, scale: 7, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.particles(ANCHO / 2, 120, 'particula', {
      speed: { min: 40, max: 160 }, lifespan: 1600, scale: { start: 1, end: 0 }, frequency: 60, tint: [0xf5b829, 0xffe27a, 0xc8233c]
    });

    this.add.bitmapText(ANCHO / 2, 210, FUENTE, 'El Inti Sonqo brilla de nuevo', 24).setOrigin(0.5).setScale(1.5).setTint(COLOR.oro);
    this.add.bitmapText(ANCHO / 2, 262, FUENTE, `Puntos finales: ${sesion.puntos}     Récord: ${almacen.record}`, 24).setOrigin(0.5);
    this.add.bitmapText(ANCHO / 2, 294, FUENTE, `Fragmentos recogidos en la partida: ${sesion.fragmentosPartida}`, 24).setOrigin(0.5);
    if (nuevoRecord) this.add.bitmapText(ANCHO / 2, 326, FUENTE, '¡Nuevo récord!', 24).setOrigin(0.5).setTint(COLOR.turquesa);

    const botones = [
      new TextButton(this, ANCHO / 2, 392, 'Jugar de nuevo', () => {
        sesion.nueva(1);
        estadoJuego.cambiar(ESTADO.MENU);
        estadoJuego.cambiar(ESTADO.JUGANDO);
        this.scene.start(ESCENAS.JUEGO, { nivel: 1 });
      }),
      new TextButton(this, ANCHO / 2, 456, 'Menú principal', () => {
        estadoJuego.cambiar(ESTADO.MENU);
        this.scene.start(ESCENAS.MENU);
      })
    ];
    new MenuList(this, botones);
    this.add.bitmapText(ANCHO / 2, ALTO - 22, FUENTE, 'Gracias por jugar', 24).setOrigin(0.5).setTint(0x8a84b0);
  }

  update(_t, delta) {
    this.desplazamiento += delta * 0.05;
    this.fondo.actualizar(this.desplazamiento, delta / 1000);
  }
}
