import Phaser from 'phaser';
import { ESCENAS } from '../config/constants.js';
import { FUENTE_BITMAP } from '../assets/assetManifest.js';

/**
 * Primera escena: carga solo lo mínimo (la fuente pixelada) para que la
 * pantalla de carga pueda mostrar texto, y pasa enseguida a PreloadScene.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super(ESCENAS.ARRANQUE);
  }

  preload() {
    this.load.bitmapFont(FUENTE_BITMAP.clave, FUENTE_BITMAP.imagen, FUENTE_BITMAP.xml);
  }

  create() {
    this.scene.start(ESCENAS.CARGA);
  }
}
