/**
 * Máquina de estados finitos genérica y reutilizable.
 * La usan el jugador (quieto, corriendo, saltando...) y el jefe Uku (flotar, picada...).
 *
 * Cada estado es un objeto con funciones opcionales:
 *   entrar(datos)  -> se ejecuta una vez al entrar
 *   actualizar(dt) -> se ejecuta en cada fotograma (dt en segundos)
 *   salir()        -> se ejecuta una vez al salir
 * Las funciones se llaman con "this" apuntando al contexto (el objeto dueño).
 */
export default class StateMachine {
  constructor(contexto, estados, inicial = null) {
    this.contexto = contexto;
    this.estados = estados;
    this.actual = null;
    this.previo = null;
    this.tiempoEnEstado = 0; // segundos desde la última transición
    if (inicial) this.cambiar(inicial);
  }

  cambiar(nombre, datos) {
    if (!this.estados[nombre]) throw new Error(`Estado desconocido: ${nombre}`);
    if (this.actual === nombre) return;
    this.estados[this.actual]?.salir?.call(this.contexto);
    this.previo = this.actual;
    this.actual = nombre;
    this.tiempoEnEstado = 0;
    this.estados[nombre].entrar?.call(this.contexto, datos);
  }

  actualizar(dt) {
    this.tiempoEnEstado += dt;
    this.estados[this.actual]?.actualizar?.call(this.contexto, dt);
  }

  es(nombre) {
    return this.actual === nombre;
  }
}
