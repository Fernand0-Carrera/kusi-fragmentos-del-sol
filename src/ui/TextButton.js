import Phaser from 'phaser';
import { COLOR, FUENTE } from '../config/constants.js';
import { audio } from '../managers/AudioManager.js';
import { SFX } from '../audio/audioKeys.js';

/**
 * Botón de texto reutilizable: fondo, borde dorado al tener el foco
 * (visible también al navegar con teclado) y área táctil generosa.
 */
export default class TextButton extends Phaser.GameObjects.Container {
  constructor(scene, x, y, texto, alPulsar, { ancho = 340, alto = 48 } = {}) {
    super(scene, x, y);
    this.ancho = ancho;
    this.alto = alto;
    this.alPulsar = alPulsar;
    this.fondo = scene.add.graphics();
    this.etiqueta = scene.add.bitmapText(0, 0, FUENTE, texto, 24).setOrigin(0.5);
    this.add([this.fondo, this.etiqueta]);
    this.setSize(ancho, alto);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => this.emit('enfocar', this));
    this.on('pointerup', () => this.pulsar());
    this.dibujar(false);
    scene.add.existing(this);
  }

  setTexto(texto) {
    this.etiqueta.setText(texto);
    return this;
  }

  dibujar(enfocado) {
    const g = this.fondo;
    g.clear();
    g.fillStyle(enfocado ? 0x2a2152 : COLOR.panel, 0.92);
    g.fillRoundedRect(-this.ancho / 2, -this.alto / 2, this.ancho, this.alto, 6);
    g.lineStyle(enfocado ? 3 : 2, enfocado ? COLOR.oro : 0x4a4070, 1);
    g.strokeRoundedRect(-this.ancho / 2, -this.alto / 2, this.ancho, this.alto, 6);
    this.etiqueta.setTint(enfocado ? COLOR.oroClaro : COLOR.lana);
  }

  setEnfocado(valor) {
    this.dibujar(valor);
  }

  pulsar() {
    audio.efecto(SFX.CLIC);
    this.alPulsar?.();
  }
}
