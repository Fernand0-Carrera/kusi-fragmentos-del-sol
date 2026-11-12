import { COLOR, FUENTE } from '../config/constants.js';

// Flechas dibujadas a mano: la fuente pixelada no trae los caracteres ← → ↑
const FLECHAS = { izq: 'izq', der: 'der', arriba: 'arriba' };

/**
 * Crea una línea de texto en la que las palabras entre llaves se dibujan
 * como teclas. Ejemplo: 'Salta con {Espacio} o {arriba}'.
 * Devuelve un Container con origen a la izquierda y centrado en vertical;
 * su propiedad `ancho` dice cuánto mide la línea completa.
 */
export function crearTextoConTeclas(scene, texto, { tamano = 24, color = COLOR.lana } = {}) {
  const linea = scene.add.container(0, 0);
  const espacio = Math.round(tamano * 0.4);
  let x = 0;
  texto.split(/(\{[^}]+\})/).filter(Boolean).forEach((parte) => {
    const tecla = parte.match(/^\{(.+)\}$/);
    if (tecla) {
      const t = crearTecla(scene, tecla[1], tamano);
      t.x = x + t.ancho / 2;
      linea.add(t);
      x += t.ancho + 4;
      return;
    }
    // Los espacios de los bordes se suman a mano: BitmapText no los mide
    if (/^\s/.test(parte)) x += espacio;
    const limpio = parte.trim();
    if (limpio) {
      const t = scene.add.bitmapText(x, 0, FUENTE, limpio, tamano).setOrigin(0, 0.5).setTint(color);
      linea.add(t);
      x += t.width;
    }
    if (/\s$/.test(parte)) x += espacio;
  });
  linea.ancho = x;
  return linea;
}

/** Una tecla: caja con borde y la letra (o una flecha) en el centro. */
export function crearTecla(scene, nombre, tamano = 24) {
  const alto = Math.round(tamano * 1.25);
  const tecla = scene.add.container(0, 0);
  let ancho = alto;
  let contenido = null;
  if (!FLECHAS[nombre]) {
    contenido = scene.add.bitmapText(0, 1, FUENTE, nombre, Math.round(tamano * 0.75)).setOrigin(0.5).setTint(COLOR.panel);
    ancho = Math.max(alto, contenido.width + 14);
  }
  const g = scene.add.graphics();
  g.fillStyle(0x8a7fb0, 1);
  g.fillRoundedRect(-ancho / 2, -alto / 2 + 3, ancho, alto, 5); // sombra inferior: parece una tecla de verdad
  g.fillStyle(COLOR.lana, 1);
  g.fillRoundedRect(-ancho / 2, -alto / 2, ancho, alto - 2, 5);
  if (FLECHAS[nombre]) {
    const m = alto * 0.22;
    g.fillStyle(COLOR.panel, 1);
    if (nombre === 'izq') g.fillTriangle(-m, 0, m, -m, m, m);
    else if (nombre === 'der') g.fillTriangle(m, 0, -m, -m, -m, m);
    else g.fillTriangle(0, -m, -m, m, m, m);
  }
  tecla.add(g);
  if (contenido) tecla.add(contenido);
  tecla.ancho = ancho;
  return tecla;
}
