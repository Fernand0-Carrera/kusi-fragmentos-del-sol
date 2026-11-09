import Phaser from 'phaser';
import { ANCHO, ALTO, COLOR, ESCENAS, FUENTE } from '../config/constants.js';
import ParallaxBackground from '../ui/ParallaxBackground.js';
import TextButton from '../ui/TextButton.js';
import MenuList from '../ui/MenuList.js';

/** Instrucciones y controles documentados dentro del juego (accesibilidad). */
export default class HelpScene extends Phaser.Scene {
  constructor() {
    super(ESCENAS.AYUDA);
  }

  create() {
    new ParallaxBackground(this, 'hielo', { niebla: false });
    this.add.rectangle(ANCHO / 2, ALTO / 2 - 10, ANCHO - 60, ALTO - 110, COLOR.panel, 0.88).setStrokeStyle(2, COLOR.oro);
    this.add.bitmapText(ANCHO / 2, 50, FUENTE, 'Cómo jugar', 24).setOrigin(0.5).setScale(1.5).setTint(COLOR.oro);

    const columna = (x, titulo, lineas) => {
      this.add.bitmapText(x, 92, FUENTE, titulo, 24).setTint(COLOR.turquesa);
      lineas.forEach((l, i) => this.add.bitmapText(x, 128 + i * 30, FUENTE, l, 24));
    };
    columna(60, 'Teclado', [
      'Flechas o A / D: moverse',
      'Espacio, W, Z o Flecha arriba: saltar',
      'Mantén saltar para llegar más alto',
      'P o Esc: pausa',
      'M: silenciar   F: ver FPS'
    ]);
    columna(560, 'Pantalla táctil', [
      'Botones abajo a la izquierda:',
      'moverse',
      'Botón abajo a la derecha: saltar',
      'Iconos arriba: pausa, sonido',
      'y pantalla completa'
    ]);

    const objetos = [
      ['fragmento', 0, 'Fragmento de sol: +10 puntos'],
      ['corazon', 0, 'Corazón: una vida más (máximo 5)'],
      ['neblino', 0, 'Neblino y murciélago: salta encima'],
      ['apacheta', 1, 'Apacheta: punto de control'],
      ['puya', 0, 'Flor de puya: te lanza muy alto'],
      ['puerta', 1, 'Puerta del Sol: meta del nivel']
    ];
    objetos.forEach(([clave, cuadro, texto], i) => {
      const x = 80 + (i % 2) * 470;
      const y = 315 + Math.floor(i / 2) * 50;
      this.add.image(x, y, clave, cuadro).setScale(clave === 'puerta' ? 0.45 : 0.9);
      this.add.bitmapText(x + 36, y, FUENTE, texto, 24).setOrigin(0, 0.5);
    });

    const volver = new TextButton(this, ANCHO / 2, ALTO - 42, 'Volver al menú', () => this.scene.start(ESCENAS.MENU), { ancho: 300, alto: 46 });
    new MenuList(this, [volver]);
    this.input.keyboard.once('keydown-ESC', () => this.scene.start(ESCENAS.MENU));
  }
}
