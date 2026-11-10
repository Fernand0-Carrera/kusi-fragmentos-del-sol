import Phaser from 'phaser';

/**
 * Estado compartido de los botones táctiles. TouchControls (en la escena del HUD)
 * escribe aquí y el InputManager de GameScene lo lee: así teclado y pantalla
 * táctil producen exactamente las mismas acciones.
 */
export const entradaTactil = { izquierda: false, derecha: false, saltar: false, dash: false };

export function reiniciarEntradaTactil() {
  entradaTactil.izquierda = false;
  entradaTactil.derecha = false;
  entradaTactil.saltar = false;
  entradaTactil.dash = false;
}

/**
 * Traduce teclado + táctil a acciones del juego: izquierda, derecha, saltar y dash.
 * Detecta además el "flanco" del salto y del dash (el fotograma en que se
 * presionan): el salto lo necesita para su buffer y el dash para no repetirse
 * mientras se mantiene la tecla. El dash en teclado se marca con el evento
 * keydown, así no se pierde un toque muy rápido aunque la tecla se suelte
 * antes del siguiente fotograma.
 */
export default class InputManager {
  constructor(scene) {
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.teclas = scene.input.keyboard.addKeys({
      izq: K.LEFT, der: K.RIGHT, a: K.A, d: K.D,
      arriba: K.UP, w: K.W, espacio: K.SPACE, z: K.Z,
      shift: K.SHIFT, x: K.X
    });
    this.saltoAnterior = false;
    this.saltoPresionado = false;
    this.dashTactilAnterior = false;
    this.dashPendiente = false;
    this.dashPresionado = false;
    const marcarDash = (evento) => { if (!evento.repeat) this.dashPendiente = true; };
    scene.input.keyboard.on('keydown-SHIFT', marcarDash);
    scene.input.keyboard.on('keydown-X', marcarDash);
  }

  /** Llamar una vez por fotograma antes de leer saltoPresionado o dashPresionado. */
  actualizar() {
    const mantenido = this.saltarMantenido();
    this.saltoPresionado = mantenido && !this.saltoAnterior;
    this.saltoAnterior = mantenido;

    const tactil = entradaTactil.dash && !this.dashTactilAnterior;
    this.dashTactilAnterior = entradaTactil.dash;
    this.dashPresionado = this.dashPendiente || tactil;
    this.dashPendiente = false;
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

  dashMantenido() {
    return this.teclas.shift.isDown || this.teclas.x.isDown || entradaTactil.dash;
  }
}
