import { TOTAL_NIVELES } from '../data/levels.js';
/**
 * Persistencia con localStorage: récord, nivel alcanzado, partida guardada,
 * mejores resultados de cada nivel y configuración de audio.
 * Todo se guarda en una sola clave JSON.
 * Cada acceso va dentro de try/catch porque algunos navegadores (modo privado,
 * almacenamiento bloqueado) lanzan excepciones; en ese caso el juego sigue
 * funcionando con los datos en memoria.
 */
const CLAVE = 'kusi.fragmentos-del-sol.v1';

const PREDETERMINADO = {
  record: 0,
  nivelAlcanzado: 1,
  audio: { silencio: false, volumenMusica: 0.5, volumenEfectos: 0.8 },
  partida: null, // { nivel, puntos, vidas } al comenzar el último nivel alcanzado
  graficos: 'normal', // 'ligero' si el equipo no alcanzó 45 FPS
  tutorialVisto: false, // los carteles del Nivel 1 solo salen la primera vez
  // Mejores resultados por nivel, para el selector:
  // { 1: { puntos, fragmentos, total, segundos }, ... } (solo niveles completados)
  niveles: {}
};

class StorageManager {
  constructor() {
    this.datos = this.cargar();
  }

  cargar() {
    try {
      const texto = window.localStorage.getItem(CLAVE);
      if (!texto) return structuredClone(PREDETERMINADO);
      const leido = JSON.parse(texto);
      // Se mezcla con los valores por defecto por si faltan campos de versiones anteriores
      return this.validar({ ...structuredClone(PREDETERMINADO), ...leido, audio: { ...PREDETERMINADO.audio, ...leido.audio } });
    } catch (error) {
      console.warn('No se pudo leer localStorage:', error);
      return structuredClone(PREDETERMINADO);
    }
  }

  /**
   * Corrige o descarta lo que no tenga sentido en los datos leídos (guardados de otra
   * versión o editados a mano), para que el juego nunca se rompa al usarlos:
   * por ejemplo, una partida en un nivel que no existe dejaba la pantalla en negro.
   */
  validar(d) {
    const numero = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;
    const entero = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
    if (!numero(d.record, 0, Infinity)) d.record = 0;
    if (!entero(d.nivelAlcanzado, 1, TOTAL_NIVELES)) d.nivelAlcanzado = 1;
    if (!['normal', 'ligero'].includes(d.graficos)) d.graficos = 'normal';
    d.tutorialVisto = d.tutorialVisto === true;

    // Partida de "Continuar": se conserva solo si el nivel existe; puntos y vidas se completan si faltan
    const p = d.partida;
    d.partida = (p && entero(p.nivel, 1, TOTAL_NIVELES))
      ? { nivel: p.nivel, puntos: numero(p.puntos, 0, Infinity) ? p.puntos : 0, vidas: entero(p.vidas, 1, 99) ? p.vidas : 3 }
      : null;

    // Resultados por nivel: solo entradas completas de niveles que existen
    const niveles = {};
    if (d.niveles && typeof d.niveles === 'object') {
      for (const [clave, r] of Object.entries(d.niveles)) {
        const completo = r && ['puntos', 'fragmentos', 'total', 'segundos'].every((k) => numero(r[k], 0, Infinity));
        if (entero(Number(clave), 1, TOTAL_NIVELES) && completo) niveles[clave] = r;
      }
    }
    d.niveles = niveles;
    return d;
  }

  guardar() {
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(this.datos));
    } catch (error) {
      console.warn('No se pudo guardar en localStorage:', error);
    }
  }

  get record() { return this.datos.record; }
  get nivelAlcanzado() { return this.datos.nivelAlcanzado; }
  get audio() { return this.datos.audio; }
  get partida() { return this.datos.partida; }
  get graficosLigeros() { return this.datos.graficos === 'ligero'; }
  get tutorialVisto() { return this.datos.tutorialVisto; }

  /** Mejor resultado guardado de un nivel, o null si nunca se completó. */
  resultadoNivel(nivel) { return this.datos.niveles[nivel] ?? null; }

  /**
   * Guarda el resultado de un nivel completado, quedándose con lo mejor de cada
   * dato por separado: más puntos, más fragmentos y menos tiempo.
   * Devuelve true si mejoró el puntaje de ese nivel.
   */
  registrarResultadoNivel(nivel, { puntos, fragmentos, total, segundos }) {
    const previo = this.datos.niveles[nivel];
    const mejoroPuntaje = !previo || puntos > previo.puntos;
    this.datos.niveles[nivel] = previo
      ? {
          puntos: Math.max(previo.puntos, puntos),
          fragmentos: Math.max(previo.fragmentos, fragmentos),
          total,
          segundos: Math.min(previo.segundos, segundos)
        }
      : { puntos, fragmentos, total, segundos };
    this.guardar();
    return mejoroPuntaje;
  }

  /** Devuelve true si el puntaje supera el récord anterior. */
  actualizarRecord(puntos) {
    if (puntos <= this.datos.record) return false;
    this.datos.record = puntos;
    this.guardar();
    return true;
  }

  registrarNivel(nivel) {
    this.datos.nivelAlcanzado = Math.max(this.datos.nivelAlcanzado, nivel);
    this.guardar();
  }

  guardarPartida(partida) {
    this.datos.partida = { ...partida };
    this.guardar();
  }

  borrarPartida() {
    this.datos.partida = null;
    this.guardar();
  }

  guardarAudio(cambios) {
    this.datos.audio = { ...this.datos.audio, ...cambios };
    this.guardar();
  }

  guardarGraficos(modo) {
    this.datos.graficos = modo;
    this.guardar();
  }

  /** true: no se vuelve a mostrar el tutorial. false: se repite (botón en "Cómo jugar"). */
  marcarTutorialVisto(visto = true) {
    this.datos.tutorialVisto = visto;
    this.guardar();
  }

  /** Borra todo el progreso (útil para pruebas). */
  reiniciarTodo() {
    this.datos = structuredClone(PREDETERMINADO);
    this.guardar();
  }
}

export const almacen = new StorageManager();
