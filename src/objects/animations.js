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
  // Llama hechizada: 0-1 quieta · 2 inflada · 3 escupe · 4 liberándose · 5 liberada
  definir('llama-quieta', 'llama', [0, 1], 3);
  definir('llama-inflar', 'llama', [2], 1, 0);
  definir('llama-escupir', 'llama', [3], 1, 0);
  definir('llama-liberarse', 'llama', [4], 1, 0);
  definir('llama-libre', 'llama', [5], 1, 0);
  // Atoq de niebla: 0-1 patrulla · 2 alerta · 3-4 carga · 5 cansado · 6 liberándose · 7 liberado
  definir('atoq-andar', 'atoq', [0, 1], 6);
  definir('atoq-alerta', 'atoq', [2], 1, 0);
  definir('atoq-correr', 'atoq', [3, 4], 12);
  definir('atoq-cansado', 'atoq', [5], 1, 0);
  definir('atoq-liberarse', 'atoq', [6], 1, 0);
  definir('atoq-libre', 'atoq', [7], 1, 0);
  definir('uku-flotar', 'uku', [0, 1], 3);
  definir('fragmento-girar', 'fragmento', [0, 1, 2, 3, 4, 5], 10);
  definir('puya-rebote', 'puya', [1, 0], 8, 0);
}
