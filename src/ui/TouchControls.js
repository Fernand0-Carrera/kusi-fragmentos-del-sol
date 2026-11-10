import { ICONO } from '../assets/assetManifest.js';
import { entradaTactil, reiniciarEntradaTactil } from '../managers/InputManager.js';
import { ANCHO, ALTO, COLOR } from '../config/constants.js';

/**
 * Controles táctiles equivalentes al teclado: izquierda y derecha abajo a la
 * izquierda; saltar abajo a la derecha y, a su lado, el dash. Admite varios
 * dedos a la vez (moverse, saltar y hacer dash al mismo tiempo) y suelta el
 * botón si el dedo se desliza fuera.
 */
export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    scene.input.addPointer(3); // 4 punteros simultáneos en total
    reiniciarEntradaTactil();
    this.botones = [
      this.crearBoton(90, ALTO - 80, ICONO.IZQUIERDA, 'izquierda'),
      this.crearBoton(210, ALTO - 80, ICONO.DERECHA, 'derecha'),
      this.crearBoton(ANCHO - 100, ALTO - 85, ICONO.SALTAR, 'saltar', 62),
      this.crearBoton(ANCHO - 230, ALTO - 62, ICONO.DASH, 'dash', 46)
    ];
    scene.events.once('shutdown', reiniciarEntradaTactil);
  }

  crearBoton(x, y, cuadro, accion, radio = 52) {
    const fondo = this.scene.add.circle(x, y, radio, COLOR.panel, 0.35).setStrokeStyle(3, COLOR.lana, 0.5);
    const icono = this.scene.add.image(x, y, 'iconos', cuadro).setAlpha(0.85);
    fondo.setInteractive();
    const presionar = (activo) => {
      entradaTactil[accion] = activo;
      fondo.setFillStyle(activo ? COLOR.oro : COLOR.panel, activo ? 0.45 : 0.35);
    };
    fondo.on('pointerdown', () => presionar(true));
    fondo.on('pointerup', () => presionar(false));
    fondo.on('pointerout', () => presionar(false));
    return { fondo, icono };
  }

  setVisible(visible) {
    this.botones.forEach(({ fondo, icono }) => { fondo.setVisible(visible); icono.setVisible(visible); });
    if (!visible) reiniciarEntradaTactil();
  }
}
