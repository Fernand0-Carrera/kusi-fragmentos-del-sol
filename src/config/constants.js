/**
 * Constantes globales del juego. Centralizarlas evita "números mágicos"
 * repartidos por el código y facilita ajustar la jugabilidad.
 */

// Resolución lógica: Phaser escala este lienzo a la ventana con Scale.FIT
export const ANCHO = 960;
export const ALTO = 540;
export const TILE = 32;

// Claves de escenas (se usan en scene.start / launch)
export const ESCENAS = {
  ARRANQUE: 'BootScene',
  CARGA: 'PreloadScene',
  MENU: 'MenuScene',
  AYUDA: 'HelpScene',
  HISTORIA: 'StoryScene',
  JUEGO: 'GameScene',
  HUD: 'UIScene',
  PAUSA: 'PauseScene',
  DERROTA: 'GameOverScene',
  VICTORIA: 'VictoryScene'
};

// Parámetros de física y control del personaje (píxeles y segundos)
export const FISICA = {
  gravedad: 1300,
  velocidadCarrera: 230,
  aceleracion: 1900,
  frenado: 2400,
  frenadoHielo: 420,      // en el nivel de hielo el suelo resbala
  aceleracionHielo: 900,
  salto: 560,             // altura máxima ≈ 3,7 baldosas
  corteSalto: 0.45,       // al soltar el botón el salto se acorta (salto variable)
  tiempoCoyote: 0.1,      // margen para saltar justo después de dejar el borde
  bufferSalto: 0.12,      // margen para registrar el salto un poco antes de tocar suelo
  caidaMaxima: 760,
  resorte: 950,
  rebotePisoton: 430,
  empujeDano: 260
};

export const JUGADOR = {
  vidasIniciales: 3,
  vidasMaximas: 5,
  invulnerable: 1.3       // segundos de parpadeo tras recibir daño
};

export const PUNTOS = {
  fragmento: 10,
  enemigo: 50,
  corazonExtra: 100,      // si se recoge un corazón con las vidas al máximo
  golpeJefe: 200,
  jefe: 1000,
  porVidaAlFinal: 100,
  porSegundoAhorrado: 5
};

// Orden de dibujo
export const CAPAS = {
  fondo: -10,
  niebla: -5,
  mapa: 0,
  objetos: 5,
  enemigos: 8,
  jugador: 10,
  particulas: 12,
  frente: 20
};

// Paleta inspirada en los textiles andinos (también se usa en la interfaz)
export const COLOR = {
  noche: 0x1b1638,
  niebla: 0xc9d6e3,
  oro: 0xf5b829,
  oroClaro: 0xffe27a,
  grana: 0xc8233c,
  turquesa: 0x2bb3a3,
  lana: 0xf3e6cf,
  panel: 0x120e26
};

export const FUENTE = 'pixel'; // fuente bitmap generada en tools/generar_imagenes.py

// Nombres de eventos del bus global (ver managers/EventBus.js)
export const EVENTOS = {
  SESION_CAMBIO: 'sesion:cambio',
  NIVEL_LISTO: 'nivel:listo',
  JEFE_APARECE: 'jefe:aparece',
  JEFE_VIDA: 'jefe:vida',
  JEFE_DERROTADO: 'jefe:derrotado',
  PAUSA_SOLICITADA: 'pausa:solicitada',
  AUDIO_CAMBIO: 'audio:cambio',
  MENSAJE: 'hud:mensaje'
};
