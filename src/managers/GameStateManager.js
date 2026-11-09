import EventBus from './EventBus.js';

/**
 * Estado global de la aplicación. Define en qué fase está el juego y qué
 * transiciones están permitidas. Sirve para, por ejemplo, ignorar la tecla
 * de pausa cuando no se está jugando.
 */
export const ESTADO = Object.freeze({
  CARGANDO: 'cargando',
  MENU: 'menu',
  HISTORIA: 'historia',
  JUGANDO: 'jugando',
  PAUSA: 'pausa',
  DERROTA: 'derrota',
  VICTORIA: 'victoria'
});

// Transiciones válidas desde cada estado
const TRANSICIONES = {
  [ESTADO.CARGANDO]: [ESTADO.MENU],
  [ESTADO.MENU]: [ESTADO.HISTORIA, ESTADO.JUGANDO],
  [ESTADO.HISTORIA]: [ESTADO.JUGANDO, ESTADO.VICTORIA, ESTADO.MENU],
  [ESTADO.JUGANDO]: [ESTADO.PAUSA, ESTADO.DERROTA, ESTADO.HISTORIA, ESTADO.JUGANDO, ESTADO.MENU],
  [ESTADO.PAUSA]: [ESTADO.JUGANDO, ESTADO.MENU],
  [ESTADO.DERROTA]: [ESTADO.JUGANDO, ESTADO.MENU],
  [ESTADO.VICTORIA]: [ESTADO.MENU, ESTADO.HISTORIA]
};

class GameStateManager {
  constructor() {
    this.estado = ESTADO.CARGANDO;
  }

  cambiar(nuevo) {
    const permitidos = TRANSICIONES[this.estado] || [];
    if (!permitidos.includes(nuevo)) {
      // No se bloquea el juego, pero se avisa en consola para depurar
      console.warn(`Transición no prevista: ${this.estado} -> ${nuevo}`);
    }
    const anterior = this.estado;
    this.estado = nuevo;
    EventBus.emit('estado:cambio', { anterior, nuevo });
  }

  es(estado) {
    return this.estado === estado;
  }
}

export const estadoJuego = new GameStateManager();
