import Phaser from 'phaser';

/**
 * Estado compartido de los botones táctiles. TouchControls (en la escena del HUD)
 * escribe aquí y el InputManager de GameScene lo lee: así teclado y pantalla
 * táctil producen exactamente las mismas acciones.
 */
export const entradaTactil = { izquierda: false, derecha: false, saltar: false };

export function reiniciarEntradaTactil() {
  entradaTactil.izquierda = false;
  entradaTactil.derecha = false;
  entradaTactil.saltar = false;
}

/**
 * Traduce teclado + táctil a acciones del juego: izquierda, derecha y saltar.
 * Detecta además el "flanco" del salto (el fotograma en que se presiona),
 * necesario para el buffer de salto del jugador.
 */
export default class InputManager {
  constructor(scene) {
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.teclas = scene.input.keyboard.addKeys({
      izq: K.LEFT, der: K.RIGHT, a: K.A, d: K.D,
      arriba: K.UP, w: K.W, espacio: K.SPACE, z: K.Z
    });
    this.saltoAnterior = false;
    this.saltoPresionado = false;
  }

  /** Llamar una vez por fotograma antes de leer saltoPresionado. */
  actualizar() {
    const mantenido = this.saltarMantenido();
    this.saltoPresionado = mantenido && !this.saltoAnterior;
    this.saltoAnterior = mantenido;
  }

  izquierda() {
    return this.teclas.izq.isDown || this.teclas.a.isDown || entradaTactil.izquierda;
  }

  derecha() {
    return this.teclas.der.isDown || this.teclas.d.isDown || entradaTactil.derecha;
  }

  saltarMantenido() {
    const t = this.teclas;
    return t.arriba.isDown || t.w.isDown || t.espacio.isDown || t.z.isDown || entradaTactil.saltar;
  }
}
