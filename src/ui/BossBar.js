import { COLOR, FUENTE } from '../config/constants.js';

/** Barra de vida del jefe, oculta hasta que empieza la pelea. */
export default class BossBar {
  constructor(scene, x, y, ancho = 320) {
    this.ancho = ancho;
    this.etiqueta = scene.add.bitmapText(x, y, FUENTE, 'Uku, Señor de la Niebla', 24).setOrigin(0.5, 1).setTint(0x9fe3ff);
    this.marco = scene.add.rectangle(x, y + 6, ancho + 6, 18, COLOR.panel, 0.9).setOrigin(0.5, 0).setStrokeStyle(2, 0x9fe3ff);
    this.barra = scene.add.rectangle(x - ancho / 2, y + 9, ancho, 12, COLOR.grana).setOrigin(0, 0);
    this.setVisible(false);
  }

  setVisible(v) {
    [this.etiqueta, this.marco, this.barra].forEach((o) => o.setVisible(v));
  }

  actualizar(vida, maxima) {
    this.setVisible(vida > 0);
    this.barra.setSize(this.ancho * Math.max(0, vida) / maxima, 12);
  }
}
