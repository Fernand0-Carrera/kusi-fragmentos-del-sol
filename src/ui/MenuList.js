import Phaser from 'phaser';

/**
 * Navegación con teclado para una lista de TextButton (accesibilidad):
 * flechas o W/S para moverse, Enter o Espacio para elegir.
 * El ratón y el toque también mueven el foco al pasar sobre un botón.
 */
export default class MenuList {
  constructor(scene, botones) {
    this.scene = scene;
    this.botones = botones;
    this.indice = 0;
    botones.forEach((b, i) => b.on('enfocar', () => this.enfocar(i)));
    this.enfocar(0);

    const teclado = scene.input.keyboard;
    this.alPresionar = (evento) => {
      const codigo = evento.keyCode;
      const K = Phaser.Input.Keyboard.KeyCodes;
      if (codigo === K.UP || codigo === K.W) this.enfocar((this.indice - 1 + this.botones.length) % this.botones.length);
      else if (codigo === K.DOWN || codigo === K.S) this.enfocar((this.indice + 1) % this.botones.length);
      else if (codigo === K.ENTER || codigo === K.SPACE) this.botones[this.indice]?.pulsar();
    };
    teclado.on('keydown', this.alPresionar);
    scene.events.once('shutdown', () => teclado.off('keydown', this.alPresionar));
  }

  enfocar(i) {
    this.indice = i;
    this.botones.forEach((b, k) => b.setEnfocado(k === i));
  }
}
