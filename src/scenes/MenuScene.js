import Phaser from 'phaser';
import { ANCHO, ALTO, COLOR, ESCENAS, FUENTE } from '../config/constants.js';
import { TOTAL_NIVELES } from '../data/levels.js';
import { MUSICA } from '../audio/audioKeys.js';
import { audio } from '../managers/AudioManager.js';
import { almacen } from '../managers/StorageManager.js';
import { sesion } from '../managers/GameSession.js';
import { estadoJuego, ESTADO } from '../managers/GameStateManager.js';
import ParallaxBackground from '../ui/ParallaxBackground.js';
import TextButton from '../ui/TextButton.js';
import MenuList from '../ui/MenuList.js';

/** Menú principal: nueva partida, continuar, elegir nivel, instrucciones y sonido. */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(ESCENAS.MENU);
  }

  create() {
    if (!estadoJuego.es(ESTADO.MENU)) estadoJuego.cambiar(ESTADO.MENU);
    this.fondo = new ParallaxBackground(this, 'valle');
    this.desplazamiento = 0;
    audio.reproducirMusica(MUSICA.MENU);

    this.add.image(ANCHO / 2, 108, 'logo').setScale(0.8);
    const kusi = this.add.sprite(ANCHO / 2 - 300, 120, 'kusi').setScale(2).play('kusi-correr');
    this.tweens.add({ targets: kusi, y: 112, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const fragmento = this.add.sprite(ANCHO / 2 + 300, 110, 'fragmento').setScale(2).play('fragmento-girar');
    this.tweens.add({ targets: fragmento, y: 100, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const botones = [];
    let y = 214;
    const paso = 52;
    const partida = almacen.partida;
    if (partida) {
      botones.push(new TextButton(this, ANCHO / 2, y, `Continuar: nivel ${partida.nivel}`, () => this.continuar(partida)));
      y += paso;
    }
    botones.push(new TextButton(this, ANCHO / 2, y, 'Nueva partida', () => this.nuevaPartida()));
    y += paso;
    botones.push(new TextButton(this, ANCHO / 2, y, 'Elegir nivel', () => this.scene.start(ESCENAS.SELECTOR)));
    y += paso;
    botones.push(new TextButton(this, ANCHO / 2, y, 'Cómo jugar', () => this.scene.start(ESCENAS.AYUDA)));
    y += paso;
    this.botonSonido = new TextButton(this, ANCHO / 2, y, this.textoSonido(), () => {
      audio.alternarSilencio();
      this.botonSonido.setTexto(this.textoSonido());
    });
    botones.push(this.botonSonido);
    this.menu = new MenuList(this, botones);

    // Datos persistentes visibles para el jugador
    const nivel = Math.min(almacen.nivelAlcanzado, TOTAL_NIVELES);
    this.add.rectangle(ANCHO / 2, ALTO - 36, ANCHO, 44, COLOR.panel, 0.75);
    this.add.bitmapText(30, ALTO - 36, FUENTE, `Récord: ${almacen.record}`, 24).setOrigin(0, 0.5).setTint(COLOR.oro);
    this.add.bitmapText(ANCHO - 30, ALTO - 36, FUENTE, `Nivel alcanzado: ${nivel} de ${TOTAL_NIVELES}`, 24).setOrigin(1, 0.5);
    this.add.bitmapText(ANCHO / 2, y + 40, FUENTE, 'Flechas y Enter, o toca para elegir', 24).setOrigin(0.5).setTint(COLOR.lana);
  }

  textoSonido() {
    return audio.silenciado ? 'Sonido: apagado' : 'Sonido: encendido';
  }

  nuevaPartida() {
    sesion.nueva(1);
    almacen.borrarPartida();
    estadoJuego.cambiar(ESTADO.HISTORIA);
    this.scene.start(ESCENAS.HISTORIA, { id: 'intro', siguiente: { escena: ESCENAS.JUEGO, datos: { nivel: 1 } } });
  }

  continuar(partida) {
    sesion.nueva(partida.nivel, partida.puntos, partida.vidas);
    estadoJuego.cambiar(ESTADO.JUGANDO);
    this.scene.start(ESCENAS.JUEGO, { nivel: partida.nivel });
  }

  update(_t, delta) {
    this.desplazamiento += delta * 0.06;
    this.fondo.actualizar(this.desplazamiento, delta / 1000);
  }
}
