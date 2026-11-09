import Phaser from 'phaser';
import { ANCHO, ALTO, COLOR, ESCENAS, FUENTE } from '../config/constants.js';
import { IMAGENES, HOJAS, AUDIOS } from '../assets/assetManifest.js';
import { crearAnimaciones } from '../objects/animations.js';
import { audio } from '../managers/AudioManager.js';
import { estadoJuego, ESTADO } from '../managers/GameStateManager.js';

/**
 * Loader de recursos con barra de progreso. Recorre el manifiesto de
 * assets, informa errores de carga y, al terminar, crea las animaciones
 * y abre el menú principal.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(ESCENAS.CARGA);
  }

  preload() {
    const cx = ANCHO / 2;
    const cy = ALTO / 2;
    this.add.bitmapText(cx, cy - 70, FUENTE, 'Kusi y los Fragmentos del Sol', 24).setOrigin(0.5).setTint(COLOR.oro);
    const marco = this.add.rectangle(cx, cy, 404, 28).setStrokeStyle(2, COLOR.lana);
    const barra = this.add.rectangle(cx - 198, cy, 0, 20, COLOR.oro).setOrigin(0, 0.5);
    const porcentaje = this.add.bitmapText(cx, cy + 42, FUENTE, '0 %', 24).setOrigin(0.5);
    const archivo = this.add.bitmapText(cx, cy + 80, FUENTE, '', 24).setOrigin(0.5).setTint(0x8a84b0);
    marco.setFillStyle(COLOR.panel);

    this.load.on('progress', (valor) => {
      barra.width = 396 * valor;
      porcentaje.setText(`${Math.round(valor * 100)} %`);
    });
    this.load.on('fileprogress', (f) => archivo.setText(`Cargando ${f.key}`));
    this.load.on('loaderror', (f) => console.error('No se pudo cargar el recurso:', f.key, f.src));

    IMAGENES.forEach(({ clave, ruta }) => this.load.image(clave, ruta));
    this.load.json('fondos', 'assets/images/fondos.json');
    HOJAS.forEach(({ clave, ruta, ancho, alto }) => this.load.spritesheet(clave, ruta, { frameWidth: ancho, frameHeight: alto }));
    AUDIOS.forEach(({ clave, rutas }) => this.load.audio(clave, rutas));
  }

  create() {
    crearAnimaciones(this.anims);
    audio.iniciar(this.game);
    estadoJuego.cambiar(ESTADO.MENU);
    this.scene.start(ESCENAS.MENU);
  }
}
