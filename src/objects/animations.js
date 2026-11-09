/**
 * Crea todas las animaciones una sola vez (se comparten entre escenas).
 * Se llama desde PreloadScene cuando terminan de cargar las hojas de sprites.
 */
export function crearAnimaciones(anims) {
  const definir = (clave, textura, cuadros, fps, repetir = -1) => {
    if (anims.exists(clave)) return;
    anims.create({ key: clave, frames: anims.generateFrameNumbers(textura, { frames: cuadros }), frameRate: fps, repeat: repetir });
  };
  definir('kusi-quieto', 'kusi', [0, 1], 3);
  definir('kusi-correr', 'kusi', [2, 3, 4, 5], 12);
  definir('kusi-saltar', 'kusi', [6], 1, 0);
  definir('kusi-caer', 'kusi', [7], 1, 0);
  definir('kusi-herido', 'kusi', [8], 1, 0);
  definir('neblino-andar', 'neblino', [0, 1], 4);
  definir('murcielago-volar', 'murcielago', [0, 1], 8);
  definir('uku-flotar', 'uku', [0, 1], 3);
  definir('fragmento-girar', 'fragmento', [0, 1, 2, 3, 4, 5], 10);
  definir('puya-rebote', 'puya', [1, 0], 8, 0);
}
