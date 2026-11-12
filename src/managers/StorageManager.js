/**
 * Persistencia con localStorage: récord, nivel alcanzado, partida guardada
 * y configuración de audio. Todo se guarda en una sola clave JSON.
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
  tutorialVisto: false // los carteles del Nivel 1 solo salen la primera vez
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
      return { ...structuredClone(PREDETERMINADO), ...leido, audio: { ...PREDETERMINADO.audio, ...leido.audio } };
    } catch (error) {
      console.warn('No se pudo leer localStorage:', error);
      return structuredClone(PREDETERMINADO);
    }
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
