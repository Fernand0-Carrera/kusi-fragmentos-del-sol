import Phaser from 'phaser';
import { ANCHO, ALTO, COLOR, FISICA } from './config/constants.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import HelpScene from './scenes/HelpScene.js';
import StoryScene from './scenes/StoryScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import PauseScene from './scenes/PauseScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';
import { sesion } from './managers/GameSession.js';
import { almacen } from './managers/StorageManager.js';
import { estadoJuego } from './managers/GameStateManager.js';

/**
 * Punto de entrada. Configura Phaser: renderizador, escalado responsive,
 * física Arcade con gravedad y la lista de escenas.
 */
const parametros = new URLSearchParams(location.search);

const config = {
  // WebGL si está disponible; si no, Canvas. Con ?canvas se fuerza Canvas (equipos sin GPU)
  type: parametros.has('canvas') ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'juego',
  width: ANCHO,
  height: ALTO,
  backgroundColor: COLOR.noche,
  pixelArt: true,                // sin suavizado: píxeles nítidos al escalar
  scale: {
    mode: Phaser.Scale.FIT,      // se adapta a escritorio, tablet y móvil sin deformarse
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: FISICA.gravedad },
      debug: parametros.has('debug') // ?debug muestra los cuerpos
    }
  },
  input: { activePointers: 3 },
  fps: { target: 60 },
  scene: [BootScene, PreloadScene, MenuScene, HelpScene, StoryScene, GameScene, UIScene, PauseScene, GameOverScene, VictoryScene]
};

const juego = new Phaser.Game(config);

// Acceso desde la consola solo en desarrollo (útil para depurar y para pruebas automáticas)
if (import.meta.env.DEV) {
  window.__kusi = juego;
  window.__kusiDebug = { sesion, almacen, estadoJuego };
}

// PWA: el service worker se registra solo en la versión compilada
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
