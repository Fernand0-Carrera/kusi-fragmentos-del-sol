import EventBus from './EventBus.js';
import { EVENTOS, JUGADOR } from '../config/constants.js';

/**
 * Datos de la partida en curso (no persistentes): nivel, puntos, vidas,
 * fragmentos recogidos y último punto de control. Cualquier cambio se anuncia
 * por el EventBus para que el HUD se actualice solo.
 */
class GameSession {
  constructor() {
    this.nueva();
  }

  nueva(nivel = 1, puntos = 0, vidas = JUGADOR.vidasIniciales) {
    this.nivel = nivel;
    this.puntos = puntos;
    this.vidas = vidas;
    this.puntosInicioNivel = puntos;
    this.vidasInicioNivel = vidas;
    this.fragmentos = 0;
    this.fragmentosTotales = 0;
    this.fragmentosPartida = 0;
    this.puntoControl = null;
    this.emitir();
  }

  /** Se llama al empezar cada nivel: guarda los valores para poder reintentarlo. */
  iniciarNivel(nivel, fragmentosTotales) {
    this.nivel = nivel;
    this.fragmentos = 0;
    this.fragmentosTotales = fragmentosTotales;
    this.puntoControl = null;
    this.puntosInicioNivel = this.puntos;
    this.vidasInicioNivel = this.vidas;
    this.emitir();
  }

  /** Reintento tras Game Over: vuelve a los puntos con que se empezó el nivel. */
  reintentarNivel() {
    this.puntos = this.puntosInicioNivel;
    this.vidas = JUGADOR.vidasIniciales;
    this.emitir();
  }

  sumarPuntos(cantidad) {
    this.puntos += cantidad;
    this.emitir();
  }

  recogerFragmento(valor) {
    this.fragmentos += 1;
    this.fragmentosPartida += 1;
    this.sumarPuntos(valor);
  }

  /** Devuelve true si aún quedan vidas. */
  perderVida() {
    this.vidas = Math.max(0, this.vidas - 1);
    this.emitir();
    return this.vidas > 0;
  }

  /** Devuelve false si ya estaba al máximo. */
  ganarVida() {
    if (this.vidas >= JUGADOR.vidasMaximas) return false;
    this.vidas += 1;
    this.emitir();
    return true;
  }

  emitir() {
    EventBus.emit(EVENTOS.SESION_CAMBIO, this);
  }
}

export const sesion = new GameSession();
